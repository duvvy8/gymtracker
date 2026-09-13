/**
 * The Gemini models offered for meal-photo analysis.
 *
 * The free tier meters requests per project *per model*, so each entry here
 * carries its own daily allowance. Switching model is therefore a genuine way
 * to keep working once one has hit its limit, not merely a quality trade.
 *
 * Every listed model accepts image input, supports structured output and
 * accepts `thinkingConfig.thinkingLevel`, so the Worker can send one request
 * shape for all of them. The list is deliberately a closed set: the Worker
 * validates the client's choice against it and falls back to the default,
 * so a request can never point the key at an arbitrary model.
 */

export interface MealModel {
  id: string;
  label: string;
  note: string;
}

export const MEAL_MODELS = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    note: 'Most capable. Best at breaking a plate into separate foods.',
  },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash', note: 'Previous generation.' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash', note: 'Older, still strong.' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', note: 'Older again.' },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash Lite',
    note: 'Lightest. Quickest, and the least accurate on complex plates.',
  },
] as const satisfies readonly MealModel[];

export type MealModelId = (typeof MEAL_MODELS)[number]['id'];

export const DEFAULT_MEAL_MODEL: MealModelId = 'gemini-3.8-flash';

/** The header the browser uses to ask for a model. Never trusted as given. */
export const MEAL_MODEL_HEADER = 'x-meal-model';

export function isMealModelId(value: unknown): value is MealModelId {
  return (
    typeof value === 'string' && MEAL_MODELS.some((model) => (model.id as string) === value)
  );
}

/** Narrows anything at all to a model this app is willing to call. */
export function resolveMealModel(value: unknown): MealModelId {
  return isMealModelId(value) ? value : DEFAULT_MEAL_MODEL;
}

export function mealModelLabel(id: MealModelId): string {
  return MEAL_MODELS.find((model) => model.id === id)?.label ?? id;
}
