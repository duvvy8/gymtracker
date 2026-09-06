import { z } from 'zod';
import { LIMITS } from './limits.ts';

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

export const machineIdSchema = z.enum([
  'G3-S10',
  'G3-S12',
  'G3-S20',
  'G3-S21',
  'G3-S30',
  'G3-S31',
  'G3-S40',
  'G3-S42',
  'G3-S51',
  'G3-S60',
  'G3-S70',
  'G3-S71',
  'G3-S72',
  'G3-S73',
  'G3-S74',
  'G3-S75',
]);

export const machineRegionSchema = z.enum(['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs']);
export const workoutGoalSchema = z.enum(['general', 'muscle', 'strength', 'endurance']);
export const experienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const weekdaySchema = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);

export const plannedExerciseSchema = z
  .object({
    id: boundedText(LIMITS.localIdMaxLength).pipe(z.string().min(1)),
    exerciseId: boundedText(LIMITS.localIdMaxLength).pipe(z.string().min(1)),
    name: boundedText(LIMITS.nameMaxLength).pipe(z.string().min(1)),
    equipment: z.enum(['machine', 'bodyweight', 'dumbbell', 'barbell']),
    machineIds: z.array(machineIdSchema).max(8),
    sets: finiteNumber.int().min(LIMITS.setsMin).max(LIMITS.setsMax),
    repsMin: finiteNumber.int().min(LIMITS.repsMin).max(LIMITS.repsMax),
    repsMax: finiteNumber.int().min(LIMITS.repsMin).max(LIMITS.repsMax),
    restSeconds: finiteNumber
      .int()
      .min(LIMITS.restSecondsMin)
      .max(LIMITS.restSecondsMax)
      .optional(),
    notes: boundedText(LIMITS.workoutNoteMaxLength).optional(),
  })
  .refine((entry) => entry.repsMax >= entry.repsMin, {
    path: ['repsMax'],
    message: 'Maximum reps must be at least minimum reps',
  })
  .refine((entry) => entry.equipment === 'machine' || entry.machineIds.length === 0, {
    path: ['machineIds'],
    message: 'Only machine exercises can reference a machine',
  });

export const workoutDaySchema = z.object({
  id: boundedText(LIMITS.localIdMaxLength).pipe(z.string().min(1)),
  weekday: weekdaySchema,
  name: boundedText(LIMITS.workoutDayNameMaxLength).pipe(z.string().min(1)),
  exercises: z.array(plannedExerciseSchema).max(LIMITS.exercisesPerDayMax),
});

export const workoutPlanSchema = z.object({
  id: z.number().int().positive().optional(),
  name: boundedText(LIMITS.workoutNameMaxLength).pipe(z.string().min(1)),
  creationMode: z.enum(['manual', 'automated']),
  goal: workoutGoalSchema,
  experience: experienceLevelSchema,
  sessionMinutes: finiteNumber.int().min(LIMITS.sessionMinutesMin).max(LIMITS.sessionMinutesMax),
  priorityRegions: z.array(machineRegionSchema).max(6),
  availableMachineIds: z.array(machineIdSchema).max(16),
  days: z.array(workoutDaySchema).min(1).max(LIMITS.workoutDaysMax),
  createdAt: finiteNumber.int().nonnegative(),
  updatedAt: finiteNumber.int().nonnegative(),
});

/* -------------------------------------------------------------------------
 * Turning a schema failure into something worth reading
 * ---------------------------------------------------------------------- */

const FIELD_LABELS: Record<string, string> = {
  amount: 'Amount',
  barcode: 'Barcode',
  brand: 'Brand',
  calorieTarget: 'Calorie target',
  calories: 'Calories',
  carbTarget: 'Carb target',
  carbs: 'Carbs',
  date: 'Date',
  fat: 'Fat',
  fatTarget: 'Fat target',
  name: 'Name',
  protein: 'Protein',
  proteinTarget: 'Protein target',
  servingGrams: 'Serving weight',
  servingLabel: 'Serving description',
  sets: 'Sets',
  repsMin: 'Minimum reps',
  repsMax: 'Maximum reps',
  restSeconds: 'Rest time',
  sessionMinutes: 'Session duration',
  priorityRegions: 'Muscle priorities',
  availableMachineIds: 'Available machines',
  days: 'Training days',
  exercises: 'Exercises',
  unit: 'Unit',
  weightKg: 'Weight',
};

/**
 * A validation failure whose message was written for a person to read.
 *
 * The save paths catch a rejected write and show `cause.message`. That is only
 * safe when the app wrote the message: a raw Dexie or DOM failure (quota
 * exceeded, database closed, a constraint error) is also an Error, and its
 * text is library output that should never reach the interface. Tagging the
 * intentional ones lets the UI tell the two apart.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * True when this error carries a message written for a person.
 *
 * Checked by name rather than with instanceof, which breaks across module
 * realms and after a bundler duplicates a class.
 */
export function isValidationError(cause: unknown): cause is Error {
  return cause instanceof Error && cause.name === 'ValidationError';
}

/**
 * A sentence a person can act on, built from a zod issue.
 *
 * The raw issue is developer output: it carries a dotted path with array
 * indices ("foodLogs.3.calories") and phrasing like "Too big: expected number
 * to be <=20000". None of that belongs in front of a user, so the field is
 * mapped to its visible label and the reason to plain language.
 */
export function describeIssue(issue: { code?: string; path?: PropertyKey[]; message?: string }) {
  const key = [...(issue.path ?? [])].reverse().find((part) => typeof part === 'string');
  const label = (typeof key === 'string' && FIELD_LABELS[key]) || 'One of the values';

  switch (issue.code) {
    case 'too_big':
      return `${label} is larger than this app accepts.`;
    case 'too_small':
      return `${label} is smaller than this app accepts.`;
    case 'invalid_type':
      return `${label} is not a number this app can use.`;
    case 'invalid_value':
    case 'invalid_format':
      return `${label} is not in a format this app recognises.`;
    default:
      // Custom refinements already carry a human message, so use it as-is.
      return issue.message && !/expected|received/i.test(issue.message)
        ? `${label}: ${issue.message}`
        : `${label} is not valid.`;
  }
}
