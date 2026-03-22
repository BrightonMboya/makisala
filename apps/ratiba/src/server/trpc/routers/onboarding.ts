import { organizations, tours } from '@repo/db/schema';
import { eq, sql } from 'drizzle-orm';
import { router, protectedProcedure } from '../init';

export const onboardingRouter = router({
  getData: protectedProcedure.query(async ({ ctx }) => {
    const [orgData, countResult] = await Promise.all([
      ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, ctx.orgId),
        columns: {
          id: true,
          name: true,
          logoUrl: true,
          notificationEmail: true,
          onboardingCompletedAt: true,
        },
      }),
      ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(tours)
        .where(eq(tours.organizationId, ctx.orgId)),
    ]);

    return { organization: orgData ?? null, tourCount: countResult[0]?.count ?? 0 };
  }),

  markComplete: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(organizations)
      .set({ onboardingCompletedAt: new Date() })
      .where(eq(organizations.id, ctx.orgId));

    return { success: true };
  }),
});
