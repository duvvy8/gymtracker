import { z } from 'zod';
import { COFID_FOODS, type CofidFood } from '../data/cofid.ts';
import type { NutritionConfidence, Nutrients } from '../types/index.ts';
import { nutrientSchema, sanitizeText } from './validation.ts';

const confidenceSchema = z.enum(['high', 'medium', 'low']);

export const analysedComponentSchema = z
  .object({
    name: z.string().min(1).max(120),
    preparation: z.string().max(60).default(''),
    estimatedAmount: z.number().finite().min(0.1).max(5000),
    unit: z.enum(['g', 'ml']),
    portionConfidence: confidenceSchema,
    identityConfidence: confidenceSchema,
    uncertainty: z.string().max(240).default(''),
    nutritionLookupTerms: z.array(z.string().min(1).max(60)).max(6).default([]),
    possibleAliases: z.array(z.string().min(1).max(60)).max(6).default([]),
    nutritionPer100: nutrientSchema,
  })
  .strict();

export const analysedMealSchema = z
  .object({
    suggestedName: z.string().min(1).max(120),
    items: z.array(analysedComponentSchema).min(1).max(16),
  })
  .strict();

// Lookup hints steer the deterministic resolver only; they never reach the client.
export const resolvedComponentSchema = analysedComponentSchema
  .omit({ nutritionLookupTerms: true, possibleAliases: true })
  .extend({
    name: z.string().min(1).max(120),
    nutritionSource: z.enum(['cofid', 'ai-estimate']),
    referenceCode: z.string().max(24).optional(),
    referenceName: z.string().max(160).optional(),
    referenceUrl: z.string().url().optional(),
    nutritionBasis: nutrientSchema,
    basisUnit: z.enum(['100g', '100ml']),
  });

export const mealAnalysisResponseSchema = z
  .object({
    suggestedName: z.string().min(1).max(120),
    items: z.array(resolvedComponentSchema).min(1).max(16),
  })
  .strict();

export type AnalysedMeal = z.infer<typeof analysedMealSchema>;
export type MealAnalysisResponse = z.infer<typeof mealAnalysisResponseSchema>;

const normalise = (value: string) =>
  sanitizeText(value, 160)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function tokenScore(query: string, candidate: string): number {
  const wanted = new Set(
    normalise(query)
      .split(' ')
      .filter((token) => token.length > 2),
  );
  const available = new Set(
    normalise(candidate)
      .split(' ')
      .filter((token) => token.length > 2),
  );
  if (wanted.size === 0) return 0;
  let matches = 0;
  for (const token of wanted) if (available.has(token)) matches += 1;
  return matches / wanted.size;
}

export function resolveCofid(
  name: string,
  preparation = '',
  extraTerms: readonly string[] = [],
): {
  food: CofidFood;
  confidence: NutritionConfidence;
} | null {
  const queries = [normalise(`${name} ${preparation}`), ...extraTerms.map(normalise)].filter(
    (query) => query.length > 0,
  );
  let best: { food: CofidFood; score: number; exact: boolean } | undefined;
  for (const query of queries) {
    for (const food of COFID_FOODS) {
      for (const alias of food.aliases) {
        const cleaned = normalise(alias);
        const exact = query === cleaned || query.includes(cleaned);
        const score = exact ? 1 : tokenScore(query, cleaned);
        if (!best || score > best.score || (exact && !best.exact)) best = { food, score, exact };
      }
    }
  }
  if (!best || best.score < 0.67) return null;
  return { food: best.food, confidence: best.exact ? 'high' : 'medium' };
}

const CONFIDENCE_RANK: Record<NutritionConfidence, number> = { low: 0, medium: 1, high: 2 };

// A reference match proves where the numbers came from, not that the food was
// identified correctly, so it may lower the model's confidence but never raise it.
function leastConfident(a: NutritionConfidence, b: NutritionConfidence): NutritionConfidence {
  return CONFIDENCE_RANK[a] <= CONFIDENCE_RANK[b] ? a : b;
}

export function resolveAnalysedMeal(analysis: AnalysedMeal): MealAnalysisResponse {
  return {
    suggestedName: sanitizeText(analysis.suggestedName, 120),
    items: analysis.items.map(({ nutritionLookupTerms, possibleAliases, ...item }) => {
      const match = resolveCofid(item.name, item.preparation, [
        ...nutritionLookupTerms,
        ...possibleAliases,
      ]);
      const nutritionBasis: Nutrients = match
        ? { ...match.food.nutrients }
        : { ...item.nutritionPer100 };
      return {
        ...item,
        name: sanitizeText(item.name, 120),
        preparation: sanitizeText(item.preparation, 60),
        uncertainty: sanitizeText(item.uncertainty, 240),
        identityConfidence: match
          ? leastConfident(item.identityConfidence, match.confidence)
          : item.identityConfidence,
        nutritionSource: match ? 'cofid' : 'ai-estimate',
        ...(match
          ? {
              referenceCode: match.food.code,
              referenceName: match.food.name,
              referenceUrl:
                'https://www.gov.uk/government/publications/composition-of-foods-integrated-dataset-cofid',
            }
          : {}),
        nutritionBasis,
        basisUnit: match?.food.basisUnit ?? (item.unit === 'ml' ? '100ml' : '100g'),
      };
    }),
  };
}
