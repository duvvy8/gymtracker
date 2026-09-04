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
  const timeout = window.setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(url, {
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
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') {
      throw new HttpError('timeout', 'The lookup took too long and was stopped.');
    }
    throw new HttpError('offline', 'Could not reach Open Food Facts. Check your connection.');
  } finally {
    window.clearTimeout(timeout);
  }

  if (response.status === 404) {
    throw new HttpError('not-found', 'That product is not in the Open Food Facts database.');
  }
  if (response.status === 429) {
    throw new HttpError('rate-limited', 'Too many lookups just now. Wait a moment and try again.');
  }
  if (!response.ok) {
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

  let body: string;
  try {
    body = await response.text();
  } catch {
    throw new HttpError('offline', 'The response could not be read. Try again.');
  }

  if (body.length > MAX_RESPONSE_BYTES) {
    throw new HttpError('malformed', 'The response was larger than expected and was discarded.');
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new HttpError('malformed', 'The response could not be read as JSON.');
  }
}

/** A message safe to show a user for any failure this module produces. */
export function describeHttpError(error: unknown): string {
  if (error instanceof HttpError) return error.message;
  return 'Something went wrong with that lookup. Try again.';
}
