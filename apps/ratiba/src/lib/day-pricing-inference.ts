// Derives the pricing-engine flags (dayKind, isTransit, mealCostId) from a
// day's own content instead of a manual per-day toggle. Runs identically on
// the client (live pricing preview) and the server (proposals.save), so a
// proposal gets the same numbers whether it was built in the UI or created
// through the MCP connector, which has no way to set these fields manually.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TRANSFER_NAME_RE = /transfer/i;
const AIRPORT_NAME_RE = /airport|airstrip/i;

export type DayKind = 'touring' | 'airport_transfer' | 'none';

export type InferrableDay = {
  accommodation?: string | null;
  destination?: string | null;
  activities?: { name?: string | null }[] | null;
  transfer?: { originName?: string | null; destinationName?: string | null } | null;
};

export type InferredDayFlags = {
  dayKind: DayKind;
  isTransit: boolean;
  mealCostId: string | null;
};

const isParkDestination = (destination?: string | null) => !!destination && UUID_RE.test(destination);
const isTransferLikeActivity = (name?: string | null) => !!name && TRANSFER_NAME_RE.test(name);
const touchesAirport = (name?: string | null) => !!name && AIRPORT_NAME_RE.test(name);

/**
 * `days` is the full itinerary in order — neighbors are needed to tell an
 * arrival/departure day from a rest day at the same lodge. `index` is the
 * day being classified.
 */
export function inferDayPricingFlags(days: InferrableDay[], index: number): InferredDayFlags {
  const day = days[index];
  if (!day) return { dayKind: 'touring', isTransit: false, mealCostId: null };

  const activities = day.activities ?? [];
  const hasRealActivity = activities.some((a) => !isTransferLikeActivity(a.name));
  const hasTransfer = !!day.transfer;
  const transferTouchesAirport =
    hasTransfer && (touchesAirport(day.transfer?.originName) || touchesAirport(day.transfer?.destinationName));
  const isFirstOrLastDay = index === 0 || index === days.length - 1;
  const prevAccommodation = index > 0 ? days[index - 1]?.accommodation : undefined;

  let dayKind: DayKind = 'touring';
  if (!hasRealActivity && (transferTouchesAirport || (isFirstOrLastDay && hasTransfer))) {
    // A pure arrival/departure leg — priced as a transfer, not a full
    // vehicle+guide touring day.
    dayKind = 'airport_transfer';
  } else if (!hasRealActivity && !hasTransfer && day.accommodation && day.accommodation === prevAccommodation) {
    // Staying at the same lodge with nothing booked — a rest/leisure day, no
    // vehicle or guide cost.
    dayKind = 'none';
  }

  // A park day with no touring activity on it is a drive-through, not a full
  // visit — e.g. passing Ngorongoro on the way to the Serengeti.
  const isTransit = isParkDestination(day.destination) && !hasRealActivity;

  // No reliable signal ties a specific meal-cost catalog row (e.g. "boxed
  // lunch") to a day, so this stays dormant under auto-inference. Board-basis
  // meals (breakfast/lunch/dinner at the lodge) are priced separately from
  // the night's accommodation rate and are unaffected by this.
  const mealCostId = null;

  return { dayKind, isTransit, mealCostId };
}
