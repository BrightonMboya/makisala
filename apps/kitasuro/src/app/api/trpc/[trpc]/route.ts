import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createContext } from '@/server/trpc/init';
import { appRouter } from '@/server/trpc/router';
import { log } from '@/lib/logger';

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext,
    onError({ error, path }) {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        log.error('tRPC handler error', {
          path,
          code: error.code,
          message: error.message,
        });
      }
    },
  });
}

export { handler as GET, handler as POST };
