/**
 * Parse a fetch Response body as JSON without ever throwing a raw
 * "Unexpected token ... is not valid JSON" at the UI.
 *
 * Some server responses aren't JSON even when our route always intends to return
 * it: a serverless function that exceeds its time/memory budget is killed by the
 * platform, which returns a plain-text/HTML error page instead. Calling
 * `response.json()` on that throws a cryptic SyntaxError. This helper reads the
 * body as text first and, if it isn't parseable JSON, throws a human-readable
 * Error the caller can surface directly in a toast.
 *
 * It does NOT throw on a non-2xx status whose body *is* valid JSON — callers
 * typically want to read a structured `{ error }` payload off a 4xx/5xx. Check
 * `response.ok` yourself after parsing when that matters.
 */
export async function parseJsonResponse<T = unknown>(response: Response): Promise<T> {
  const raw = await response.text();
  try {
    return (raw ? JSON.parse(raw) : {}) as T;
  } catch {
    throw new Error(
      response.ok
        ? 'The server returned an unexpected response. Please try again.'
        : 'The server took too long to respond. Please try again in a moment.',
    );
  }
}
