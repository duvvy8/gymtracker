import type { z } from 'zod';
import { db, DEFAULT_SETTINGS, SETTINGS_KEY } from './schema';
import { LIMITS } from '../lib/limits';
import {
  bodyWeightLogSchema,
  describeIssue,
  foodLogSchema,
  foodSchema,
  sanitizeText,
  settingsSchema,
  ValidationError,
} from '../lib/validation';
import type { BackupFile, BodyWeightLog, Food, FoodLog, IsoDate, Settings } from '../types';

/**
 * Every write in this module goes through a zod schema first. There is no
 * other path into IndexedDB, so a record that fails validation cannot be
 * stored no matter which screen or import produced it.
 */
function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, subject: string): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    // describeIssue keeps zod's dotted paths and internal phrasing out of the
    // interface. Anything shown here is a sentence, not a schema error.
    const reason = issue ? describeIssue(issue) : 'One of the values is not valid.';
    // ValidationError, not Error: the save screens show this message verbatim
    // and must be able to tell it apart from a raw storage failure.
    throw new ValidationError(`${subject} was not saved. ${reason}`);
  }
  return result.data;
}

/* -------------------------------------------------------------------------
 * Settings
 * ---------------------------------------------------------------------- */

export async function getSettings(): Promise<Settings> {
  const stored = await db.settings.get(SETTINGS_KEY);
  if (!stored) return { ...DEFAULT_SETTINGS };

  // A row written by an older or tampered-with build is replaced by the
  // defaults rather than being trusted.
  const result = settingsSchema.safeParse(stored);
  return result.success ? result.data : { ...DEFAULT_SETTINGS };
}

export type SettingsDraft = Omit<Settings, 'id' | 'updatedAt'>;

export async function saveSettings(draft: SettingsDraft): Promise<void> {
  const record = parseOrThrow(
    settingsSchema,
    { ...draft, id: SETTINGS_KEY, updatedAt: Date.now() },
    'Settings',
  );
  await db.settings.put(record);
}

/* -------------------------------------------------------------------------
 * Foods
 * ---------------------------------------------------------------------- */

export type FoodDraft = Omit<Food, 'id' | 'nameLower' | 'createdAt' | 'updatedAt'> & {
  id?: number;
};

export async function saveFood(draft: FoodDraft): Promise<number> {
  const now = Date.now();
  const existing = draft.id ? await db.foods.get(draft.id) : undefined;

  const candidate = {
    ...(draft.id ? { id: draft.id } : {}),
    name: draft.name,
    ...(draft.brand ? { brand: draft.brand } : {}),
    source: draft.source,
    ...(draft.barcode ? { barcode: draft.barcode } : {}),
    servingLabel: draft.servingLabel,
    ...(draft.servingGrams === undefined ? {} : { servingGrams: draft.servingGrams }),
    calories: draft.calories,
    protein: draft.protein,
    carbs: draft.carbs,
    fat: draft.fat,
    nameLower: sanitizeText(draft.name, LIMITS.nameMaxLength).toLowerCase(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const record = parseOrThrow(foodSchema, candidate, 'This food');
  return db.foods.put(record as Food);
}

export function getFood(id: number): Promise<Food | undefined> {
  return db.foods.get(id);
}

export function findFoodByBarcode(barcode: string): Promise<Food | undefined> {
  return db.foods.where('barcode').equals(barcode).first();
}

export function recentFoods(limit = 20): Promise<Food[]> {
  return db.foods.orderBy('updatedAt').reverse().limit(limit).toArray();
}

/**
 * Name and brand search over the local food list.
 *
 * Indexed prefix matches come first because they are what someone typing a
 * name expects to see. A bounded scan then adds substring matches, which is
 * acceptable at the scale of a single person's food list.
 */
export async function searchFoods(rawTerm: string, limit = 25): Promise<Food[]> {
  const term = sanitizeText(rawTerm, LIMITS.nameMaxLength).toLowerCase();
  if (term === '') return recentFoods(limit);

  const prefixMatches = await db.foods.where('nameLower').startsWith(term).limit(limit).toArray();
  if (prefixMatches.length >= limit) return prefixMatches;

  const seen = new Set(prefixMatches.map((food) => food.id));
  const remainder = await db.foods
    .filter(
      (food) =>
        !seen.has(food.id) &&
        (food.nameLower.includes(term) || (food.brand ?? '').toLowerCase().includes(term)),
    )
    .limit(limit - prefixMatches.length)
    .toArray();

  return [...prefixMatches, ...remainder];
}

export async function deleteFood(id: number): Promise<void> {
  await db.foods.delete(id);
}

export function countFoods(): Promise<number> {
  return db.foods.count();
}

/* -------------------------------------------------------------------------
 * Food log
 * ---------------------------------------------------------------------- */

export type FoodLogDraft = Omit<FoodLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: number };

export async function saveFoodLog(draft: FoodLogDraft): Promise<number> {
  const now = Date.now();
  const existing = draft.id ? await db.foodLogs.get(draft.id) : undefined;

  const candidate = {
    ...(draft.id ? { id: draft.id } : {}),
    date: draft.date,
    ...(draft.foodId === undefined ? {} : { foodId: draft.foodId }),
    amount: draft.amount,
    unit: draft.unit,
    name: draft.name,
    ...(draft.brand ? { brand: draft.brand } : {}),
    servingLabel: draft.servingLabel,
    calories: draft.calories,
    protein: draft.protein,
    carbs: draft.carbs,
    fat: draft.fat,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const record = parseOrThrow(foodLogSchema, candidate, 'This entry');
  return db.foodLogs.put(record as FoodLog);
}

export function listLogsForDate(date: IsoDate): Promise<FoodLog[]> {
  return db.foodLogs.where('date').equals(date).sortBy('createdAt');
}

/** Inclusive on both ends. */
export function listLogsBetween(fromDate: IsoDate, toDate: IsoDate): Promise<FoodLog[]> {
  return db.foodLogs.where('date').between(fromDate, toDate, true, true).toArray();
}

export async function deleteFoodLog(id: number): Promise<void> {
  await db.foodLogs.delete(id);
}

export function countFoodLogs(): Promise<number> {
  return db.foodLogs.count();
}

/* -------------------------------------------------------------------------
 * Body weight
 * ---------------------------------------------------------------------- */

/** One reading per day. Saving the same date again replaces it. */
export async function saveBodyWeight(date: IsoDate, weightKg: number): Promise<void> {
  const now = Date.now();
  const existing = await db.bodyWeightLogs.where('date').equals(date).first();

  const candidate = {
    ...(existing?.id ? { id: existing.id } : {}),
    date,
    weightKg,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const record = parseOrThrow(bodyWeightLogSchema, candidate, 'This weight');
  await db.bodyWeightLogs.put(record as BodyWeightLog);
}

export function listBodyWeights(): Promise<BodyWeightLog[]> {
  return db.bodyWeightLogs.orderBy('date').toArray();
}

export function listBodyWeightsBetween(
  fromDate: IsoDate,
  toDate: IsoDate,
): Promise<BodyWeightLog[]> {
  return db.bodyWeightLogs.where('date').between(fromDate, toDate, true, true).sortBy('date');
}

export async function deleteBodyWeight(id: number): Promise<void> {
  await db.bodyWeightLogs.delete(id);
}

export function countBodyWeights(): Promise<number> {
  return db.bodyWeightLogs.count();
}

/* -------------------------------------------------------------------------
 * Whole-database operations
 * ---------------------------------------------------------------------- */

export async function exportAll(): Promise<BackupFile> {
  const [foods, foodLogs, bodyWeightLogs, settings] = await Promise.all([
    db.foods.toArray(),
    db.foodLogs.toArray(),
    db.bodyWeightLogs.toArray(),
    db.settings.get(SETTINGS_KEY),
  ]);

  return {
    format: 'gymtracker-backup',
    version: 1,
    exportedAt: new Date().toISOString(),
    foods,
    foodLogs,
    bodyWeightLogs,
    settings: settings ?? null,
  };
}

/**
 * Replaces the entire database with the contents of a validated backup.
 *
 * The clear and the writes share one transaction, so a failure at any point
 * rolls the whole thing back and the existing data survives untouched.
 */
export async function replaceAllData(backup: BackupFile): Promise<void> {
  await db.transaction('rw', [db.foods, db.foodLogs, db.bodyWeightLogs, db.settings], async () => {
    await Promise.all([
      db.foods.clear(),
      db.foodLogs.clear(),
      db.bodyWeightLogs.clear(),
      db.settings.clear(),
    ]);

    if (backup.foods.length > 0) await db.foods.bulkAdd(backup.foods);
    if (backup.foodLogs.length > 0) await db.foodLogs.bulkAdd(backup.foodLogs);
    if (backup.bodyWeightLogs.length > 0) await db.bodyWeightLogs.bulkAdd(backup.bodyWeightLogs);
    if (backup.settings) await db.settings.put(backup.settings);
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.foods, db.foodLogs, db.bodyWeightLogs, db.settings], async () => {
    await Promise.all([
      db.foods.clear(),
      db.foodLogs.clear(),
      db.bodyWeightLogs.clear(),
      db.settings.clear(),
    ]);
  });
}
