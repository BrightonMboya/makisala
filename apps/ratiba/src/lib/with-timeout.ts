/**
 * Reject `work` if it doesn't settle within `ms`, otherwise pass through its
 * result. Used to bound operations that would otherwise be able to hang — most
 * importantly the headless-Chromium PDF render, which runs inside a fixed
 * serverless budget. If we let it hang past that budget the *platform* kills the
 * whole function: an uncatchable kill that skips our try/catch and log flush and
 * returns a non-JSON error page to the caller. An in-process timeout keeps the
 * failure catchable so the caller can log it and degrade gracefully.
 *
 * The timer is always cleared once `work` settles, so a resolved fast path never
 * leaves a dangling handle keeping the event loop alive.
 */
export function withTimeout<T>(work: Promise<T>, ms: number, label = 'Operation'): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    work.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}
