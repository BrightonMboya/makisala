'use client';

import { useLogger } from 'next-axiom';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const log = useLogger();

  useEffect(() => {
    log.error('Page error boundary', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error, log]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <h1 className="mb-2 text-xl font-semibold">Something went wrong</h1>
      <p className="mb-6 text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-green-700 px-6 py-2 text-sm font-medium text-white hover:bg-green-800"
      >
        Try again
      </button>
    </div>
  );
}
