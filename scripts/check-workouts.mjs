import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  EXERCISES,
  resolveExerciseAlias,
  validateExerciseRegistry,
} from '../src/data/exercises.ts';
import { MACHINES, MACHINE_REGIONS, validateMachineRegistry } from '../src/data/machines.ts';
import {
  BODY_HEATMAP_REGIONS,
  BODY_SILHOUETTES,
  HEATMAP_VIEWS,
  HEATMAP_VIEW_ORDER,
} from '../src/data/bodyHeatmap.ts';
import { parseBackup } from '../src/lib/backup.ts';
import {
  buildHeatmapModel,
  heatFillForPercent,
  heatMixForPercent,
  normalizeMuscleName,
} from '../src/lib/heatmap.ts';
import { localPlanner } from '../src/lib/planner.ts';
import { workoutPlanSchema } from '../src/lib/validation.ts';

assert.deepEqual(validateMachineRegistry(), []);
assert.deepEqual(validateExerciseRegistry(), []);
assert.equal(MACHINES.length, 18);
assert.equal(
  MACHINES.some((machine) => machine.id === 'G3-S52'),
  false,
);
assert.equal(EXERCISES.length >= 22, true);

for (const id of ['G3-MSFT300', 'G3-MS24']) {
  const cableMachine = MACHINES.find((entry) => entry.id === id);
  assert.ok(cableMachine?.emphasisExample, `${id} must label its example movement`);
  assert.equal(cableMachine.region, 'Multi-purpose');
  const example = EXERCISES.find((entry) => entry.id === cableMachine.exerciseIds[0]);
  assert.ok(example?.machineIds.includes(id), `${id} example must map back to the station`);
}

// One colour carries the whole scale, so the only thing that has to hold is
// that no emphasis draws nothing and that a larger share is always stronger.
assert.equal(heatMixForPercent(0), 0);
assert.equal(heatMixForPercent(-5), 0);
assert.equal(heatMixForPercent(100), 1);
assert.equal(heatMixForPercent(120), 1);
assert.equal(heatFillForPercent(0), 'var(--color-muscle-base)');
assert.match(heatFillForPercent(100), /--color-heat-strong\) 100.00%/);
let previousMix = 0;
for (const percent of [1, 10, 20, 35, 45, 60, 80, 99, 100]) {
  const mix = heatMixForPercent(percent);
  assert.ok(mix > previousMix, `the ramp must rise with emphasis, but ${percent} percent did not`);
  assert.ok(mix <= 1, `${percent} percent runs past the end of the ramp`);
  assert.match(heatFillForPercent(percent), /^color-mix\(in oklab, /);
  previousMix = mix;
}
assert.equal(
  buildHeatmapModel([{ muscle: 'Chest', percent: 80, role: 'primary' }]).regions[0].fill,
  heatFillForPercent(80),
  'the map and the percentage bars must read the same source value',
);

for (const view of HEATMAP_VIEW_ORDER) {
  assert.ok(BODY_SILHOUETTES[view]?.length, `${view} has no body silhouette`);
}
assert.equal(normalizeMuscleName('  Front   Delts  '), 'frontDelts');
assert.equal(normalizeMuscleName('Adductor magnus'), 'adductors');
assert.equal(normalizeMuscleName('Tensor fasciae latae'), 'abductorsOuterHip');
assert.equal(normalizeMuscleName('Unknown target'), undefined);
assert.deepEqual(buildHeatmapModel([]).views, []);
assert.deepEqual(
  buildHeatmapModel([{ muscle: 'Quadriceps', percent: 100, role: 'primary' }]).views,
  ['lowerFront'],
);
assert.deepEqual(
  buildHeatmapModel([
    { muscle: 'Lats', percent: 50, role: 'primary' },
    { muscle: 'Biceps', percent: 20, role: 'secondary' },
  ]).views,
  ['upperFront', 'upperBack'],
);

for (const machine of MACHINES) {
  const model = buildHeatmapModel(machine.emphasis);
  assert.ok(model.views.length > 0, `${machine.id} has no heatmap view`);
  for (const target of machine.emphasis) {
    assert.ok(
      normalizeMuscleName(target.muscle),
      `${machine.id} has unmapped target ${target.muscle}`,
    );
  }
}

for (const [region, views] of Object.entries(BODY_HEATMAP_REGIONS)) {
  assert.ok(Object.keys(views).length > 0, `${region} has no anatomy path`);
}
assert.deepEqual(Object.keys(HEATMAP_VIEWS), HEATMAP_VIEW_ORDER);

const hipAdductorModel = buildHeatmapModel(
  MACHINES.find((machine) => machine.id === 'G3-S74').emphasis,
);
assert.deepEqual(hipAdductorModel.views, ['lowerFront']);
assert.equal(
  hipAdductorModel.regions.find((region) => region.id === 'adductors')?.percent,
  40,
  'multiple aliases for one visible region must use the strongest target instead of summing',
);
assert.deepEqual(
  buildHeatmapModel(MACHINES.find((machine) => machine.id === 'G3-S72').emphasis).views,
  ['lowerBack'],
);
assert.deepEqual(
  buildHeatmapModel(MACHINES.find((machine) => machine.id === 'G3-S75').emphasis).views,
  ['lowerFront'],
);

const machinesPageSource = readFileSync(resolve('src/pages/MachinesPage.tsx'), 'utf8');
const exerciseDetailSource = readFileSync(
  resolve('src/components/ExerciseDetailDialog.tsx'),
  'utf8',
);
assert.match(machinesPageSource, /<MuscleHeatmap targets=\{selected\.emphasis\}/);
assert.match(exerciseDetailSource, /<MuscleHeatmap targets=\{machine\.emphasis\}/);

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

const anatomyHashes = {
  '01_upper_front_neck_crop.png':
    '293ddfad08dd0100cc05cee46b616c422f5c59dc00c7430174e4240e08aa97ac',
  '02_upper_back_neck_crop.png': '3c02e16b0bcbf5051f6ac7234e29ff8997f8d80fe8154fed48cd9aa057de402e',
  '03_lower_front_modest.png': '6fedc318dce539b4ba4f05d69d894ca6d4c7d5f48e9ff91b0a9a87bab76481d8',
  '04_lower_back_modest.png': '8fae2741f128bf6b956df532c054fbe7cbe71feade2d848a725df4ced15dc2bd',
};

const { createHash } = await import('node:crypto');
for (const [filename, expectedHash] of Object.entries(anatomyHashes)) {
  const anatomy = readFileSync(resolve('public/anatomy/lineart', filename));
  assert.equal(anatomy.subarray(1, 4).toString('ascii'), 'PNG', `${filename} is not PNG`);
  assert.equal(anatomy.readUInt32BE(16), 1254, `${filename} width changed`);
  assert.equal(anatomy.readUInt32BE(20), 1254, `${filename} height changed`);
  assert.equal(
    createHash('sha256').update(anatomy).digest('hex'),
    expectedHash,
    `${filename} changed`,
  );
}

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
assert.equal(
  workoutPlanSchema.safeParse({
    ...first,
    priorityRegions: [...MACHINE_REGIONS],
    createdAt: 1,
    updatedAt: 1,
  }).success,
  true,
  'all catalogue groups and machines must fit in a saved program',
);

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
  assert.equal(v1.value.version, 3);
  assert.deepEqual(v1.value.workoutPlans, []);
  assert.deepEqual(v1.value.meals, []);
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
if (v2.ok) {
  assert.deepEqual(v2.value.workoutPlans, [storedPlan]);
  assert.deepEqual(v2.value.meals, []);
}

console.log(
  `Workout checks passed: ${MACHINES.length} lossless high-resolution machine images, ${EXERCISES.length} exercises, muscle heatmap coverage, mappings, planner, schemas, and backup compatibility.`,
);
