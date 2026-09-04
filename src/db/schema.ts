import Dexie, { type Table } from 'dexie';
import type { BodyWeightLog, Food, FoodLog, Settings } from '../types';

export const DATABASE_NAME = 'gymtracker';

/** The settings table holds exactly one row, under this key. */
export const SETTINGS_KEY = 'user';

export const DEFAULT_SETTINGS: Settings = {
  id: SETTINGS_KEY,
  calorieTarget: 2200,
  proteinTarget: 150,
  carbTarget: 220,
  fatTarget: 70,
  weightUnit: 'kg',
  updatedAt: 0,
};

/**
 * IndexedDB store for the whole application. There is no server component,
 * so this database is the only copy of the user's data.
 *
 * Indexes are chosen for the three access patterns the app actually has:
 * one day's log, a date range for the charts, and a name or barcode lookup
 * when adding food.
 */
export class GymTrackerDatabase extends Dexie {
  foods!: Table<Food, number>;
  foodLogs!: Table<FoodLog, number>;
  bodyWeightLogs!: Table<BodyWeightLog, number>;
  settings!: Table<Settings, string>;

  constructor() {
    super(DATABASE_NAME);

    this.version(1).stores({
      foods: '++id, nameLower, barcode, updatedAt',
      foodLogs: '++id, date, foodId, createdAt',
      bodyWeightLogs: '++id, &date',
      settings: 'id',
    });
  }
}

export const db = new GymTrackerDatabase();
