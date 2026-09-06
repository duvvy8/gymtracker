import {
  availableExercises,
  EXERCISES,
  getExercise,
  primaryMachineForExercise,
} from '../data/exercises.ts';
import type {
  ExperienceLevel,
  ExerciseDefinition,
  MachineRegion,
  PlannedExercise,
  PlannerPreferences,
  Weekday,
  WorkoutGoal,
  WorkoutPlan,
} from '../types';

export type WorkoutPlanDraft = Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>;

/** A future remote or local planner only needs to implement this boundary. */
export interface WorkoutPlanGenerator {
  readonly id: string;
  readonly label: string;
  generate(preferences: PlannerPreferences): Promise<WorkoutPlanDraft>;
}

export const WEEKDAYS: readonly { id: Weekday; short: string; label: string }[] = [
  { id: 'mon', short: 'Mon', label: 'Monday' },
  { id: 'tue', short: 'Tue', label: 'Tuesday' },
  { id: 'wed', short: 'Wed', label: 'Wednesday' },
  { id: 'thu', short: 'Thu', label: 'Thursday' },
  { id: 'fri', short: 'Fri', label: 'Friday' },
  { id: 'sat', short: 'Sat', label: 'Saturday' },
  { id: 'sun', short: 'Sun', label: 'Sunday' },
];

export const GOAL_LABELS: Record<WorkoutGoal, string> = {
  general: 'General fitness',
  muscle: 'Build muscle',
  strength: 'Build strength',
  endurance: 'Muscular endurance',
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const REGION_LABELS: readonly MachineRegion[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Arms',
  'Core',
  'Legs',
];

export function plannedExercise(
  definition: ExerciseDefinition,
  position: number,
  dayId: string,
  goal: WorkoutGoal = 'general',
  experience: ExperienceLevel = 'beginner',
): PlannedExercise {
  const strength = goal === 'strength';
  const endurance = goal === 'endurance';
  const sets = experience === 'advanced' ? 4 : experience === 'intermediate' ? 3 : 2;
  return {
    id: `${dayId}-${definition.id}-${position + 1}`,
    exerciseId: definition.id,
    name: definition.name,
    equipment: definition.equipment,
    machineIds: [...definition.machineIds],
    sets,
    repsMin: strength ? 4 : endurance ? 12 : 8,
    repsMax: strength ? 6 : endurance ? 18 : 12,
    restSeconds: strength ? 150 : endurance ? 60 : 90,
  };
}

function regionFor(definition: ExerciseDefinition): MachineRegion | undefined {
  return primaryMachineForExercise(definition)?.region;
}

function scoreExercise(
  definition: ExerciseDefinition,
  priorities: readonly MachineRegion[],
): number {
  const region = regionFor(definition);
  const priorityIndex = region ? priorities.indexOf(region) : -1;
  const machineBonus = definition.equipment === 'machine' ? 20 : 0;
  const priorityBonus = priorityIndex === -1 ? 0 : 60 - priorityIndex * 5;
  const compoundBonus = definition.primaryMuscles.length > 1 ? 8 : 0;
  return machineBonus + priorityBonus + compoundBonus;
}

function exercisesPerSession(minutes: number): number {
  if (minutes <= 30) return 4;
  if (minutes <= 45) return 5;
  if (minutes <= 60) return 6;
  if (minutes <= 75) return 7;
  return 8;
}

/**
 * A deterministic local generator. It makes no network request and makes no
 * claim to be AI. The same preferences always create the same draft.
 */
export class RulesBasedPlanner implements WorkoutPlanGenerator {
  readonly id = 'local-rules-v1';
  readonly label = 'Local draft';

  async generate(preferences: PlannerPreferences): Promise<WorkoutPlanDraft> {
    const pool = availableExercises(preferences.availableMachineIds)
      .slice()
      .sort(
        (a, b) =>
          scoreExercise(b, preferences.priorityRegions) -
          scoreExercise(a, preferences.priorityRegions),
      );
    const count = exercisesPerSession(preferences.sessionMinutes);

    const days = preferences.trainingDays.map((weekday, dayIndex) => {
      const dayId = `day-${weekday}`;
      const selected: ExerciseDefinition[] = [];

      for (let offset = 0; selected.length < count && offset < pool.length * 2; offset += 1) {
        const candidate = pool[(dayIndex * count + offset) % pool.length];
        if (!candidate || selected.some((entry) => entry.id === candidate.id)) continue;
        selected.push(candidate);
      }

      return {
        id: dayId,
        weekday,
        name: `${WEEKDAYS.find((entry) => entry.id === weekday)?.label ?? weekday} session`,
        exercises: selected.map((exercise, position) =>
          plannedExercise(exercise, position, dayId, preferences.goal, preferences.experience),
        ),
      };
    });

    return {
      name: preferences.name,
      creationMode: 'automated',
      goal: preferences.goal,
      experience: preferences.experience,
      sessionMinutes: preferences.sessionMinutes,
      priorityRegions: [...preferences.priorityRegions],
      availableMachineIds: [...preferences.availableMachineIds],
      days,
    };
  }
}

export const localPlanner = new RulesBasedPlanner();

export function createManualDraft(preferences: PlannerPreferences): WorkoutPlanDraft {
  return {
    name: preferences.name,
    creationMode: 'manual',
    goal: preferences.goal,
    experience: preferences.experience,
    sessionMinutes: preferences.sessionMinutes,
    priorityRegions: [...preferences.priorityRegions],
    availableMachineIds: [...preferences.availableMachineIds],
    days: preferences.trainingDays.map((weekday) => ({
      id: `day-${weekday}`,
      weekday,
      name: `${WEEKDAYS.find((entry) => entry.id === weekday)?.label ?? weekday} session`,
      exercises: [],
    })),
  };
}

export function refreshExerciseSnapshot(exercise: PlannedExercise): PlannedExercise {
  const current = getExercise(exercise.exerciseId);
  if (!current) return exercise;
  return {
    ...exercise,
    name: current.name,
    equipment: current.equipment,
    machineIds: [...current.machineIds],
  };
}

export function suggestedExercisePool(): readonly ExerciseDefinition[] {
  return EXERCISES;
}
