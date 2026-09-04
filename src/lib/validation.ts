import { z } from 'zod';
import { LIMITS } from './limits';

/* -------------------------------------------------------------------------
 * Primitives
 * ---------------------------------------------------------------------- */

/**
 * A number that is genuinely a number.
 *
 * z.number() alone still lets Infinity and -Infinity through in some
 * versions, and both survive a JSON round trip as null rather than being
 * rejected. The explicit Number.isFinite check removes any doubt.
 */
export const finiteNumber = z
  .number()
  .refine((value) => Number.isFinite(value), { message: 'Must be a finite number' });

export function boundedNumber(min: number, max: number) {
  return finiteNumber.min(min).max(max);
}

/**
 * Removes characters that have no business in a food name: C0 and C1
 * control codes, and the bidirectional overrides that can be used to make
 * stored text render differently from what it contains.
 */
export function sanitizeText(raw: string, maxLength: number): string {
  return (
    raw
      // Matching control characters is the entire point of this expression:
      // they are what is being removed, so no-control-regex does not apply.
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/gu, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, maxLength)
  );
}

export function boundedText(maxLength: number) {
  return z
    .string()
    .transform((value) => sanitizeText(value, maxLength))
    .pipe(z.string().max(maxLength));
}

/** YYYY-MM-DD, and a date that actually exists. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected a YYYY-MM-DD date')
  .refine((value) => {
    const [y, m, d] = value.split('-').map(Number) as [number, number, number];
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    const parsed = new Date(y, m - 1, d);
    return parsed.getFullYear() === y && parsed.getMonth() === m - 1 && parsed.getDate() === d;
  }, 'Not a real date');

/* -------------------------------------------------------------------------
 * Reading numbers out of text inputs
 * ---------------------------------------------------------------------- */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Parses what someone typed into a numeric field.
 *
 * The regex is the security control, not a convenience. It runs before
 * Number() and rejects exponent notation, hex literals, the strings
 * "Infinity" and "NaN", leading plus or minus, and whitespace padding
 * tricks, none of which should ever reach the database.
 */
const DECIMAL_INPUT = /^\d{1,7}(?:[.,]\d{1,4})?$/;

export function parseNumberInput(
  raw: string,
  { min, max, label }: { min: number; max: number; label: string },
): ParseResult<number> {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: `${label} is required` };
  if (!DECIMAL_INPUT.test(trimmed)) {
    return { ok: false, error: `${label} must be a plain number, for example 250 or 12.5` };
  }

  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value)) return { ok: false, error: `${label} must be a finite number` };
  if (value < min) return { ok: false, error: `${label} must be at least ${min}` };
  if (value > max) return { ok: false, error: `${label} must be ${max} or less` };

  return { ok: true, value };
}

/** Same rules, but an empty field yields undefined rather than an error. */
export function parseOptionalNumberInput(
  raw: string,
  options: { min: number; max: number; label: string },
): ParseResult<number | undefined> {
  if (raw.trim() === '') return { ok: true, value: undefined };
  return parseNumberInput(raw, options);
}

/* -------------------------------------------------------------------------
 * Barcodes
 * ---------------------------------------------------------------------- */

/**
 * GS1 modulo 10 check digit. The same weighting covers EAN-8, UPC-A and
 * EAN-13: walking the payload right to left, digits alternate weight 3 and 1.
 */
export function hasValidCheckDigit(barcode: string): boolean {
  const digits = [...barcode].map(Number);
  const check = digits.pop();
  if (check === undefined) return false;

  let sum = 0;
  for (let i = digits.length - 1, position = 0; i >= 0; i -= 1, position += 1) {
    sum += (digits[i] as number) * (position % 2 === 0 ? 3 : 1);
  }
  return (10 - (sum % 10)) % 10 === check;
}

/**
 * The only gate between user or camera input and a request URL.
 * Digits only, a length this app claims to support, and a valid check digit.
 */
export function validateBarcode(raw: string): ParseResult<string> {
  const trimmed = raw.trim();
  if (trimmed === '') return { ok: false, error: 'Enter a barcode number' };
  if (!/^\d+$/.test(trimmed)) return { ok: false, error: 'A barcode is digits only' };

  const allowed: readonly number[] = LIMITS.barcodeLengths;
  if (!allowed.includes(trimmed.length)) {
    return {
      ok: false,
      error: `That is ${trimmed.length} digits. Supported barcodes are 8, 12 or 13 digits.`,
    };
  }
  if (!hasValidCheckDigit(trimmed)) {
    return { ok: false, error: 'That barcode fails its check digit. Retype it or scan again.' };
  }

  return { ok: true, value: trimmed };
}

/* -------------------------------------------------------------------------
 * Stored record shapes
 *
 * Everything written to IndexedDB is parsed through these first, so a bad
 * record cannot enter the database from any path: forms, barcode import,
 * or file import.
 * ---------------------------------------------------------------------- */

export const foodSchema = z.object({
  id: z.number().int().positive().optional(),
  name: boundedText(LIMITS.nameMaxLength).pipe(z.string().min(1, 'Name is required')),
  brand: boundedText(LIMITS.brandMaxLength).optional(),
  source: z.enum(['custom', 'openfoodfacts']),
  barcode: z
    .string()
    .regex(/^\d{8}$|^\d{12}$|^\d{13}$/)
    .optional(),
  servingLabel: boundedText(LIMITS.servingLabelMaxLength).pipe(z.string().min(1)),
  servingGrams: boundedNumber(LIMITS.servingGramsMin, LIMITS.servingGramsMax).optional(),
  calories: boundedNumber(LIMITS.caloriesMin, LIMITS.caloriesMax),
  protein: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  carbs: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  fat: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  nameLower: z.string().max(LIMITS.nameMaxLength),
  createdAt: finiteNumber.int().nonnegative(),
  updatedAt: finiteNumber.int().nonnegative(),
});

export const foodLogSchema = z.object({
  id: z.number().int().positive().optional(),
  date: isoDateSchema,
  foodId: z.number().int().positive().optional(),
  amount: boundedNumber(LIMITS.amountServingsMin, LIMITS.amountGramsMax),
  unit: z.enum(['g', 'serving']),
  name: boundedText(LIMITS.nameMaxLength).pipe(z.string().min(1)),
  brand: boundedText(LIMITS.brandMaxLength).optional(),
  servingLabel: boundedText(LIMITS.servingLabelMaxLength),
  calories: boundedNumber(LIMITS.caloriesMin, LIMITS.caloriesMax),
  protein: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  carbs: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  fat: boundedNumber(LIMITS.macroMin, LIMITS.macroMax),
  createdAt: finiteNumber.int().nonnegative(),
  updatedAt: finiteNumber.int().nonnegative(),
});

export const bodyWeightLogSchema = z.object({
  id: z.number().int().positive().optional(),
  date: isoDateSchema,
  weightKg: boundedNumber(LIMITS.weightKgMin, LIMITS.weightKgMax),
  createdAt: finiteNumber.int().nonnegative(),
  updatedAt: finiteNumber.int().nonnegative(),
});

export const settingsSchema = z.object({
  id: z.string().min(1).max(32),
  calorieTarget: boundedNumber(LIMITS.calorieTargetMin, LIMITS.calorieTargetMax),
  proteinTarget: boundedNumber(LIMITS.macroTargetMin, LIMITS.macroTargetMax),
  carbTarget: boundedNumber(LIMITS.macroTargetMin, LIMITS.macroTargetMax),
  fatTarget: boundedNumber(LIMITS.macroTargetMin, LIMITS.macroTargetMax),
  weightUnit: z.enum(['kg', 'lb']),
  updatedAt: finiteNumber.int().nonnegative(),
});
