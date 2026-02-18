import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from './auth';

/**
 * Cached session lookup. Deduplicates within the same server request
 * so layout + page + tRPC all share a single DB hit.
 */
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});
