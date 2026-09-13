import Dexie, { type Table } from 'dexie';
import type { BodyWeightLog, Food, FoodLog, Meal, Settings, WorkoutPlan } from '../types';

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
  workoutPlans!: Table<WorkoutPlan, number>;
  meals!: Table<Meal, number>;

  constructor() {
    super(DATABASE_NAME);

    this.version(1).stores({
      foods: '++id, nameLower, barcode, updatedAt',
      foodLogs: '++id, date, foodId, createdAt',
      bodyWeightLogs: '++id, &date',
      settings: 'id',
    });

    // Adding a table is non-destructive. Dexie keeps every v1 store and all
    // existing nutrition data while creating the new workout-plan store.
    this.version(2).stores({
      foods: '++id, nameLower, barcode, updatedAt',
      foodLogs: '++id, date, foodId, createdAt',
      bodyWeightLogs: '++id, &date',
      settings: 'id',
      workoutPlans: '++id, creationMode, updatedAt',
    });

    // Meals add grouping metadata while historical flat food-log rows remain
    // untouched and continue to count toward daily totals.
    this.version(3).stores({
      foods: '++id, nameLower, barcode, updatedAt',
      foodLogs: '++id, date, foodId, mealId, createdAt',
      bodyWeightLogs: '++id, &date',
      settings: 'id',
      workoutPlans: '++id, creationMode, updatedAt',
      meals: '++id, date, category, [date+category], createdAt',
    });
  }
}

export const db = new GymTrackerDatabase();
