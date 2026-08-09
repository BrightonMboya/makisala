import { Logger } from 'next-axiom';

export const log = new Logger({ source: 'ratiba' });

/** Serialize an unknown error into a structured object for logging */
export function serializeError(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }
  // Some SDKs (e.g. Resend) return a plain { name, message } object rather
  // than throwing an Error, so String(error) would otherwise flatten it to
  // the useless "[object Object]".
  if (error && typeof error === 'object' && 'message' in error) {
    const { message, name } = error as { message: unknown; name?: unknown };
    return {
      message: typeof message === 'string' ? message : String(message),
      name: typeof name === 'string' ? name : undefined,
    };
  }
  return { message: String(error) };
}
