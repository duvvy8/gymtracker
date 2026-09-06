import { getMachine, MACHINES } from './machines.ts';
import type { ExerciseDefinition, ExerciseEquipment, GymMachine, MachineId } from '../types';

const machineExercise = (
  id: string,
  name: string,
  machineId: MachineId,
  primaryMuscles: readonly string[],
  secondaryMuscles: readonly string[],
  setup: string,
  instructions: readonly string[],
): ExerciseDefinition => ({
  id,
  name,
  equipment: 'machine',
  primaryMuscles,
  secondaryMuscles,
  machineIds: [machineId],
  setup,
  instructions,
});

export const EXERCISES = [
  machineExercise(
    'machine-chest-press',
    'Chest Press',
    'G3-S10',
    ['Chest'],
    ['Triceps', 'Front delts'],
    'Adjust the seat so the handles sit level with the middle of your chest.',
    [
      'Keep your shoulders against the pad.',
      'Press until your arms are almost straight.',
      'Return under control.',
    ],
  ),
  machineExercise(
    'machine-pectoral-fly',
    'Pectoral Fly',
    'G3-S12',
    ['Chest'],
    ['Front delts'],
    'Set the seat so your elbows are just below shoulder height.',
    [
      'Keep a soft bend in your elbows.',
      'Bring the pads together without rounding forward.',
      'Open slowly until you feel a comfortable chest stretch.',
    ],
  ),
  machineExercise(
    'machine-shoulder-press',
    'Shoulder Press',
    'G3-S20',
    ['Front delts', 'Side delts'],
    ['Triceps'],
    'Set the seat so the handles begin near shoulder height.',
    [
      'Keep your back against the pad.',
      'Press overhead without locking your elbows.',
      'Lower with control to the starting position.',
    ],
  ),
  machineExercise(
    'machine-lateral-raise',
    'Lateral Raise',
    'G3-S21',
    ['Side delts'],
    ['Front delts', 'Upper traps'],
    'Sit upright with the outside of your arms against the pads.',
    [
      'Lead with your elbows.',
      'Raise until your upper arms are near shoulder height.',
      'Lower slowly without letting the stack drop.',
    ],
  ),
  machineExercise(
    'lat-pulldown',
    'Lat Pulldown',
    'G3-S30',
    ['Lats'],
    ['Biceps', 'Mid back'],
    'Secure your thighs under the pads and take a comfortable overhand grip.',
    [
      'Keep your chest tall.',
      'Pull the bar toward your upper chest.',
      'Let your arms lengthen under control.',
    ],
  ),
  machineExercise(
    'seated-machine-row',
    'Seated Row',
    'G3-S31',
    ['Mid back', 'Lats'],
    ['Biceps', 'Rear delts'],
    'Set the seat so your chest rests comfortably on the pad.',
    [
      'Start with long arms and a neutral spine.',
      'Drive your elbows back beside your body.',
      'Return without letting your shoulders roll forward.',
    ],
  ),
  machineExercise(
    'machine-arm-curl',
    'Arm Curl',
    'G3-S40',
    ['Biceps'],
    ['Brachialis', 'Forearms'],
    'Align your elbows with the machine pivot and keep your upper arms on the pad.',
    [
      'Curl without lifting your elbows.',
      'Pause briefly at the top.',
      'Lower until your arms are almost straight.',
    ],
  ),
  machineExercise(
    'machine-triceps-press',
    'Triceps Press',
    'G3-S42',
    ['Triceps'],
    ['Front delts'],
    'Sit tall with your hands on the press handles and elbows close to your sides.',
    [
      'Press the handles down.',
      'Finish with straight arms without locking hard.',
      'Return slowly while keeping your shoulders down.',
    ],
  ),
  machineExercise(
    'machine-abdominal-crunch',
    'Abdominal Crunch',
    'G3-S51',
    ['Abdominals'],
    ['Obliques', 'Hip flexors'],
    'Adjust the seat and torso pad so the machine pivot matches your trunk.',
    [
      'Brace before moving.',
      'Curl your ribs toward your pelvis.',
      'Return only as far as you can control.',
    ],
  ),
  machineExercise(
    'assisted-chin-up',
    'Assisted Chin-up',
    'G3-S60',
    ['Lats'],
    ['Biceps', 'Mid back'],
    'Select enough assistance to move smoothly and place your knees on the platform.',
    [
      'Begin with straight arms and stable shoulders.',
      'Pull your chest toward the handles.',
      'Lower under control before stepping off carefully.',
    ],
  ),
  machineExercise(
    'assisted-dip',
    'Assisted Dip',
    'G3-S60',
    ['Triceps', 'Chest'],
    ['Front delts'],
    'Select enough assistance to move smoothly and place your knees on the platform.',
    [
      'Keep your shoulders down.',
      'Lower until your upper arms are near parallel.',
      'Press back to the start before stepping off carefully.',
    ],
  ),
  machineExercise(
    'machine-leg-press',
    'Leg Press',
    'G3-S70',
    ['Quadriceps', 'Glutes'],
    ['Hamstrings', 'Calves'],
    'Set the seat so your knees remain comfortably bent at the deepest position.',
    [
      'Place both feet securely on the platform.',
      'Press through your whole foot without locking your knees.',
      'Lower until your hips and back stay against the pad.',
    ],
  ),
  machineExercise(
    'leg-extension',
    'Leg Extension',
    'G3-S71',
    ['Quadriceps'],
    [],
    'Align your knees with the machine pivot and place the roller above your ankles.',
    ['Extend your knees without swinging.', 'Pause briefly near the top.', 'Lower under control.'],
  ),
  machineExercise(
    'seated-leg-curl',
    'Seated Leg Curl',
    'G3-S72',
    ['Hamstrings'],
    ['Calves'],
    'Align your knees with the machine pivot and secure the thigh pad.',
    [
      'Pull your heels down and back.',
      'Keep your hips against the seat.',
      'Return slowly to straight legs.',
    ],
  ),
  machineExercise(
    'prone-leg-curl',
    'Prone Leg Curl',
    'G3-S73',
    ['Hamstrings'],
    ['Calves'],
    'Lie face down with your knees near the machine pivot and the roller above your heels.',
    [
      'Keep your hips against the pad.',
      'Curl your heels toward you.',
      'Lower under control without arching your back.',
    ],
  ),
  machineExercise(
    'hip-adductor',
    'Hip Adductor',
    'G3-S74',
    ['Adductors'],
    [],
    'Sit with the pads against the inside of your thighs and choose a comfortable start width.',
    [
      'Keep your back against the pad.',
      'Bring your knees together smoothly.',
      'Return slowly without letting the stack drop.',
    ],
  ),
  machineExercise(
    'hip-abductor',
    'Hip Abductor',
    'G3-S75',
    ['Gluteus medius', 'Gluteus minimus'],
    ['Hip stabilisers'],
    'Sit with the pads against the outside of your thighs.',
    ['Keep your torso still.', 'Drive your knees apart smoothly.', 'Return under control.'],
  ),
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    equipment: 'bodyweight',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Core'],
    machineIds: [],
    setup: 'Stand with your feet around shoulder width apart.',
    instructions: [
      'Sit your hips down between your feet.',
      'Keep your whole foot on the floor.',
      'Stand tall without rushing.',
    ],
  },
  {
    id: 'push-up',
    name: 'Push-up',
    equipment: 'bodyweight',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Front delts'],
    machineIds: [],
    setup: 'Place your hands just outside shoulder width with your body in a straight line.',
    instructions: [
      'Lower your chest between your hands.',
      'Keep your trunk braced.',
      'Press the floor away.',
    ],
  },
  {
    id: 'plank',
    name: 'Plank',
    equipment: 'bodyweight',
    primaryMuscles: ['Core'],
    secondaryMuscles: ['Shoulders', 'Glutes'],
    machineIds: [],
    setup: 'Support yourself on your forearms and toes.',
    instructions: [
      'Keep a straight line from shoulders to heels.',
      'Breathe normally while bracing.',
      'Stop when you can no longer hold the position.',
    ],
  },
  {
    id: 'dumbbell-lateral-raise',
    name: 'Dumbbell Lateral Raise',
    equipment: 'dumbbell',
    primaryMuscles: ['Side delts'],
    secondaryMuscles: ['Front delts', 'Upper traps'],
    machineIds: [],
    setup: 'Stand tall with a dumbbell in each hand.',
    instructions: [
      'Lead with your elbows.',
      'Raise to around shoulder height.',
      'Lower under control.',
    ],
  },
  {
    id: 'dumbbell-chest-press',
    name: 'Dumbbell Chest Press',
    equipment: 'dumbbell',
    primaryMuscles: ['Chest'],
    secondaryMuscles: ['Triceps', 'Front delts'],
    machineIds: [],
    setup: 'Lie on a flat bench with one dumbbell in each hand.',
    instructions: [
      'Set your shoulder blades against the bench.',
      'Press the dumbbells above your chest.',
      'Lower with control.',
    ],
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    equipment: 'barbell',
    primaryMuscles: ['Mid back', 'Lats'],
    secondaryMuscles: ['Biceps', 'Rear delts'],
    machineIds: [],
    setup: 'Hinge at the hips and hold the bar with straight arms.',
    instructions: [
      'Keep your trunk braced.',
      'Row the bar toward your lower ribs.',
      'Lower without changing your torso angle.',
    ],
  },
] as const satisfies readonly ExerciseDefinition[];

export const EXERCISE_BY_ID = new Map<string, ExerciseDefinition>(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, ' ');

const ALIAS_TO_EXERCISE = new Map<string, ExerciseDefinition>();
for (const exercise of EXERCISES) {
  ALIAS_TO_EXERCISE.set(normalize(exercise.name), exercise);
  for (const machineId of exercise.machineIds) {
    const mapped = getMachine(machineId);
    for (const alias of mapped?.aliases ?? []) ALIAS_TO_EXERCISE.set(normalize(alias), exercise);
  }
}

export function getExercise(id: string): ExerciseDefinition | undefined {
  return EXERCISE_BY_ID.get(id);
}

export function resolveExerciseAlias(
  value: string,
  equipment?: ExerciseEquipment,
): ExerciseDefinition | undefined {
  const result = ALIAS_TO_EXERCISE.get(normalize(value));
  return result && (!equipment || result.equipment === equipment) ? result : undefined;
}

export function primaryMachineForExercise(exercise: ExerciseDefinition): GymMachine | undefined {
  const first = exercise.machineIds[0];
  return first ? getMachine(first) : undefined;
}

export function exercisesForMachine(machineId: MachineId): readonly ExerciseDefinition[] {
  return EXERCISES.filter((exercise) =>
    (exercise.machineIds as readonly MachineId[]).includes(machineId),
  );
}

export function availableExercises(
  machineIds: readonly MachineId[],
): readonly ExerciseDefinition[] {
  const allowed = new Set(machineIds);
  return EXERCISES.filter(
    (exercise) =>
      exercise.machineIds.length === 0 || exercise.machineIds.some((id) => allowed.has(id)),
  );
}

export function validateExerciseRegistry(): string[] {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const exercise of EXERCISES) {
    if (ids.has(exercise.id)) problems.push(`Duplicate exercise id: ${exercise.id}`);
    ids.add(exercise.id);
    for (const machineId of exercise.machineIds) {
      if (!getMachine(machineId)) problems.push(`${exercise.id} references unknown ${machineId}`);
    }
    if (exercise.equipment !== 'machine' && exercise.machineIds.length > 0) {
      problems.push(`${exercise.id} maps non-machine equipment to a machine`);
    }
  }
  for (const entry of MACHINES) {
    for (const exerciseId of entry.exerciseIds) {
      if (!EXERCISE_BY_ID.has(exerciseId))
        problems.push(`${entry.id} references unknown ${exerciseId}`);
    }
  }
  return problems;
}
