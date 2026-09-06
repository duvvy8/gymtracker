/**
 * Every bound the application enforces, in one place.
 *
 * These exist for two reasons. Sane upper bounds stop a typo from producing
 * a nonsense chart, and hard string caps stop unbounded growth of the
 * IndexedDB store, which has no server-side quota to fall back on.
 */
export const LIMITS = {
  /** Characters. Food names from barcode labels can be long, but not endless. */
  nameMaxLength: 120,
  brandMaxLength: 80,
  servingLabelMaxLength: 60,

  /** Barcode symbologies this app accepts: EAN-8, UPC-A, EAN-13. */
  barcodeLengths: [8, 12, 13] as const,

  /** Kilocalories in one serving. */
  caloriesMin: 0,
  caloriesMax: 20000,

  /** Grams of a macronutrient in one serving. */
  macroMin: 0,
  macroMax: 2000,

  /** Grams in one serving. */
  servingGramsMin: 0.1,
  servingGramsMax: 100000,

  /** What the user may log at once. */
  amountGramsMin: 0.1,
  amountGramsMax: 100000,
  amountServingsMin: 0.01,
  amountServingsMax: 1000,

  /** Body weight, stored in kilograms. */
  weightKgMin: 10,
  weightKgMax: 700,

  /** Daily targets. */
  calorieTargetMin: 500,
  calorieTargetMax: 20000,
  macroTargetMin: 0,
  macroTargetMax: 2000,

  /** Ceiling on the number of records a single import may create. */
  importMaxRecordsPerTable: 50000,
} as const;

/** Kilograms in one pound, for the display unit conversion. */
export const KG_PER_LB = 0.45359237;
