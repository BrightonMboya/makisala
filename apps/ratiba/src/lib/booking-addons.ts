/**
 * Add-ons the client can opt into on the booking page (/proposal/[id]/book).
 *
 * Runs in the browser (live repricing) and on the server (proposals.confirm,
 * which recomputes from the stored proposal and never trusts a browser figure).
 */

export type AddOnUnit = 'per_person' | 'per_group';

export type ActivityOffer = {
  id: string;
  name: string;
  description: string | null;
  dayNumber: number;
  /** Null when unpriced: selectable, but adds 0 and is flagged on-request. */
  price: number | null;
  priceUnit: AddOnUnit;
};

export type AlternativeBasis = 'flat' | 'per_person' | 'per_room';

export type AlternativeOffer = {
  id: string;
  dayId: string;
  dayNumber: number;
  name: string;
  /** The lodge this would replace, for "instead of X" copy. */
  primaryName: string | null;
  rooms: string | null;
  meals: string | null;
  images: string[];
  /** Signed delta against the primary lodge: negative is cheaper. */
  additionalPrice: number;
  /**
   * Sole input to both the arithmetic and the unit shown to the client. There
   * is deliberately no free-text unit alongside it: the two used to be able to
   * disagree, and the client reads the text while the invoice bills the basis.
   */
  priceBasis: AlternativeBasis;
  /** Rooms in this alternative, the multiplier for `per_room`. */
  roomCount: number;
};

export type ExtraOffer = {
  id: string;
  name: string;
  price: number;
  unit: 'per_person' | 'per_group' | 'free' | 'custom';
  customUnitLabel: string | null;
};

export type BookingAddOns = {
  activities: ActivityOffer[];
  alternatives: AlternativeOffer[];
  extras: ExtraOffer[];
};

export type Selections = {
  activityIds: string[];
  /** proposalDay.id -> alternative id. A missing day means the primary lodge. */
  alternativeByDayId: Record<string, string>;
  extraIds: string[];
};

export const EMPTY_SELECTIONS: Selections = {
  activityIds: [],
  alternativeByDayId: {},
  extraIds: [],
};

export function hasAddOns(addOns: BookingAddOns): boolean {
  return (
    addOns.activities.length > 0 || addOns.alternatives.length > 0 || addOns.extras.length > 0
  );
}

export function isSelectionEmpty(s: Selections): boolean {
  return (
    s.activityIds.length === 0 &&
    s.extraIds.length === 0 &&
    Object.keys(s.alternativeByDayId).length === 0
  );
}

/** Rounds to whole cents so the page and the confirmation email agree. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 'custom' and 'free' carry a free-text unit we cannot compute with, so they
 *  are applied once. */
function multiplier(
  unit: ExtraOffer['unit'] | AddOnUnit | AlternativeBasis,
  travelerCount: number,
  roomCount = 1,
): number {
  if (unit === 'per_person') return Math.max(1, travelerCount);
  if (unit === 'per_room') return Math.max(1, roomCount);
  return 1;
}

/** The unit shown beside an alternative's amount. Derived, never free text. */
export function basisLabel(basis: AlternativeBasis, quantity: number): string | null {
  if (basis === 'per_person') return `per person x ${quantity}`;
  if (basis === 'per_room') return `per room x ${quantity}`;
  return null;
}

/** Short form for the offer list, e.g. "+$450 per person". */
export function basisSuffix(basis: AlternativeBasis): string {
  if (basis === 'per_person') return ' per person';
  if (basis === 'per_room') return ' per room';
  return '';
}

export type AddOnLine = {
  kind: 'activity' | 'alternative' | 'extra';
  id: string;
  label: string;
  /** Unit basis shown next to the amount, e.g. "per person x 4". */
  detail: string | null;
  /** unitAmount x quantity. */
  amount: number;
  unitAmount: number;
  /** Traveler count for per-person pricing, otherwise 1. */
  quantity: number;
  /** Operator must quote this one manually; it contributes 0 to the total. */
  onRequest: boolean;
};

/**
 * Unknown ids are ignored rather than throwing: the client may hold a stale
 * page after the operator edited the proposal, and dropping the vanished
 * option beats failing the booking.
 */
export function priceSelections(
  addOns: BookingAddOns,
  selections: Selections,
  travelerCount: number,
): { lines: AddOnLine[]; addOnTotal: number } {
  const lines: AddOnLine[] = [];

  for (const id of selections.activityIds) {
    const a = addOns.activities.find((x) => x.id === id);
    if (!a) continue;
    if (a.price == null) {
      lines.push({
        kind: 'activity',
        id: a.id,
        label: `${a.name} (Day ${a.dayNumber})`,
        detail: null,
        amount: 0,
        unitAmount: 0,
        quantity: 1,
        onRequest: true,
      });
      continue;
    }
    const qty = multiplier(a.priceUnit, travelerCount);
    lines.push({
      kind: 'activity',
      id: a.id,
      label: `${a.name} (Day ${a.dayNumber})`,
      detail: a.priceUnit === 'per_person' ? `per person x ${qty}` : 'per group',
      amount: money(a.price * qty),
      unitAmount: a.price,
      quantity: qty,
      onRequest: false,
    });
  }

  for (const [dayId, altId] of Object.entries(selections.alternativeByDayId)) {
    const alt = addOns.alternatives.find((x) => x.dayId === dayId && x.id === altId);
    if (!alt) continue;
    const qty = multiplier(alt.priceBasis, travelerCount, alt.roomCount);
    lines.push({
      kind: 'alternative',
      id: alt.id,
      label: `Day ${alt.dayNumber}: ${alt.name}${alt.primaryName ? ` instead of ${alt.primaryName}` : ''}`,
      detail: basisLabel(alt.priceBasis, qty),
      amount: money(alt.additionalPrice * qty),
      unitAmount: alt.additionalPrice,
      quantity: qty,
      onRequest: false,
    });
  }

  for (const id of selections.extraIds) {
    const e = addOns.extras.find((x) => x.id === id);
    if (!e) continue;
    const price = e.unit === 'free' ? 0 : e.price;
    const qty = multiplier(e.unit, travelerCount);
    let detail: string | null = null;
    if (e.unit === 'per_person') detail = `per person x ${qty}`;
    else if (e.unit === 'per_group') detail = 'per group';
    else if (e.unit === 'custom') detail = e.customUnitLabel;
    else if (e.unit === 'free') detail = 'Free';
    lines.push({
      kind: 'extra',
      id: e.id,
      label: e.name,
      detail,
      amount: money(price * qty),
      unitAmount: price,
      quantity: qty,
      onRequest: false,
    });
  }

  return { lines, addOnTotal: money(lines.reduce((acc, l) => acc + l.amount, 0)) };
}

export function computeBookingTotal(
  baseTotal: number,
  addOns: BookingAddOns,
  selections: Selections,
  travelerCount: number,
): { lines: AddOnLine[]; addOnTotal: number; total: number } {
  const { lines, addOnTotal } = priceSelections(addOns, selections, travelerCount);
  return { lines, addOnTotal, total: money(baseTotal + addOnTotal) };
}

/** Formats a signed delta for display, e.g. "+$450" / "-$200" / "Included". */
export function formatDelta(amount: number): string {
  if (amount === 0) return 'No change';
  const sign = amount > 0 ? '+' : '-';
  return `${sign}$${Math.abs(Math.round(amount)).toLocaleString()}`;
}

/** What a priced line reads as in the summary. Zero-cost extras are free, not
 *  "no change" — that phrasing only makes sense for a lodge swap. */
export function formatLineAmount(line: AddOnLine): string {
  if (line.onRequest) return 'On request';
  if (line.amount === 0 && line.kind !== 'alternative') return 'Free';
  return formatDelta(line.amount);
}

/** Ids repeated in one list would price and invoice the same option twice, so
 *  every list is deduped before it reaches the arithmetic. */
function uniqueStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((x): x is string => typeof x === 'string'))];
}

/** Narrows stored client_selections JSON, which may predate this shape. */
export function parseSelections(value: unknown): Selections {
  if (!value || typeof value !== 'object') return EMPTY_SELECTIONS;
  const v = value as Partial<Selections>;
  return {
    activityIds: uniqueStrings(v.activityIds),
    alternativeByDayId:
      v.alternativeByDayId && typeof v.alternativeByDayId === 'object'
        ? Object.fromEntries(
            Object.entries(v.alternativeByDayId).filter(
              ([k, val]) => typeof k === 'string' && typeof val === 'string',
            ),
          )
        : {},
    extraIds: uniqueStrings(v.extraIds),
  };
}
