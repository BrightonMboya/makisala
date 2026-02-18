import { Logger } from 'next-axiom';

export const log = new Logger({ source: 'kitasuro' });

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
  return { message: String(error) };
}
