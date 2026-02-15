import { initTRPC, TRPCError } from '@trpc/server';
import { db } from '@repo/db';
import { member } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import superjson from 'superjson';

export async function createContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return { session, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

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

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }

  const orgId = await resolveOrgId(
    ctx.db,
    ctx.session.user.id,
    ctx.session.session?.activeOrganizationId as string | undefined,
  );

  return next({
    ctx: { ...ctx, user: ctx.session.user, orgId },
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
