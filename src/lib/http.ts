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
import { DEFAULT_MEAL_MODEL, MEAL_MODEL_HEADER, type MealModelId } from './mealModels.ts';

const ALLOWED_ORIGINS: readonly string[] = ['https://world.openfoodfacts.org'];

/** Refuse to buffer a response larger than this. */
const MAX_RESPONSE_BYTES = 512 * 1024;

const DEFAULT_TIMEOUT_MS = 8000;

export type HttpFailureKind =
  | 'blocked'
  | 'offline'
  | 'timeout'
  | 'not-found'
  | 'rate-limited'
  | 'server'
  | 'malformed'
  | 'not-configured'
  | 'no-food'
  | 'unavailable';

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

/** Sends one processed image to the same-origin meal-analysis Worker. */
export async function postMealImage(
  image: Blob,
  signal?: AbortSignal,
  model: MealModelId = DEFAULT_MEAL_MODEL,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), 35_000);
  const abortFromCaller = () => controller.abort();
  signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch('/api/analyse-meal', {
      method: 'POST',
      body: image,
      signal: controller.signal,
      headers: {
        'Content-Type': image.type,
        Accept: 'application/json',
        // A request, not an instruction: the Worker re-validates this against
        // its own allow-list and falls back to the default.
        [MEAL_MODEL_HEADER]: model,
      },
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      referrerPolicy: 'no-referrer',
    });
    if (!response.ok) {
      // The Worker answers every failure with a short JSON code. Read it so the
      // distinct states stay distinct, falling back to the status when absent.
      let code = '';
      try {
        const failure = await response.text();
        if (failure.length <= MAX_RESPONSE_BYTES) {
          const parsed = JSON.parse(failure) as { error?: unknown };
          if (typeof parsed.error === 'string') code = parsed.error;
        }
      } catch {
        code = '';
      }
      if (code === 'no-food-detected') {
        throw new HttpError(
          'no-food',
          'No food was recognised in that photo. Try a clearer photo of the whole meal, or add the food another way.',
        );
      }
      if (code === 'analysis-capacity-reached') {
        throw new HttpError(
          'rate-limited',
          'AI meal analysis has reached its current usage limit. You can still add foods manually, scan a barcode, or use saved foods.',
        );
      }
      if (response.status === 429) {
        throw new HttpError(
          'rate-limited',
          'That is a few analyses in quick succession. Wait a minute and try again.',
        );
      }
      if (code === 'analysis-unavailable') {
        // Not the user's doing and not their quota: Google's model is overloaded.
        // Say so plainly rather than implying they did something wrong.
        throw new HttpError(
          'unavailable',
          "Google's AI service is overloaded right now. Your photo is still here, so press Analyse again in a moment, or add the meal manually.",
        );
      }
      if (response.status === 503) {
        throw new HttpError('not-configured', 'Photo analysis is not configured on this site yet.');
      }
      throw new HttpError(
        'server',
        'The photo could not be analysed. You can retry or enter the meal manually.',
      );
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
      throw new HttpError('malformed', 'The analysis response was not in the expected format.');
    }
    const declaredLength = Number(response.headers.get('content-length') ?? 0);
    if (declaredLength > MAX_RESPONSE_BYTES) {
      throw new HttpError('malformed', 'The analysis response was larger than expected.');
    }
    const body = await response.text();
    if (body.length > MAX_RESPONSE_BYTES) {
      throw new HttpError('malformed', 'The analysis response was larger than expected.');
    }
    return JSON.parse(body) as unknown;
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    if (controller.signal.aborted) {
      throw new HttpError(
        signal?.aborted ? 'blocked' : 'timeout',
        signal?.aborted
          ? 'Meal analysis was cancelled.'
          : 'Meal analysis took too long. Try again.',
      );
    }
    throw new HttpError(
      'offline',
      'Could not reach meal analysis. Check your connection and try again.',
    );
  } finally {
    signal?.removeEventListener('abort', abortFromCaller);
    globalThis.clearTimeout(timeout);
  }
}
