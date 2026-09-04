import { z } from 'zod';
import { LIMITS } from './limits';
import {
  bodyWeightLogSchema,
  foodLogSchema,
  foodSchema,
  settingsSchema,
  type ParseResult,
} from './validation';
import type { BackupFile, BodyWeightLog, Food, FoodLog, Settings } from '../types';

/**
 * Export and import of the whole database.
 *
 * Import is the one place a file chosen by the user is turned into database
 * records, so it is the most exposed surface in the application. The order
 * is deliberate and every step has to pass before the next runs:
 *
 *   1. Refuse a file that is too large to be a plausible backup.
 *   2. JSON.parse inside a try/catch.
 *   3. Walk the parsed value and reject __proto__, constructor or
 *      prototype appearing as a key at any depth.
 *   4. Validate the whole structure with zod, including per-table caps.
 *   5. Rebuild every record field by field. Nothing untrusted is spread
 *      into an object, and no parsed object reaches the database by
 *      reference.
 *   6. Write everything in a single transaction, so a failure leaves the
 *      existing data exactly as it was.
 *
 * Steps 1 to 5 are here. Step 6 is replaceAllData in db/queries.ts.
 */

/** Larger than any believable personal backup, and small enough to parse safely. */
const MAX_FILE_BYTES = 20 * 1024 * 1024;

/** Guards against a hand-built file with absurd nesting. */
const MAX_DEPTH = 12;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Looks for prototype-pollution keys anywhere in the parsed value.
 *
 * JSON.parse defines __proto__ as an ordinary own property rather than
 * invoking the setter, so it is visible to getOwnPropertyNames and can be
 * found here. Rejecting the file outright is safer than stripping the key,
 * because a file containing one is not a backup this app wrote.
 */
export function findForbiddenKey(value: unknown, depth = 0): string | null {
  if (depth > MAX_DEPTH) return 'a structure nested too deeply';

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findForbiddenKey(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (value !== null && typeof value === 'object') {
    for (const key of Object.getOwnPropertyNames(value)) {
      if (FORBIDDEN_KEYS.has(key)) return key;
      const child = (value as Record<string, unknown>)[key];
      const found = findForbiddenKey(child, depth + 1);
      if (found) return found;
    }
  }

  return null;
}

const backupSchema = z.object({
  format: z.literal('gymtracker-backup'),
  version: z.literal(1),
  exportedAt: z.string().max(64).optional(),
  foods: z.array(foodSchema).max(LIMITS.importMaxRecordsPerTable),
  foodLogs: z.array(foodLogSchema).max(LIMITS.importMaxRecordsPerTable),
  bodyWeightLogs: z.array(bodyWeightLogSchema).max(LIMITS.importMaxRecordsPerTable),
  settings: settingsSchema.nullish(),
});

type ValidatedBackup = z.infer<typeof backupSchema>;

/* -------------------------------------------------------------------------
 * Field-by-field rebuilding
 *
 * Each record below is constructed by naming every property. No spread of
 * validated input, no Object.assign, no reuse of the parsed object.
 * ---------------------------------------------------------------------- */

function rebuildFood(input: ValidatedBackup['foods'][number]): Food {
  const food: Food = {
    name: input.name,
    source: input.source,
    servingLabel: input.servingLabel,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    nameLower: input.nameLower,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
  if (input.id !== undefined) food.id = input.id;
  if (input.brand !== undefined) food.brand = input.brand;
  if (input.barcode !== undefined) food.barcode = input.barcode;
  if (input.servingGrams !== undefined) food.servingGrams = input.servingGrams;
  return food;
}

function rebuildFoodLog(input: ValidatedBackup['foodLogs'][number]): FoodLog {
  const log: FoodLog = {
    date: input.date,
    amount: input.amount,
    unit: input.unit,
    name: input.name,
    servingLabel: input.servingLabel,
    calories: input.calories,
    protein: input.protein,
    carbs: input.carbs,
    fat: input.fat,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
  if (input.id !== undefined) log.id = input.id;
  if (input.foodId !== undefined) log.foodId = input.foodId;
  if (input.brand !== undefined) log.brand = input.brand;
  return log;
}

function rebuildBodyWeight(input: ValidatedBackup['bodyWeightLogs'][number]): BodyWeightLog {
  const entry: BodyWeightLog = {
    date: input.date,
    weightKg: input.weightKg,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
  if (input.id !== undefined) entry.id = input.id;
  return entry;
}

function rebuildSettings(input: NonNullable<ValidatedBackup['settings']>): Settings {
  return {
    id: input.id,
    calorieTarget: input.calorieTarget,
    proteinTarget: input.proteinTarget,
    carbTarget: input.carbTarget,
    fatTarget: input.fatTarget,
    weightUnit: input.weightUnit,
    updatedAt: input.updatedAt,
  };
}

/* -------------------------------------------------------------------------
 * Parsing
 * ---------------------------------------------------------------------- */

export function parseBackup(text: string): ParseResult<BackupFile> {
  if (text.length > MAX_FILE_BYTES) {
    return { ok: false, error: 'That file is too large to be a gymtracker backup.' };
  }
  if (text.trim() === '') {
    return { ok: false, error: 'That file is empty.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: 'That file is not valid JSON, so nothing was changed.' };
  }

  const forbidden = findForbiddenKey(parsed);
  if (forbidden !== null) {
    return {
      ok: false,
      error: `That file contains ${forbidden} as a key, which a gymtracker backup never does. It was rejected.`,
    };
  }

  const result = backupSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const where = issue?.path.length ? ` at ${issue.path.join('.')}` : '';
    return {
      ok: false,
      error: `That file is not a gymtracker backup${where}. Nothing was changed.`,
    };
  }

  const data = result.data;
  return {
    ok: true,
    value: {
      format: 'gymtracker-backup',
      version: 1,
      exportedAt: data.exportedAt ?? new Date().toISOString(),
      foods: data.foods.map(rebuildFood),
      foodLogs: data.foodLogs.map(rebuildFoodLog),
      bodyWeightLogs: data.bodyWeightLogs.map(rebuildBodyWeight),
      settings: data.settings ? rebuildSettings(data.settings) : null,
    },
  };
}

/* -------------------------------------------------------------------------
 * Export
 * ---------------------------------------------------------------------- */

export function serializeBackup(backup: BackupFile): string {
  return `${JSON.stringify(backup, null, 2)}\n`;
}

export function backupFileName(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `gymtracker-backup-${year}-${month}-${day}.json`;
}

/**
 * Saves text as a file the browser downloads.
 *
 * The blob URL is created and revoked in the same task, so the data does
 * not linger in memory attached to the document. Nothing is uploaded: the
 * blob is local and the anchor is never added to the page.
 */
export function downloadTextFile(fileName: string, text: string, mimeType = 'application/json') {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}
