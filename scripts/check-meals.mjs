import assert from 'node:assert/strict';
import { parseBackup } from '../src/lib/backup.ts';
import {
  analysedMealSchema,
  mealAnalysisResponseSchema,
  resolveAnalysedMeal,
  resolveCofid,
} from '../src/lib/mealAnalysis.ts';
import { scaleNutrients, sumNutrients } from '../src/lib/nutrition.ts';
import { mealSchema } from '../src/lib/validation.ts';
import worker from '../worker/index.ts';

let checks = 0;
const basis = {
  calories: 148,
  protein: 32,
  carbs: 0,
  fat: 2.2,
  fibre: 0,
  sugars: 0,
  saturatedFat: 0.6,
  salt: 0.14,
};
assert.deepEqual(scaleNutrients(basis, 180, '100g'), {
  calories: 266.4,
  protein: 57.6,
  carbs: 0,
  fat: 4,
  fibre: 0,
  sugars: 0,
  saturatedFat: 1.1,
  salt: 0.3,
});
checks++;
assert.deepEqual(scaleNutrients(basis, 220, '100g'), {
  calories: 325.6,
  protein: 70.4,
  carbs: 0,
  fat: 4.8,
  fibre: 0,
  sugars: 0,
  saturatedFat: 1.3,
  salt: 0.3,
});
checks++;
assert.deepEqual(sumNutrients([basis, { calories: 2, fibre: 3 }]), {
  calories: 150,
  protein: 32,
  carbs: 0,
  fat: 2.2,
  fibre: 3,
  sugars: 0,
  saturatedFat: 0.6,
  salt: 0.14,
});
checks++;
assert.deepEqual(scaleNutrients({ ...basis, calories: 42 }, 330, '100ml'), {
  calories: 138.6,
  protein: 105.6,
  carbs: 0,
  fat: 7.3,
  fibre: 0,
  sugars: 0,
  saturatedFat: 2,
  salt: 0.5,
});
checks++;

assert.equal(resolveCofid('grilled chicken breast')?.food.code, '18-323');
checks++;
assert.equal(resolveCofid('unrecognised purple meal'), null);
checks++;
// A name the resolver cannot match is rescued by the model's lookup terms.
assert.equal(resolveCofid("nan's sunday roast bird"), null);
assert.equal(
  resolveCofid("nan's sunday roast bird", '', ['grilled chicken breast'])?.food.code,
  '18-323',
);
checks++;
// A reference match must never upgrade the model's own identity confidence.
assert.equal(
  resolveAnalysedMeal({
    suggestedName: 'Unsure plate',
    items: [
      {
        name: 'grilled chicken breast',
        preparation: '',
        estimatedAmount: 100,
        unit: 'g',
        portionConfidence: 'low',
        identityConfidence: 'low',
        uncertainty: '',
        nutritionLookupTerms: [],
        possibleAliases: [],
        nutritionPer100: {
          calories: 100,
          protein: 1,
          carbs: 1,
          fat: 1,
          fibre: 0,
          sugars: 0,
          saturatedFat: 0,
          salt: 0,
        },
      },
    ],
  }).items[0].identityConfidence,
  'low',
);
checks++;
const modelMeal = {
  suggestedName: 'Chicken lunch',
  items: [
    {
      name: 'grilled chicken breast',
      preparation: 'grilled',
      estimatedAmount: 180,
      unit: 'g',
      portionConfidence: 'medium',
      identityConfidence: 'medium',
      uncertainty: 'oil is not visible',
      nutritionPer100: {
        calories: 999,
        protein: 1,
        carbs: 1,
        fat: 1,
        fibre: 1,
        sugars: 1,
        saturatedFat: 1,
        salt: 1,
      },
    },
  ],
};
assert.equal(analysedMealSchema.safeParse({ ...modelMeal, injected: true }).success, false);
checks++;
assert.equal(
  analysedMealSchema.safeParse({
    ...modelMeal,
    items: [{ ...modelMeal.items[0], estimatedAmount: 100_000 }],
  }).success,
  false,
);
checks++;
assert.equal(
  analysedMealSchema.safeParse({
    ...modelMeal,
    items: [
      {
        ...modelMeal.items[0],
        nutritionPer100: { ...modelMeal.items[0].nutritionPer100, protein: -1 },
      },
    ],
  }).success,
  false,
);
checks++;
const resolved = resolveAnalysedMeal(analysedMealSchema.parse(modelMeal));
assert.equal(resolved.items[0].nutritionSource, 'cofid');
assert.equal(resolved.items[0].nutritionBasis.calories, 148);
checks++;
assert.equal(mealAnalysisResponseSchema.safeParse(resolved).success, true);
checks++;
assert.equal(
  mealSchema.safeParse({
    date: '2026-09-13',
    name: 'Lunch',
    category: 'lunch',
    snackSlot: 2,
    sortOrder: 1,
    createdAt: 1,
    updatedAt: 1,
  }).success,
  false,
);
checks++;

for (const version of [1, 2]) {
  const parsed = parseBackup(
    JSON.stringify({
      format: 'gymtracker-backup',
      version,
      foods: [],
      foodLogs: [],
      bodyWeightLogs: [],
      settings: null,
      ...(version === 2 ? { workoutPlans: [] } : {}),
    }),
  );
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.version, 3);
    assert.deepEqual(parsed.value.meals, []);
  }
  checks++;
}
const v3 = parseBackup(
  JSON.stringify({
    format: 'gymtracker-backup',
    version: 3,
    foods: [],
    foodLogs: [],
    bodyWeightLogs: [],
    settings: null,
    workoutPlans: [],
    meals: [
      {
        date: '2026-09-13',
        name: 'Lunch',
        category: 'lunch',
        sortOrder: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    ],
  }),
);
assert.equal(v3.ok, true);
checks++;

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]);
const request = (headers = {}, body = png) =>
  new Request('https://gymtracker.test/api/analyse-meal', {
    method: 'POST',
    headers: {
      origin: 'https://gymtracker.test',
      'sec-fetch-site': 'same-origin',
      'content-type': 'image/png',
      ...headers,
    },
    body,
  });
const allowed = { limit: async () => ({ success: true }) };
const assets = { fetch: async () => new Response('asset') };
const originalFetch = globalThis.fetch;
try {
  let providerCalls = 0;
  globalThis.fetch = async (_url, options) => {
    providerCalls++;
    const sent = JSON.parse(options.body);
    assert.equal(sent.generationConfig.thinkingConfig.thinkingLevel, 'MEDIUM');
    assert.equal('tools' in sent, false);
    // Only the documented structured-output field, using the supported keyword subset.
    assert.equal('responseJsonSchema' in sent.generationConfig, false);
    const providerSchema = sent.generationConfig.responseSchema;
    assert.ok(providerSchema);
    const schemaText = JSON.stringify(providerSchema);
    for (const unsupported of ['additionalProperties', 'minItems', 'maxItems', 'maxLength']) {
      assert.equal(schemaText.includes(unsupported), false);
    }
    return Response.json({
      candidates: [{ content: { parts: [{ text: JSON.stringify(modelMeal) }] } }],
    });
  };
  const env = { GEMINI_API_KEY: 'test-only', MEAL_ANALYSIS_RATE_LIMITER: allowed, ASSETS: assets };
  let response = await worker.fetch(request(), env);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal((await response.json()).items[0].nutritionSource, 'cofid');
  assert.equal(providerCalls, 1);
  checks++;

  response = await worker.fetch(new Request('https://gymtracker.test/api/analyse-meal'), env);
  assert.equal(response.status, 405);
  checks++;
  response = await worker.fetch(
    request({ origin: 'https://evil.test', 'sec-fetch-site': 'cross-site' }),
    env,
  );
  assert.equal(response.status, 403);
  checks++;
  // A scripted POST carrying neither Origin nor Sec-Fetch-Site must not reach
  // the provider: absent headers are not proof of a same-origin browser request.
  const callsBefore = providerCalls;
  response = await worker.fetch(
    new Request('https://gymtracker.test/api/analyse-meal', {
      method: 'POST',
      headers: { 'content-type': 'image/png' },
      body: png,
    }),
    env,
  );
  assert.equal(response.status, 403);
  assert.equal(providerCalls, callsBefore);
  checks++;
  response = await worker.fetch(request(), { ...env, GEMINI_API_KEY: '' });
  assert.equal(response.status, 503);
  checks++;
  response = await worker.fetch(request({ 'content-type': 'text/plain' }), env);
  assert.equal(response.status, 415);
  checks++;
  response = await worker.fetch(request({}, new Uint8Array([1, 2, 3])), env);
  assert.equal(response.status, 400);
  checks++;
  response = await worker.fetch(request({ 'content-length': String(5 * 1024 * 1024 + 1) }), env);
  assert.equal(response.status, 413);
  checks++;
  response = await worker.fetch(request(), {
    ...env,
    MEAL_ANALYSIS_RATE_LIMITER: { limit: async () => ({ success: false }) },
  });
  assert.equal(response.status, 429);
  checks++;
  globalThis.fetch = async () => new Response('{}', { status: 429 });
  response = await worker.fetch(request(), env);
  assert.equal(response.status, 429);
  checks++;
  globalThis.fetch = async () =>
    Response.json({ candidates: [{ content: { parts: [{ text: '{bad' }] } }] });
  response = await worker.fetch(request(), env);
  assert.equal(response.status, 502);
  checks++;
  // "Not food" is a real answer, not a failure, and must not read as a broken service.
  globalThis.fetch = async () =>
    Response.json({
      candidates: [
        {
          content: {
            parts: [{ text: JSON.stringify({ suggestedName: 'Non-food item', items: [] }) }],
          },
        },
      ],
    });
  response = await worker.fetch(request(), env);
  assert.equal(response.status, 422);
  assert.equal((await response.json()).error, 'no-food-detected');
  checks++;
  // A transient upstream 5xx is retryable and must stay distinct from a hard failure.
  globalThis.fetch = async () => new Response('{}', { status: 503 });
  response = await worker.fetch(request(), env);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, 'analysis-unavailable');
  assert.equal(response.headers.get('retry-after'), '30');
  checks++;
  const originalSetTimeout = globalThis.setTimeout;
  try {
    globalThis.setTimeout = (callback) => {
      queueMicrotask(callback);
      return 1;
    };
    globalThis.fetch = async (_url, options) =>
      new Promise((_resolve, reject) => {
        options.signal.addEventListener(
          'abort',
          () => reject(new DOMException('Aborted', 'AbortError')),
          { once: true },
        );
      });
    response = await worker.fetch(request(), env);
    assert.equal(response.status, 504);
    checks++;
  } finally {
    globalThis.setTimeout = originalSetTimeout;
  }
} finally {
  globalThis.fetch = originalFetch;
}

console.log(`${checks} Meals, nutrition, CoFID, backup and Worker boundary checks passed.`);
