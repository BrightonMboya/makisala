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

export function computeTotals(
  lineItems: InvoiceLineItem[],
  taxRatePct: number | null | undefined,
) {
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceCents,
    0,
  );
  const taxCents = taxRatePct ? Math.round((subtotalCents * taxRatePct) / 100) : 0;
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}
