import { initTRPC, TRPCError } from '@trpc/server';
import { db } from '@repo/db';
import { member } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { log } from '@/lib/logger';
import superjson from 'superjson';
import { getSession } from '@/lib/session';

export async function createContext() {
  // Lazy session: only resolved when accessed, so public procedures skip the DB hit
  return { getSession, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;

const loggerMiddleware = t.middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();

  if (!result.ok) {
    log.error('tRPC error', {
      path,
      type,
      durationMs: Date.now() - start,
      userId: ctx.session?.user?.id,
      error: {
        code: result.error.code,
        message: result.error.message,
      },
    });
  }

  return result;
});

export const publicProcedure = t.procedure.use(loggerMiddleware);

/** Escape SQL LIKE wildcards (%, _) in user input to prevent pattern injection */
export function escapeLikeQuery(query: string): string {
  return query.replace(/[%_\\]/g, '\\$&');
}

async function resolveOrgId(dbInstance: typeof db, userId: string, sessionOrgId?: string | null): Promise<string> {
  if (sessionOrgId) return sessionOrgId;

  const [membership] = await dbInstance
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1);

  if (!membership?.organizationId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No organization found' });
  }
  return membership.organizationId;
}

export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const session = await ctx.getSession();
  if (!session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  const orgId = await resolveOrgId(
    ctx.db,
    session.user.id,
    session.session?.activeOrganizationId as string | undefined,
  );

  return next({
    ctx: { ...ctx, session, user: session.user, orgId },
  });
});

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  const [membership] = await ctx.db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.userId, ctx.user.id), eq(member.organizationId, ctx.orgId)))
    .limit(1);

  if (membership?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }

  return next({ ctx });
});
