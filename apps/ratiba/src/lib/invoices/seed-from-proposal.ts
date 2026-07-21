import type { InvoiceLineItem } from '@repo/db/schema';
import type { AddOnLine } from '@/lib/booking-addons';

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
    if (!extra?.name?.trim()) continue;
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
 * Builds line items for the invoice a traveler generates by confirming their
 * booking: the base itinerary (one line per traveler group) plus only the
 * add-ons they actually selected, already priced by {@link priceSelections}.
 *
 * Unlike {@link buildLineItemsFromProposal}, this must not pull the proposal's
 * full `extras` list. On the booking page extras are opt-in, so an invoice that
 * billed every offered extra would not match the total the client agreed to.
 * On-request add-ons carry a 0 amount and a note, matching how the booking page
 * leaves them out of the running total until the operator quotes them.
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
    // Lead each line with its category so the invoice reads directly
    // ("Alternative accommodation", "Optional extra"), with the specific
    // lodge/extra as the description beneath it. The unit basis is not printed:
    // per-person lines carry a real quantity, so "9 x $300" already shows the
    // scaling. (The booking page keeps the operator's free-text label; here it
    // would only contradict the arithmetic when the two disagree.)
    const description = line.onRequest
      ? `${line.label} · Price to be confirmed by the operator`
      : line.label;
    items.push({
      id: `${line.kind}-${line.id}`,
      name: ADD_ON_CATEGORY[line.kind],
      description: description || undefined,
      quantity: line.quantity,
      unitPriceCents: Math.round(line.unitAmount * 100),
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
  const subtotalCents = lineItems.reduce((sum, item) => sum + lineTotalCents(item), 0);
  const taxCents = taxRatePct ? Math.round((subtotalCents * taxRatePct) / 100) : 0;
  const totalCents = subtotalCents + taxCents;
  return { subtotalCents, taxCents, totalCents };
}
