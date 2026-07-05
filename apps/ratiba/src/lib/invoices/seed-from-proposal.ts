import type { InvoiceLineItem } from '@repo/db/schema';

type PricingRow = { id: string; count: number; type: string; unitPrice: number };
type Extra = { id: string; name: string; price: number; selected: boolean };

interface ProposalSeed {
  pricingRows?: PricingRow[] | null;
  extras?: Extra[] | null;
}

/**
 * Builds invoice line items from a proposal's pricingRows + selected extras.
 * Proposal pricing is stored in dollars (float); invoice line items store cents.
 */
export function buildLineItemsFromProposal(proposal: ProposalSeed): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  for (const row of proposal.pricingRows ?? []) {
    if (!row || row.count <= 0) continue;
    items.push({
      // Namespace the source id: pricingRows and extras can share raw ids (e.g. "1"),
      // and invoice line-item ids must be unique across the merged list.
      id: `row-${row.id}`,
      name: row.type || 'Traveler',
      quantity: row.count,
      unitPriceCents: Math.round((row.unitPrice || 0) * 100),
    });
  }

  for (const extra of proposal.extras ?? []) {
    if (!extra?.selected) continue;
    items.push({
      id: `extra-${extra.id}`,
      name: extra.name || 'Extra',
      quantity: 1,
      unitPriceCents: Math.round((extra.price || 0) * 100),
    });
  }

  return items;
}

/**
 * Cents for a single line, rounded to a whole cent. Quantities can be fractional
 * (e.g. 2.5 nights), so the product must be rounded before it lands in an integer
 * cents column or gets summed. Use this everywhere a line total is computed so the
 * editor, PDF, web view, and stored subtotal always agree.
 */
export function lineTotalCents(item: Pick<InvoiceLineItem, 'quantity' | 'unitPriceCents'>): number {
  return Math.round(item.quantity * item.unitPriceCents);
}

export function computeTotals(
  lineItems: InvoiceLineItem[],
  taxRatePct: number | null | undefined,
) {
  const subtotalCents = lineItems.reduce((sum, item) => sum + lineTotalCents(item), 0);
  const taxCents = taxRatePct ? Math.round((subtotalCents * taxRatePct) / 100) : 0;
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}
