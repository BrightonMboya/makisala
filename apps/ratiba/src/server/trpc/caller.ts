import { db } from '@repo/db';
import { user as userTable, session as sessionTable } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { createCallerFactory, createContext } from './init';
import { appRouter } from './router';

const createCaller = createCallerFactory(appRouter);

export async function createServerCaller() {
  const ctx = await createContext();
  return createCaller(ctx);
}

/**
 * Caller for MCP tool calls. These authenticate via an OAuth access token
 * (no browser cookie exists), so there's no real better-auth Session row to
 * hand `protectedProcedure` — we look up the real user and splice in the org
 * already resolved from the token's claims instead of createServerCaller's
 * cookie-bound getSession().
 */
export async function createMcpCaller(userId: string, orgId: string) {
  const [dbUser] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);
  if (!dbUser) {
    throw new Error('MCP access token references a user that no longer exists');
  }

  const session = {
    user: dbUser,
    // No real session row backs an OAuth-token request; only activeOrganizationId
    // is read downstream (by resolveOrgId, which we've already short-circuited).
    session: { activeOrganizationId: orgId } as unknown as typeof sessionTable.$inferSelect,
  };

  return createCaller({ getSession: async () => session, db });
}
