import { z } from 'zod';
import { getJson, HttpError } from './http';
import { LIMITS } from './limits';
import { sanitizeText, validateBarcode } from './validation';
import type { FoodFormValues } from './foodFormValues';

/**
 * Open Food Facts lookup.
 *
 * Endpoint, headers, CORS behaviour and rate limits were confirmed against
 * the live API rather than assumed:
 *
 *   GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=...
 *
 *   - Access-Control-Allow-Origin is "*" on both the GET and the OPTIONS
 *     preflight, so this works from the browser.
 *   - Open Food Facts asks callers to identify themselves with a custom
 *     User-Agent. Browsers forbid setting that header from fetch, and the
 *     API's Access-Control-Allow-Headers list names X-User-Agent, which is
 *     the header browsers are expected to use instead. The preflight is
 *     cached for 20 days (Access-Control-Max-Age: 1728000), so it costs one
 *     extra request roughly every three weeks.
 *   - A product that does not exist returns HTTP 200 with status 0 and no
 *     `product` key. The HTTP status alone is not a sufficient check, so the
 *     presence of a valid `product` is what decides success here.
 *   - Documented rate limit: 15 requests per minute per IP for product
 *     reads. Pacing below limits this tab to at most 15 starts per minute.
 *     Other tabs and devices on the same IP can still cause a server 429.
 */

const ORIGIN = 'https://world.openfoodfacts.org';

/** Only the fields this app uses are requested, so less data crosses the wire. */
const FIELDS = [
  'code',
  'product_name',
  'product_name_en',
  'generic_name',
  'brands',
  'nutriments',
].join(',');

const APP_IDENTIFIER = 'gymtracker/0.1.0 (https://github.com/duvvy8/gymtracker)';

/** Open Food Facts is inconsistent about numbers versus numeric strings. */
const offNumber = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .regex(/^\d+(?:[.,]\d+)?$/),
  ])
  .transform((value) =>
    typeof value === 'number' ? value : Number(value.trim().replace(',', '.')),
  )
  .refine((value) => Number.isFinite(value) && value >= 0 && value <= 100000, {
    message: 'Nutrition value out of range',
  });

const offText = z.string().max(400);

/**
 * Unknown keys are stripped by zod rather than carried along, which is the
 * point: the live response has well over a hundred fields and none of the
 * others should reach application state or the database.
 */
const nutrimentsSchema = z.object({
  'energy-kcal_100g': offNumber.optional(),
  'energy-kj_100g': offNumber.optional(),
  proteins_100g: offNumber.optional(),
  carbohydrates_100g: offNumber.optional(),
  fat_100g: offNumber.optional(),
});

const productSchema = z.object({
  code: z.string().max(32).optional(),
  product_name: offText.optional(),
  product_name_en: offText.optional(),
  generic_name: offText.optional(),
  brands: offText.optional(),
  nutriments: nutrimentsSchema.optional(),
});

const responseSchema = z.object({
  code: z.string().max(32).optional(),
  status: z.union([z.literal(0), z.literal(1), z.literal('0'), z.literal('1')]),
  status_verbose: z.string().max(300).optional(),
  product: productSchema.optional(),
});

const KJ_PER_KCAL = 4.184;

export type LookupResult =
  | { outcome: 'found'; barcode: string; values: FoodFormValues; missingNutrition: boolean }
  | { outcome: 'not-found'; barcode: string }
  | { outcome: 'error'; message: string };

/**
 * Local throttle. The documented server limit is 15 product reads per minute
 * per IP. A small margin keeps a single tab below that rate. This cannot
 * coordinate other devices sharing the same public IP.
 */
const MIN_MS_BETWEEN_LOOKUPS = 4100;
let lastLookupAt = -Infinity;

function buildUrl(barcode: string): string {
  // barcode has already passed validateBarcode, so it is digits only. It is
  // still encoded, because building a URL from unencoded input is the habit
  // that eventually goes wrong.
  return `${ORIGIN}/api/v2/product/${encodeURIComponent(barcode)}?fields=${encodeURIComponent(FIELDS)}`;
}

function pickName(product: z.infer<typeof productSchema>): string {
  const candidate =
    product.product_name?.trim() ||
    product.product_name_en?.trim() ||
    product.generic_name?.trim() ||
    '';
  return sanitizeText(candidate, LIMITS.nameMaxLength);
}

function pickBrand(product: z.infer<typeof productSchema>): string {
  // "brands" is a comma separated list. The first entry is the primary one.
  const first = (product.brands ?? '').split(',')[0] ?? '';
  return sanitizeText(first, LIMITS.brandMaxLength);
}

function energyKcalPer100g(
  nutriments: z.infer<typeof nutrimentsSchema> | undefined,
): number | null {
  if (!nutriments) return null;
  const kcal = nutriments['energy-kcal_100g'];
  if (kcal !== undefined) return kcal;
  const kj = nutriments['energy-kj_100g'];
  if (kj !== undefined) return kj / KJ_PER_KCAL;
  return null;
}

function roundTo(value: number, places: number): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/**
 * Looks up a barcode and returns form values for review.
 *
 * Nothing is written to the database here. The result prefills the food
 * form so the figures are seen and confirmed before they are saved, and so
 * a sparse or wrong Open Food Facts record can be corrected first.
 */
export async function lookupBarcode(rawBarcode: string): Promise<LookupResult> {
  const validated = validateBarcode(rawBarcode);
  if (!validated.ok) return { outcome: 'error', message: validated.error };

  const barcode = validated.value;

  const now = performance.now();
  if (now - lastLookupAt < MIN_MS_BETWEEN_LOOKUPS) {
    return {
      outcome: 'error',
      message: 'Please wait a few seconds before looking up another barcode.',
    };
  }

  let payload: unknown;
  try {
    lastLookupAt = now;
    payload = await getJson(buildUrl(barcode), {
      timeoutMs: 8000,
      // Browsers refuse to set User-Agent from fetch. X-User-Agent is the
      // header Open Food Facts allows through CORS for exactly this case.
      headers: { 'X-User-Agent': APP_IDENTIFIER },
    });
  } catch (cause) {
    if (cause instanceof HttpError && cause.kind === 'not-found') {
      return { outcome: 'not-found', barcode };
    }
    return {
      outcome: 'error',
      message: cause instanceof HttpError ? cause.message : 'That lookup did not work. Try again.',
    };
  }

  const parsed = responseSchema.safeParse(payload);
  if (!parsed.success) {
    // The response did not match the shape this app understands, so it is
    // discarded rather than partially trusted.
    return {
      outcome: 'error',
      message: 'Open Food Facts sent something this app could not read. Add the food by hand.',
    };
  }

  const product = parsed.data.product;
  if (parsed.data.status === 0 || parsed.data.status === '0') {
    return { outcome: 'not-found', barcode };
  }
  if (!product) {
    return {
      outcome: 'error',
      message: 'The product response was incomplete. Add the food manually.',
    };
  }
  if ([parsed.data.code, product.code].some((code) => code !== undefined && code !== barcode)) {
    return {
      outcome: 'error',
      message: 'The returned product did not match that barcode. Add the food manually.',
    };
  }

  const name = pickName(product);
  if (name === '') return { outcome: 'not-found', barcode };

  const nutriments = product.nutriments;
  const kcal = energyKcalPer100g(nutriments);
  const protein = nutriments?.proteins_100g;
  const carbs = nutriments?.carbohydrates_100g;
  const fat = nutriments?.fat_100g;

  // Built one field at a time. The validated object is never spread, so no
  // key can travel from the response into application state by accident.
  const values: FoodFormValues = {
    name,
    brand: pickBrand(product),
    servingLabel: '100 g',
    servingGrams: '100',
    calories: kcal === null ? '' : String(roundTo(kcal, 0)),
    protein: protein === undefined ? '' : String(roundTo(protein, 1)),
    carbs: carbs === undefined ? '' : String(roundTo(carbs, 1)),
    fat: fat === undefined ? '' : String(roundTo(fat, 1)),
  };

  const missingNutrition =
    values.calories === '' || values.protein === '' || values.carbs === '' || values.fat === '';

  return { outcome: 'found', barcode, values, missingNutrition };
}
