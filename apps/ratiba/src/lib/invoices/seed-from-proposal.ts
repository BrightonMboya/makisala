import type { InvoiceLineItem } from '@repo/db/schema';
import type { AddOnLine } from '@/lib/booking-addons';

type PricingRow = { id: string; count: number; type: string; unitPrice: number };

/**
 * Line items from a proposal's pricingRows (the base itinerary) plus a set of
 * priced add-on lines (optional activities, alternative lodges, extras).
 * Proposal pricing is stored in dollars (float); invoice line items store cents.
 */
export function buildCheckoutLineItems(
  pricingRows: PricingRow[] | null | undefined,
  addOnLines: AddOnLine[],
): InvoiceLineItem[] {
  const items: InvoiceLineItem[] = [];

  for (const row of pricingRows ?? []) {
    if (!row || row.count <= 0) continue;
    items.push({
      id: `row-${row.id}`,
      name: row.type || 'Traveler',
      quantity: row.count,
      unitPriceCents: Math.round((row.unitPrice || 0) * 100),
    });
  }

  for (const line of addOnLines) {
    // Category leads, specifics go beneath. The free-text basis label is not
    // printed: quantity already shows the scaling, and the two can disagree.
    const description = line.onRequest
      ? `${line.label} · Price to be confirmed by the operator`
      : line.label;
    items.push({
      id: `${line.kind}-${line.id}`,
      name: ADD_ON_CATEGORY[line.kind],
      description: description || undefined,
      quantity: line.quantity,
      unitPriceCents: Math.round(line.unitAmount * 100),
      // Optional line: the operator opts it into the total per-invoice, not billed by default.
      included: false,
    });
  }

  return items;
}

const ADD_ON_CATEGORY: Record<AddOnLine['kind'], string> = {
  activity: 'Optional activity',
  alternative: 'Alternative accommodation',
  extra: 'Optional extra',
};

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
  const subtotalCents = lineItems.reduce(
    (sum, item) => sum + (item.included === false ? 0 : lineTotalCents(item)),
    0,
  );
  const taxCents = taxRatePct ? Math.round((subtotalCents * taxRatePct) / 100) : 0;
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}
