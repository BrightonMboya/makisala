/**
 * Add-ons the client can opt into on the booking page (/proposal/[id]/book):
 * optional activities, alternative lodges, and extras.
 *
 * The same functions run in the browser (for live repricing as the client
 * ticks boxes) and on the server (in proposals.confirm, which recomputes the
 * total from the stored proposal and never trusts a figure sent by the
 * browser). Keeping one implementation is the point of this file.
 */

export type AddOnUnit = 'per_person' | 'per_group';

/** An optional activity offered for a given day. */
export type ActivityOffer = {
  id: string;
  name: string;
  description: string | null;
  dayNumber: number;
  /** Null when the operator never priced it. Selectable, but adds 0 and is
   *  flagged on-request so the operator quotes it manually. */
  price: number | null;
  priceUnit: AddOnUnit;
};

/** An alternative lodge offered for one night. */
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
  priceBasis: 'flat' | 'per_person';
  /** Operator's free-text label, shown verbatim so the client sees the basis
   *  the operator actually wrote (e.g. "per person / per night"). */
  priceUnitLabel: string | null;
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
  /** proposalDay.id -> chosen alternative id. A missing day means the client
   *  kept the primary lodge. */
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

/** Money rounding. Sub-cent drift would otherwise show up as a total that
 *  differs between the page and the confirmation email. */
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

/** 'custom' and 'free' extras carry a free-text unit we cannot compute with, so
 *  they are applied once. 'free' is priced at 0 upstream. */
function multiplier(
  unit: ExtraOffer['unit'] | AddOnUnit | AlternativeOffer['priceBasis'],
  travelerCount: number,
): number {
  return unit === 'per_person' ? Math.max(1, travelerCount) : 1;
}

export type AddOnLine = {
  kind: 'activity' | 'alternative' | 'extra';
  id: string;
  label: string;
  /** Unit basis shown next to the amount, e.g. "per person x 4". */
  detail: string | null;
  amount: number;
  /** Operator must quote this one manually; it contributes 0 to the total. */
  onRequest: boolean;
};

/**
 * Prices a set of selections. Unknown ids are ignored rather than throwing:
 * the client may be holding a stale page after the operator edited the
 * proposal, and dropping the vanished option is better than failing the
 * booking outright.
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
      onRequest: false,
    });
  }

  for (const [dayId, altId] of Object.entries(selections.alternativeByDayId)) {
    const alt = addOns.alternatives.find((x) => x.dayId === dayId && x.id === altId);
    if (!alt) continue;
    const qty = multiplier(alt.priceBasis, travelerCount);
    lines.push({
      kind: 'alternative',
      id: alt.id,
      label: `Day ${alt.dayNumber}: ${alt.name}${alt.primaryName ? ` instead of ${alt.primaryName}` : ''}`,
      detail: alt.priceUnitLabel ?? (alt.priceBasis === 'per_person' ? `per person x ${qty}` : null),
      amount: money(alt.additionalPrice * qty),
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
      onRequest: false,
    });
  }

  return { lines, addOnTotal: money(lines.reduce((acc, l) => acc + l.amount, 0)) };
}

/** Base itinerary price plus selected add-ons. */
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

/**
 * Narrows arbitrary stored JSON to a Selections. Used when reading
 * proposals.client_selections back, which may predate this shape.
 */
export function parseSelections(value: unknown): Selections {
  if (!value || typeof value !== 'object') return EMPTY_SELECTIONS;
  const v = value as Partial<Selections>;
  return {
    activityIds: Array.isArray(v.activityIds) ? v.activityIds.filter((x) => typeof x === 'string') : [],
    alternativeByDayId:
      v.alternativeByDayId && typeof v.alternativeByDayId === 'object'
        ? Object.fromEntries(
            Object.entries(v.alternativeByDayId).filter(
              ([k, val]) => typeof k === 'string' && typeof val === 'string',
            ),
          )
        : {},
    extraIds: Array.isArray(v.extraIds) ? v.extraIds.filter((x) => typeof x === 'string') : [],
  };
}
