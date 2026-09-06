/** A calendar date in the user's local timezone, formatted YYYY-MM-DD. */
export type IsoDate = string;

export type FoodSource = 'custom' | 'openfoodfacts';

/**
 * A food the user can log. Nutrition figures are always "per one serving",
 * where a serving is described by servingLabel. Foods imported from Open
 * Food Facts use a 100 g serving, which is the basis that API reports.
 */
export interface Food {
  id?: number;
  name: string;
  brand?: string;
  source: FoodSource;
  /** Present only for foods imported by barcode. */
  barcode?: string;
  /** What one serving is, for example "100 g" or "1 bar (41 g)". */
  servingLabel: string;
  /** Grams in one serving, when known. Enables logging by weight. */
  servingGrams?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  /** Lower-cased name, indexed so search does not scan every record. */
  nameLower: string;
  createdAt: number;
  updatedAt: number;
}

export type LogUnit = 'g' | 'serving';

/**
 * One entry in the food log.
 *
 * The nutrition figures are a snapshot of the totals at the moment the entry
 * was saved, not a reference to the food. Editing or deleting a food later
 * therefore cannot rewrite history.
 */
export interface FoodLog {
  id?: number;
  date: IsoDate;
  /** The food this came from, if it still exists. Kept for re-editing. */
  foodId?: number;
  /** The amount the user entered, in `unit`. */
  amount: number;
  unit: LogUnit;
  name: string;
  brand?: string;
  servingLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt: number;
  updatedAt: number;
}

export interface BodyWeightLog {
  id?: number;
  /** One entry per day. Re-saving the same date overwrites it. */
  date: IsoDate;
  /** Always stored in kilograms. Display unit is a separate preference. */
  weightKg: number;
  createdAt: number;
  updatedAt: number;
}

export type WeightUnit = 'kg' | 'lb';

export interface Settings {
  /** Single-row table. The key is always SETTINGS_KEY. */
  id: string;
  calorieTarget: number;
  proteinTarget: number;
  carbTarget: number;
  fatTarget: number;
  weightUnit: WeightUnit;
  updatedAt: number;
}

/** The four figures the app adds up and charts. */
export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export type MachineId =
  | 'G3-S10'
  | 'G3-S12'
  | 'G3-S20'
  | 'G3-S21'
  | 'G3-S30'
  | 'G3-S31'
  | 'G3-S40'
  | 'G3-S42'
  | 'G3-S51'
  | 'G3-S60'
  | 'G3-S70'
  | 'G3-S71'
  | 'G3-S72'
  | 'G3-S73'
  | 'G3-S74'
  | 'G3-S75';

export type MachineRegion = 'Chest' | 'Back' | 'Shoulders' | 'Arms' | 'Core' | 'Legs';

export interface MuscleEmphasis {
  muscle: string;
  percent: number;
  role: 'primary' | 'secondary';
}

export interface GymMachine {
  id: MachineId;
  displayName: string;
  imagePath?: string;
  alt: string;
  aliases: readonly string[];
  exerciseIds: readonly string[];
  region: MachineRegion;
  emphasis: readonly MuscleEmphasis[];
  enabled: boolean;
  /** Reserved for location-specific or equivalent equipment later. */
  alternatives: readonly MachineId[];
}

export type ExerciseEquipment = 'machine' | 'bodyweight' | 'dumbbell' | 'barbell';

export interface ExerciseDefinition {
  id: string;
  name: string;
  equipment: ExerciseEquipment;
  primaryMuscles: readonly string[];
  secondaryMuscles: readonly string[];
  /** Ordered so the first entry is the canonical machine shown today. */
  machineIds: readonly MachineId[];
  setup: string;
  instructions: readonly string[];
}

export type WorkoutGoal = 'general' | 'muscle' | 'strength' | 'endurance';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';
export type WorkoutCreationMode = 'manual' | 'automated';
export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface PlannedExercise {
  id: string;
  exerciseId: string;
  /** Snapshots keep a saved plan understandable if the catalogue changes. */
  name: string;
  equipment: ExerciseEquipment;
  machineIds: MachineId[];
  sets: number;
  repsMin: number;
  repsMax: number;
  restSeconds?: number;
  notes?: string;
}

export interface WorkoutDay {
  id: string;
  weekday: Weekday;
  name: string;
  exercises: PlannedExercise[];
}

export interface WorkoutPlan {
  id?: number;
  name: string;
  creationMode: WorkoutCreationMode;
  goal: WorkoutGoal;
  experience: ExperienceLevel;
  sessionMinutes: number;
  priorityRegions: MachineRegion[];
  availableMachineIds: MachineId[];
  days: WorkoutDay[];
  createdAt: number;
  updatedAt: number;
}

export interface PlannerPreferences {
  name: string;
  goal: WorkoutGoal;
  experience: ExperienceLevel;
  sessionMinutes: number;
  trainingDays: Weekday[];
  priorityRegions: MachineRegion[];
  availableMachineIds: MachineId[];
}

/** Shape of an export file, and of anything accepted by import. */
export interface BackupFile {
  format: 'gymtracker-backup';
  version: 2;
  exportedAt: string;
  foods: Food[];
  foodLogs: FoodLog[];
  bodyWeightLogs: BodyWeightLog[];
  settings: Settings | null;
  workoutPlans: WorkoutPlan[];
}
