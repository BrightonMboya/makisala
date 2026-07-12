import { randomBytes, randomUUID } from 'crypto';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { invoices, proposals } from '@repo/db/schema';
import type { Invoice, InvoiceLineItem, InvoicePartyDetails } from '@repo/db/schema';
import { sendInvoiceShareEmail } from '@repo/resend';
import { recordSentEmail } from '@repo/db';
import { router, protectedProcedure, publicProcedure } from '../init';
import { getNextInvoiceNumber } from '@/lib/invoices/numbering';
import { buildLineItemsFromProposal, computeTotals } from '@/lib/invoices/seed-from-proposal';
import {
  getOrgPaymentMethodSnapshot,
  resolveInvoicePaymentMethods,
} from '@/lib/invoices/payment-methods';
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf';
import { uploadPdfToStorage } from '@/lib/storage';
import { env } from '@/lib/env';

const lineItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(500),
  description: z.string().max(2000).nullish(),
  quantity: z.number().min(0),
  unitPriceCents: z.number().int(),
});

const partySchema = z
  .object({
    name: z.string().max(255).nullish(),
    email: z.string().max(255).nullish(),
    phone: z.string().max(64).nullish(),
    address: z.string().max(1000).nullish(),
    taxId: z.string().max(64).nullish(),
    logoUrl: z.string().max(2000).nullish(),
  })
  .nullish();

async function loadOwnedInvoice(
  ctx: { db: typeof import('@repo/db').db; orgId: string },
  id: string,
) {
  const invoice = await ctx.db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.organizationId, ctx.orgId)),
  });
  if (!invoice) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
  }
  return invoice;
}

export const invoicesRouter = router({
  listForProposal: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.invoices.findMany({
        where: and(
          eq(invoices.proposalId, input.proposalId),
          eq(invoices.organizationId, ctx.orgId),
        ),
        orderBy: desc(invoices.createdAt),
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => loadOwnedInvoice(ctx, input.id)),

  createFromProposal: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        title: z.string().max(255).optional(),
        dueDate: z.string().optional(),
        taxRatePct: z.number().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(
          eq(proposals.id, input.proposalId),
          eq(proposals.organizationId, ctx.orgId),
        ),
        with: {
          organization: true,
          client: { columns: { id: true, name: true, email: true, phone: true } },
        },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      const lineItems = buildLineItemsFromProposal({
        pricingRows: proposal.pricingRows,
        extras: proposal.extras,
      });
      const { subtotalCents, taxCents, totalCents } = computeTotals(
        lineItems,
        input.taxRatePct,
      );

      const fromDetails: InvoicePartyDetails = {
        name: proposal.organization?.name ?? null,
        email: proposal.organization?.notificationEmail ?? null,
        phone: proposal.organization?.phone ?? null,
        address: proposal.organization?.address ?? null,
        taxId: proposal.organization?.taxId ?? null,
        logoUrl: proposal.organization?.logoUrl ?? null,
      };
      const toDetails: InvoicePartyDetails = {
        name: proposal.client?.name ?? null,
        email: proposal.client?.email ?? null,
        phone: proposal.client?.phone ?? null,
      };

      const id = randomUUID();
      const number = await getNextInvoiceNumber(ctx.orgId);
      const shareToken = randomBytes(24).toString('base64url');
      const paymentMethodSnapshot = await getOrgPaymentMethodSnapshot(ctx.db, ctx.orgId);

      const [created] = await ctx.db
        .insert(invoices)
        .values({
          id,
          organizationId: ctx.orgId,
          proposalId: proposal.id,
          clientId: proposal.client?.id ?? null,
          number,
          title: input.title ?? null,
          currency: 'USD',
          lineItems,
          subtotalCents,
          taxRatePct: input.taxRatePct ? String(input.taxRatePct) : null,
          taxCents,
          totalCents,
          fromDetails,
          toDetails,
          paymentMethods: paymentMethodSnapshot,
          dueDate: input.dueDate ?? null,
          shareToken,
        })
        .returning();

      if (!created) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invoice',
        });
      }

      return created;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().max(255).nullish(),
        currency: z.string().length(3).optional(),
        lineItems: z.array(lineItemSchema).optional(),
        taxRatePct: z.number().min(0).max(100).nullish(),
        notes: z.string().max(5000).nullish(),
        dueDate: z.string().nullish(),
        issueDate: z.string().optional(),
        fromDetails: partySchema,
        toDetails: partySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await loadOwnedInvoice(ctx, input.id);

      if (existing.sentAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot edit an invoice that has already been sent',
        });
      }

      const nextLineItems: InvoiceLineItem[] = input.lineItems ?? existing.lineItems;
      const nextTaxRatePct =
        input.taxRatePct === undefined
          ? existing.taxRatePct
            ? Number(existing.taxRatePct)
            : null
          : input.taxRatePct;
      const { subtotalCents, taxCents, totalCents } = computeTotals(
        nextLineItems,
        nextTaxRatePct,
      );

      const [updated] = await ctx.db
        .update(invoices)
        .set({
          title: input.title === undefined ? existing.title : input.title,
          currency: input.currency ?? existing.currency,
          lineItems: nextLineItems,
          taxRatePct: nextTaxRatePct == null ? null : String(nextTaxRatePct),
          subtotalCents,
          taxCents,
          totalCents,
          notes: input.notes === undefined ? existing.notes : input.notes,
          dueDate: input.dueDate === undefined ? existing.dueDate : input.dueDate,
          issueDate: input.issueDate ?? existing.issueDate,
          fromDetails:
            input.fromDetails === undefined ? existing.fromDetails : input.fromDetails ?? null,
          toDetails:
            input.toDetails === undefined ? existing.toDetails : input.toDetails ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(invoices.id, input.id))
        .returning();

      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await loadOwnedInvoice(ctx, input.id);
      if (existing.sentAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot delete an invoice that has already been sent',
        });
      }
      await ctx.db.delete(invoices).where(eq(invoices.id, input.id));
      return { success: true };
    }),

  send: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        recipientEmail: z.string().email().optional(),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await loadOwnedInvoice(ctx, input.id);

      const organization = await ctx.db.query.organizations.findFirst({
        where: (org, { eq: eqOp }) => eqOp(org.id, ctx.orgId),
        columns: { name: true, slug: true, notificationEmail: true },
      });

      const recipient =
        input.recipientEmail?.trim() ||
        (existing.toDetails as InvoicePartyDetails | null)?.email?.trim() ||
        null;
      if (!recipient) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No recipient email. Add one to the invoice or pass recipientEmail.',
        });
      }

      // Refresh the payout-method snapshot at send time so the frozen invoice
      // captures the operator's current details, then render the PDF from it.
      const paymentMethodSnapshot = await getOrgPaymentMethodSnapshot(ctx.db, ctx.orgId);
      const invoiceForRender: Invoice = { ...existing, paymentMethods: paymentMethodSnapshot };
      const pdfBuffer = await renderInvoicePdf(invoiceForRender);

      const pdfKey = `invoices/${ctx.orgId}/${existing.id}.pdf`;
      await uploadPdfToStorage({ file: pdfBuffer, key: pdfKey });

      const shareToken =
        existing.shareToken || randomBytes(24).toString('base64url');
      const invoiceUrl = `${env.NEXT_PUBLIC_APP_URL}/invoice/${shareToken}`;

      const amountDisplay = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: existing.currency,
        maximumFractionDigits: 2,
      }).format(existing.totalCents / 100);

      const dueDateDisplay = existing.dueDate
        ? new Date(existing.dueDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : undefined;

      const result = await sendInvoiceShareEmail({
        clientEmail: recipient,
        clientName: (existing.toDetails as InvoicePartyDetails | null)?.name ?? 'Guest',
        agencyName: organization?.name ?? 'Your Travel Agency',
        orgSlug: organization?.slug ?? null,
        invoiceNumber: existing.number,
        invoiceTitle: existing.title ?? undefined,
        amountDisplay,
        dueDate: dueDateDisplay,
        invoiceUrl,
        message: input.message,
        replyTo: organization?.notificationEmail ?? undefined,
        pdfAttachment: {
          filename: `${existing.number}.pdf`,
          content: pdfBuffer,
        },
      });

      if (!result.success) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: result.error ?? 'Failed to send invoice email',
        });
      }

      // Log the send for delivery analytics (best-effort: never block the flow).
      if (result.id) {
        try {
          await recordSentEmail(ctx.db, {
            resendId: result.id,
            type: 'invoice_share',
            toEmail: recipient,
            subject: `Invoice ${existing.number} from ${organization?.name ?? 'Your Travel Agency'}`,
            organizationId: ctx.orgId,
            invoiceId: existing.id,
          });
        } catch {
          // Analytics logging is non-critical; the email already went out.
        }
      }

      const sentAt = new Date().toISOString();
      const [updated] = await ctx.db
        .update(invoices)
        .set({
          sentAt,
          status: 'sent',
          pdfKey,
          shareToken,
          paymentMethods: paymentMethodSnapshot,
          updatedAt: sentAt,
        })
        .where(eq(invoices.id, existing.id))
        .returning();

      return updated;
    }),

  setPaid: protectedProcedure
    .input(z.object({ id: z.string(), paid: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await loadOwnedInvoice(ctx, input.id);

      const now = new Date().toISOString();
      const [updated] = await ctx.db
        .update(invoices)
        .set(
          input.paid
            ? {
                status: 'paid',
                paidAt: now,
                amountPaidCents: existing.totalCents,
                updatedAt: now,
              }
            : {
                // Reverting a paid invoice returns it to "sent" if it was emailed,
                // otherwise back to "draft" (e.g. an offline/POS payment recorded
                // before the invoice was ever sent). Clears the payment record.
                status: existing.sentAt ? 'sent' : 'draft',
                paidAt: null,
                amountPaidCents: 0,
                updatedAt: now,
              },
        )
        .where(eq(invoices.id, existing.id))
        .returning();

      return updated;
    }),

  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const invoice = await ctx.db.query.invoices.findFirst({
        where: eq(invoices.shareToken, input.token),
        with: {
          organization: { columns: { name: true, logoUrl: true } },
        },
      });
      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }
      const resolvedMethods = await resolveInvoicePaymentMethods(ctx.db, invoice);
      return { ...invoice, paymentMethods: resolvedMethods };
    }),
});
