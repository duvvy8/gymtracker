import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EXERCISES,
  resolveExerciseAlias,
  validateExerciseRegistry,
} from '../src/data/exercises.ts';
import { MACHINES, validateMachineRegistry } from '../src/data/machines.ts';
import { parseBackup } from '../src/lib/backup.ts';
import { localPlanner } from '../src/lib/planner.ts';
import { workoutPlanSchema } from '../src/lib/validation.ts';

assert.deepEqual(validateMachineRegistry(), []);
assert.deepEqual(validateExerciseRegistry(), []);
assert.equal(MACHINES.length, 16);
assert.equal(
  MACHINES.some((machine) => machine.id === 'G3-S52'),
  false,
);
assert.equal(EXERCISES.length >= 22, true);

function assertLosslessWebp(imageFile, label, expectedSize) {
  const webp = readFileSync(imageFile);
  assert.equal(webp.subarray(0, 4).toString('ascii'), 'RIFF', `${label} is not WebP`);
  assert.equal(webp.subarray(8, 12).toString('ascii'), 'WEBP', `${label} is not WebP`);
  assert.equal(webp.subarray(12, 16).toString('ascii'), 'VP8L', `${label} must be lossless WebP`);
  assert.equal(webp[20], 0x2f, `${label} has an invalid lossless WebP header`);
  const sizeBits = webp.readUInt32LE(21);
  const width = (sizeBits & 0x3fff) + 1;
  const height = ((sizeBits >>> 14) & 0x3fff) + 1;
  const hasAlpha = (sizeBits >>> 28) & 1;
  assert.equal(width, expectedSize, `${label} image width changed`);
  assert.equal(height, expectedSize, `${label} image height changed`);
  assert.equal(hasAlpha, 1, `${label} must retain transparency`);
}

for (const machine of MACHINES) {
  assert.ok(machine.imagePath, `${machine.id} has no image path`);
  const imageFile = resolve('public', machine.imagePath.slice(1));
  assert.ok(existsSync(imageFile), `${machine.id} image is missing`);
  assertLosslessWebp(imageFile, machine.id, 1200);

  const thumbnailFile = imageFile.replace(/\.webp$/, '-600.webp');
  assert.ok(existsSync(thumbnailFile), `${machine.id} thumbnail is missing`);
  assertLosslessWebp(thumbnailFile, `${machine.id} thumbnail`, 600);
}
assert.equal(existsSync(resolve('public/machines/G3-S52.webp')), false);

assert.equal(resolveExerciseAlias('machine chest press', 'machine')?.machineIds[0], 'G3-S10');
assert.equal(resolveExerciseAlias('lying leg curl', 'machine')?.machineIds[0], 'G3-S73');
assert.equal(resolveExerciseAlias('dumbbell lateral raise', 'dumbbell')?.machineIds.length, 0);
assert.equal(resolveExerciseAlias('dumbbell lateral raise', 'machine'), undefined);
assert.equal(resolveExerciseAlias('barbell row', 'barbell')?.machineIds.length, 0);

const preferences = {
  name: 'Three day plan',
  goal: 'muscle',
  experience: 'intermediate',
  sessionMinutes: 60,
  trainingDays: ['mon', 'wed', 'fri'],
  priorityRegions: ['Legs', 'Back'],
  availableMachineIds: MACHINES.map((machine) => machine.id),
};

const first = await localPlanner.generate(preferences);
const second = await localPlanner.generate(preferences);
assert.deepEqual(first, second);
assert.equal(first.creationMode, 'automated');
assert.equal(first.days.length, 3);
assert.equal(
  first.days.every((day) => day.exercises.length === 6),
  true,
);
assert.equal(workoutPlanSchema.safeParse({ ...first, createdAt: 1, updatedAt: 1 }).success, true);

const v1 = parseBackup(
  JSON.stringify({
    format: 'gymtracker-backup',
    version: 1,
    foods: [],
    foodLogs: [],
    bodyWeightLogs: [],
    settings: null,
  }),
);
assert.equal(v1.ok, true);
if (v1.ok) {
  assert.equal(v1.value.version, 2);
  assert.deepEqual(v1.value.workoutPlans, []);
}

const storedPlan = { ...first, id: 1, createdAt: 1, updatedAt: 1 };
const v2 = parseBackup(
  JSON.stringify({
    format: 'gymtracker-backup',
    version: 2,
    foods: [],
    foodLogs: [],
    bodyWeightLogs: [],
    settings: null,
    workoutPlans: [storedPlan],
  }),
);
assert.equal(v2.ok, true);
if (v2.ok) assert.deepEqual(v2.value.workoutPlans, [storedPlan]);

console.log(
  `Workout checks passed: ${MACHINES.length} lossless high-resolution machine images, ${EXERCISES.length} exercises, mappings, planner, schemas, and backup compatibility.`,
);
