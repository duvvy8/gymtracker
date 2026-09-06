/**
 * The only place in the application allowed to call fetch. ESLint enforces
 * that with a no-restricted-syntax rule on every other file.
 *
 * Four things happen here and nowhere else:
 *   1. The request origin is checked against an allowlist, so a bug
 *      elsewhere cannot cause a request to an unexpected host.
 *   2. Every request carries an AbortController timeout.
 *   3. Responses are size-capped and content-type checked before parsing.
 *   4. Failures are converted into a small set of named kinds. The caller
 *      gets a kind, never a raw Error, a stack, or a response body, so
 *      nothing from the network can be rendered into the interface.
 */

/** Every origin this application may contact. Nothing else is reachable. */
const ALLOWED_ORIGINS: readonly string[] = ['https://world.openfoodfacts.org'];

/** Refuse to buffer a response larger than this. */
const MAX_RESPONSE_BYTES = 512 * 1024;

const DEFAULT_TIMEOUT_MS = 8000;

export type HttpFailureKind =
  'blocked' | 'offline' | 'timeout' | 'not-found' | 'rate-limited' | 'server' | 'malformed';

export class HttpError extends Error {
  readonly kind: HttpFailureKind;

  constructor(kind: HttpFailureKind, message: string) {
    super(message);
    this.name = 'HttpError';
    this.kind = kind;
  }
}

export function isAllowedUrl(url: string): boolean {
  try {
    return ALLOWED_ORIGINS.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

/**
 * GET a JSON document from an allowlisted origin.
 *
 * Returns `unknown` on purpose. The caller must run the result through a
 * zod schema; there is no type here to lull anyone into trusting it.
 */
export async function getJson(
  url: string,
  options: { timeoutMs?: number; headers?: Record<string, string> } = {},
): Promise<unknown> {
  if (!isAllowedUrl(url)) {
    throw new HttpError('blocked', 'That request was blocked because the address is not allowed.');
  }

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json', ...options.headers },
      // No cookies or credentials are sent, and none are accepted back.
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
      mode: 'cors',
    });

    if (response.status === 404) {
      throw new HttpError('not-found', 'That product is not in the Open Food Facts database.');
    }
    if (response.status === 429) {
      throw new HttpError(
        'rate-limited',
        'Too many lookups just now. Wait a moment and try again.',
      );
    }
    if (response.status !== 200) {
      throw new HttpError('server', 'Open Food Facts returned an error. Try again shortly.');
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new HttpError('malformed', 'The response was not in the expected format.');
    }

    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new HttpError('malformed', 'The response was larger than expected and was discarded.');
    }

    if (!response.body) {
      throw new HttpError('malformed', 'The response was empty. Try again.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let body = '';
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_RESPONSE_BYTES) {
          throw new HttpError(
            'malformed',
            'The response was larger than expected and was discarded.',
          );
        }
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
    } finally {
      reader.releaseLock();
    }

    try {
      return JSON.parse(body) as unknown;
    } catch {
      throw new HttpError('malformed', 'The response could not be read as JSON.');
    }
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    if (controller.signal.aborted) {
      throw new HttpError('timeout', 'The lookup took too long and was stopped. Try again.');
    }
    throw new HttpError(
      'offline',
      'Could not reach Open Food Facts. Check your connection or add the food manually.',
    );
  } finally {
    // Keep the deadline active through body consumption, and release the
    // connection on status, content-type and size failures as well.
    globalThis.clearTimeout(timeout);
    controller.abort();
  }
}
