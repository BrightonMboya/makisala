import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { emailMessages } from '@repo/db/schema';
import { router, protectedProcedure } from '../init';

/**
 * Read-only delivery analytics for outbound client emails. Rows are scoped to
 * the caller's organization so one operator never sees another's send history.
 */
export const emailsRouter = router({
  // Delivery timeline for a proposal's sends, newest first.
  forProposal: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(emailMessages)
        .where(
          and(
            eq(emailMessages.proposalId, input.proposalId),
            eq(emailMessages.organizationId, ctx.orgId),
          ),
        )
        .orderBy(desc(emailMessages.sentAt));
    }),

  // Delivery timeline for an invoice's sends, newest first.
  forInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(emailMessages)
        .where(
          and(
            eq(emailMessages.invoiceId, input.invoiceId),
            eq(emailMessages.organizationId, ctx.orgId),
          ),
        )
        .orderBy(desc(emailMessages.sentAt));
    }),
});
