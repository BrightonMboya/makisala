import { db } from '@repo/db';
import { invoices } from '@repo/db/schema';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Returns the next sequential invoice number for an organization, scoped to
 * the current calendar year. Format: INV-YYYY-####.
 *
 * Uses a regex to extract the trailing numeric suffix from the most recent
 * invoice for this org+year so gaps from deletions do not reset the counter.
 */
export async function getNextInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getUTCFullYear();
  const prefix = `INV-${year}-`;

  const [row] = await db
    .select({ number: invoices.number })
    .from(invoices)
    .where(
      and(
        eq(invoices.organizationId, organizationId),
        sql`${invoices.number} like ${prefix + '%'}`,
        sql`${invoices.number} ~ '[0-9]+$'`,
      ),
    )
    .orderBy(sql`cast(substring(${invoices.number} from '[0-9]+$') as integer) desc`)
    .limit(1);

  const lastSeq = row?.number ? parseInt(row.number.slice(prefix.length), 10) : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}
