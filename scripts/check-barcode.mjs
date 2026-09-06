import assert from 'node:assert/strict';
import { mock } from 'node:test';
import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  server: { middlewareMode: true },
  appType: 'custom',
});
const originalFetch = globalThis.fetch;
let now = 100000;
let calls = 0;
let payload;
const barcode = '3017620422003';
const valid = () => ({
  status: 1,
  code: barcode,
  product: {
    code: barcode,
    product_name: 'Nutrition test fixture',
    nutriments: {
      'energy-kcal_100g': '200',
      proteins_100g: '10,5',
      carbohydrates_100g: 20,
      fat_100g: 8,
    },
  },
});
try {
  const { lookupBarcode } = await server.ssrLoadModule('/src/lib/openFoodFacts.ts');
  const { validateBarcode } = await server.ssrLoadModule('/src/lib/validation.ts');
  mock.method(performance, 'now', () => now);
  globalThis.fetch = async (url, options) => {
    calls++;
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://world.openfoodfacts.org');
    assert.equal(parsed.pathname, `/api/v2/product/${barcode}`);
    assert.ok(options.headers['X-User-Agent']);
    assert.equal(options.headers['User-Agent'], undefined);
    return Response.json(payload);
  };
  for (const code of ['96385074', '036000291452', barcode])
    assert.equal(validateBarcode(code).ok, true);
  for (const code of ['3017620422004', '123', 'abcdefgh', '12345678901234']) {
    assert.equal((await lookupBarcode(code)).outcome, 'error');
  }
  assert.equal(calls, 0);
  payload = valid();
  const found = await lookupBarcode(barcode);
  assert.equal(found.outcome, 'found');
  assert.equal(found.values.protein, '10.5');
  assert.equal(found.missingNutrition, false);
  assert.equal((await lookupBarcode(barcode)).outcome, 'error');
  assert.equal(calls, 1);

  const cases = [
    [{ status: 0 }, 'not-found'],
    [{ ...valid(), status: 0 }, 'not-found'],
    [{ ...valid(), code: '96385074' }, 'error'],
    [{ status: 1 }, 'error'],
    [{ status: 2 }, 'error'],
    [{ product: valid().product }, 'error'],
  ];
  for (const value of ['', ' ', 'Infinity', '-1', '0x10', '1e100', 100001]) {
    const response = valid();
    response.product.nutriments.proteins_100g = value;
    cases.push([response, 'error']);
  }
  for (const [response, expected] of cases) {
    now += 4100;
    payload = response;
    assert.equal((await lookupBarcode(barcode)).outcome, expected);
  }
  now += 4100;
  payload = { status: 1, product: { product_name: 'Incomplete nutrition fixture' } };
  const sparse = await lookupBarcode(barcode);
  assert.equal(sparse.outcome, 'found');
  assert.equal(sparse.missingNutrition, true);
  assert.equal(sparse.values.calories, '');
  console.log(
    'Barcode checks passed: all three formats, invalid inputs, pacing, identity, status, numeric validation and missing nutrition. No network or database writes.',
  );
} finally {
  globalThis.fetch = originalFetch;
  mock.restoreAll();
  await server.close();
}
