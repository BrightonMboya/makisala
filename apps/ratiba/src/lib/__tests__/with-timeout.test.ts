import { describe, expect, test } from 'bun:test';
import { withTimeout } from '../with-timeout';

const delay = <T>(ms: number, value: T): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const rejectAfter = (ms: number, err: Error): Promise<never> =>
  new Promise((_, reject) => setTimeout(() => reject(err), ms));

describe('withTimeout', () => {
  test('passes through the value when work settles before the budget', async () => {
    await expect(withTimeout(delay(10, 'ok'), 1_000, 'fast')).resolves.toBe('ok');
  });

  test('rejects with a labeled timeout error when work exceeds the budget', async () => {
    // This is the core regression guard: a hung render must reject in-process
    // (catchable, loggable) rather than run forever until the platform kills the
    // whole function and returns a non-JSON error page.
    await expect(withTimeout(delay(1_000, 'too slow'), 20, 'PDF render')).rejects.toThrow(
      'PDF render timed out after 20ms',
    );
  });

  test("propagates work's own rejection unchanged when it fails before the budget", async () => {
    const boom = new Error('render blew up');
    await expect(withTimeout(rejectAfter(10, boom), 1_000, 'render')).rejects.toBe(boom);
  });

  test('does not leave a pending timer alive after the fast path resolves', async () => {
    // If the timer were never cleared it would keep the event loop alive and could
    // still reject after the promise already resolved. Await, then give the old
    // (short) timeout window time to fire — nothing should throw.
    const value = await withTimeout(delay(5, 42), 30, 'op');
    expect(value).toBe(42);
    await delay(60, null); // outlives the original 30ms budget; no late rejection
  });

  test('uses a default label when none is provided', async () => {
    await expect(withTimeout(delay(1_000, 'x'), 10)).rejects.toThrow('Operation timed out after 10ms');
  });
});
