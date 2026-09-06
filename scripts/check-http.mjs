import assert from 'node:assert/strict';
import { getJson, HttpError } from '../src/lib/http.ts';

const url = 'https://world.openfoodfacts.org/api/v2/product/3017620422003';
const originalFetch = globalThis.fetch;
let checks = 0;

async function rejects(kind, callback) {
  await assert.rejects(callback, (error) => error instanceof HttpError && error.kind === kind);
  checks++;
}

try {
  globalThis.fetch = async () => {
    throw new Error('A blocked URL must never reach fetch');
  };
  await rejects('blocked', () => getJson('https://example.com/'));
  await rejects('blocked', () => getJson('http://world.openfoodfacts.org/'));

  let signal;
  globalThis.fetch = async (_url, options) => {
    signal = options.signal;
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer');
    return Response.json({ status: 1 });
  };
  assert.deepEqual(await getJson(url), { status: 1 });
  assert.equal(signal.aborted, true);
  checks++;

  for (const [status, kind] of [
    [404, 'not-found'],
    [429, 'rate-limited'],
    [500, 'server'],
    [206, 'server'],
  ]) {
    globalThis.fetch = async () => new Response('{}', { status });
    await rejects(kind, () => getJson(url));
  }

  for (const response of [
    new Response('<html>bad</html>', { headers: { 'content-type': 'text/html' } }),
    new Response('{broken', { headers: { 'content-type': 'application/json' } }),
    new Response('{}', {
      headers: { 'content-type': 'application/json', 'content-length': '600000' },
    }),
    new Response(new Uint8Array(524289), { headers: { 'content-type': 'application/json' } }),
  ]) {
    globalThis.fetch = async () => response;
    await rejects('malformed', () => getJson(url));
  }

  // Headers arrive immediately, but the body never completes. Aborting fetch
  // errors its stream in the browser; model that behavior without a network.
  globalThis.fetch = async (_url, options) =>
    new Response(
      new ReadableStream({
        start(controller) {
          options.signal.addEventListener(
            'abort',
            () => controller.error(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        },
      }),
      { headers: { 'content-type': 'application/json' } },
    );
  await rejects('timeout', () => getJson(url, { timeoutMs: 20 }));

  globalThis.fetch = async () => {
    throw new TypeError('Private transport detail');
  };
  await rejects('offline', () => getJson(url));
  console.log(`${checks} HTTP boundary checks passed, without network requests.`);
} finally {
  globalThis.fetch = originalFetch;
}
