import { KG_PER_LB } from './limits';
import type { Food, LogUnit, Macros, WeightUnit } from '../types';

export const ZERO_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fat: 0 };

/** Rounds for storage. Keeps one decimal so small servings do not vanish. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * How many servings `amount` represents.
 *
 * Returns null when the amount is expressed in grams but the food has no
 * known gram weight per serving, which is the one case the conversion
 * cannot be done. Callers surface that as a form error rather than guessing.
 */
export function servingMultiplier(food: Food, amount: number, unit: LogUnit): number | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'serving') return amount;
  if (!food.servingGrams || food.servingGrams <= 0) return null;
  return amount / food.servingGrams;
}

/** Nutrition totals for logging `amount` of `food`. */
export function scaleFood(food: Food, amount: number, unit: LogUnit): Macros | null {
  const multiplier = servingMultiplier(food, amount, unit);
  if (multiplier === null) return null;
  return {
    calories: round1(food.calories * multiplier),
    protein: round1(food.protein * multiplier),
    carbs: round1(food.carbs * multiplier),
    fat: round1(food.fat * multiplier),
  };
}

export function sumMacros(entries: readonly Macros[]): Macros {
  return entries.reduce<Macros>(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      protein: total.protein + entry.protein,
      carbs: total.carbs + entry.carbs,
      fat: total.fat + entry.fat,
    }),
    { ...ZERO_MACROS },
  );
}

/**
 * Energy contributed by each macronutrient, using the Atwater factors.
 * Used only for the macro split chart, never to overwrite logged calories,
 * which can legitimately differ from the sum of the macros.
 */
export const ATWATER = { protein: 4, carbs: 4, fat: 9 } as const;

export function energyFromMacros(macros: Macros): number {
  return macros.protein * ATWATER.protein + macros.carbs * ATWATER.carbs + macros.fat * ATWATER.fat;
}

/* -------------------------------------------------------------------------
 * Display formatting
 * ---------------------------------------------------------------------- */

const integerFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const oneDecimalFormat = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function formatCalories(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return integerFormat.format(Math.round(value));
}

export function formatGrams(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value < 10 ? oneDecimalFormat.format(value) : integerFormat.format(Math.round(value));
}

export function formatAmount(amount: number, unit: LogUnit, servingLabel: string): string {
  if (unit === 'g') return `${oneDecimalFormat.format(amount)} g`;
  const count = oneDecimalFormat.format(amount);
  return amount === 1 ? `1 x ${servingLabel}` : `${count} x ${servingLabel}`;
}

/** Progress toward a target, clamped to 0 for display purposes. */
export function progressPercent(value: number, target: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return 0;
  return Math.max(0, (value / target) * 100);
}

/* -------------------------------------------------------------------------
 * Body weight units
 *
 * Weight is stored in kilograms. The display unit is a preference, so every
 * conversion happens at the edge, never in the database.
 * ---------------------------------------------------------------------- */

export function kgToDisplay(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg / KG_PER_LB;
}

export function displayToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value * KG_PER_LB;
}

export function formatWeight(kg: number, unit: WeightUnit): string {
  return `${oneDecimalFormat.format(kgToDisplay(kg, unit))} ${unit}`;
}
