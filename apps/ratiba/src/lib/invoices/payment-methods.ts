import { paymentMethods } from '@repo/db/schema';
import type { InvoicePaymentMethod } from '@repo/db/schema';
import { asc, eq } from 'drizzle-orm';
import type { db as Database } from '@repo/db';

/**
 * Reads the org's payout methods in display order, shaped for freezing onto an
 * invoice. We copy the details rather than referencing the live rows so a sent
 * invoice's "how to pay" section stays stable if the operator later edits them.
 */
export async function getOrgPaymentMethodSnapshot(
  db: typeof Database,
  organizationId: string,
): Promise<InvoicePaymentMethod[]> {
  const rows = await db
    .select({
      type: paymentMethods.type,
      label: paymentMethods.label,
      instructions: paymentMethods.instructions,
      url: paymentMethods.url,
    })
    .from(paymentMethods)
    .where(eq(paymentMethods.organizationId, organizationId))
    .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt));

  return rows.map((r) => ({
    type: r.type,
    label: r.label,
    instructions: r.instructions,
    url: r.url,
  }));
}

/**
 * Payment methods to display for an invoice: the frozen snapshot if it has one,
 * otherwise the org's live methods. This keeps sent invoices immutable while
 * letting drafts (and invoices created before snapshotting existed) show the
 * operator's current payout details.
 */
export async function resolveInvoicePaymentMethods(
  db: typeof Database,
  invoice: { paymentMethods?: InvoicePaymentMethod[] | null; organizationId: string },
): Promise<InvoicePaymentMethod[]> {
  if (invoice.paymentMethods && invoice.paymentMethods.length > 0) {
    return invoice.paymentMethods;
  }
  return getOrgPaymentMethodSnapshot(db, invoice.organizationId);
}
