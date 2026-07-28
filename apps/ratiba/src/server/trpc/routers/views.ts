import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { linkViews } from '@repo/db/schema';
import { router, protectedProcedure } from '../init';

/**
 * Read-only view analytics for client-facing proposal/invoice links. Rows are
 * scoped to the caller's organization so one operator never sees another's.
 */
export const viewsRouter = router({
  forProposal: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(linkViews)
        .where(
          and(eq(linkViews.proposalId, input.proposalId), eq(linkViews.organizationId, ctx.orgId)),
        )
        .orderBy(desc(linkViews.createdAt));
    }),

  forInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(linkViews)
        .where(
          and(eq(linkViews.invoiceId, input.invoiceId), eq(linkViews.organizationId, ctx.orgId)),
        )
        .orderBy(desc(linkViews.createdAt));
    }),
});
