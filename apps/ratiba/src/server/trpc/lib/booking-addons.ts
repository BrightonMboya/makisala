import { and, eq, inArray, isNull, notInArray, or } from 'drizzle-orm';
import { accommodationImages, proposalDays, proposals } from '@repo/db/schema';
import { getHiddenImageIds } from './hidden-images';
import { getPublicUrl } from '@/lib/storage';
import type { db as database } from '@repo/db';
import type {
  ActivityOffer,
  AlternativeBasis,
  AlternativeOffer,
  BookingAddOns,
  ExtraOffer,
} from '@/lib/booking-addons';

function mealsLabel(meals?: { breakfast: boolean; lunch: boolean; dinner: boolean } | null): string | null {
  if (!meals) return null;
  const parts = [
    meals.breakfast && 'Breakfast',
    meals.lunch && 'Lunch',
    meals.dinner && 'Dinner',
  ].filter(Boolean) as string[];
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Anything unrecognised bills once. Migration 0061 backfilled every stored row
 * from its old free-text label, so an unset basis here means a row written
 * before that ran, not an operator choosing flat.
 */
function normalizeBasis(basis: unknown): AlternativeBasis {
  return basis === 'per_person' || basis === 'per_room' || basis === 'custom' ? basis : 'flat';
}

function roomsLabel(rooms?: Array<{ roomType: string | null; pax: number }> | null): string | null {
  if (!rooms || rooms.length === 0) return null;
  const parts = rooms
    .filter((r) => r.roomType)
    .map((r) => `${r.pax}x ${r.roomType}`);
  return parts.length > 0 ? parts.join(', ') : null;
}

/**
 * Loaded for both the page render and the confirm mutation, so the prices the
 * client sees and the ones the server bills against come from the same read.
 * Alternatives marked `hideInQuote` are private operator notes, never offered.
 */
export async function loadBookingAddOns(
  db: typeof database,
  proposalId: string,
  organizationId: string | null,
): Promise<BookingAddOns> {
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, proposalId),
    columns: { extras: true },
  });

  const days = await db.query.proposalDays.findMany({
    where: eq(proposalDays.proposalId, proposalId),
    columns: { id: true, dayNumber: true, alternatives: true },
    with: {
      activities: {
        columns: {
          id: true,
          name: true,
          description: true,
          isOptional: true,
          price: true,
          priceUnit: true,
        },
      },
      accommodations: {
        columns: { id: true },
        with: { accommodation: { columns: { name: true } } },
      },
    },
    orderBy: (d, { asc }) => [asc(d.dayNumber)],
  });

  const activities: ActivityOffer[] = [];
  const alternatives: AlternativeOffer[] = [];

  for (const day of days) {
    for (const a of day.activities ?? []) {
      if (!a.isOptional) continue;
      activities.push({
        id: a.id,
        name: a.name,
        description: a.description ?? null,
        dayNumber: day.dayNumber,
        // numeric() comes back as a string; null stays null (unpriced).
        price: a.price == null ? null : Number(a.price),
        priceUnit: a.priceUnit === 'per_group' ? 'per_group' : 'per_person',
      });
    }

    const primaryName = day.accommodations?.[0]?.accommodation?.name ?? null;
    for (const alt of day.alternatives ?? []) {
      if (alt.hideInQuote) continue;
      if (!alt.accommodation) continue;
      alternatives.push({
        id: alt.id,
        dayId: day.id,
        dayNumber: day.dayNumber,
        name: alt.accommodationName ?? 'Alternative lodge',
        primaryName,
        rooms: roomsLabel(alt.rooms),
        meals: mealsLabel(alt.meals),
        images: [],
        additionalPrice: alt.additionalPrice ?? 0,
        priceBasis: normalizeBasis(alt.priceBasis),
        customUnitLabel: alt.priceBasis === 'custom' ? (alt.priceUnitLabel ?? null) : null,
        roomCount: alt.rooms?.length ?? 1,
      });
    }
  }

  // Alternatives are denormalized JSON with no image join, so resolve lodge
  // photos separately, under the proposal's own visibility rules.
  const altAccIds = Array.from(
    new Set(
      days.flatMap((d) =>
        (d.alternatives ?? []).map((a) => a.accommodation).filter((id): id is string => !!id),
      ),
    ),
  );
  if (altAccIds.length > 0) {
    const hidden = new Set(organizationId ? await getHiddenImageIds(db, organizationId) : []);
    const imgs = await db
      .select({
        accommodationId: accommodationImages.accommodationId,
        bucket: accommodationImages.bucket,
        key: accommodationImages.key,
      })
      .from(accommodationImages)
      .where(
        and(
          inArray(accommodationImages.accommodationId, altAccIds),
          organizationId
            ? or(
                isNull(accommodationImages.organizationId),
                eq(accommodationImages.organizationId, organizationId),
              )
            : isNull(accommodationImages.organizationId),
          hidden.size ? notInArray(accommodationImages.id, [...hidden]) : undefined,
        ),
      );
    const byAcc = new Map<string, string[]>();
    for (const img of imgs) {
      const arr = byAcc.get(img.accommodationId) ?? [];
      arr.push(getPublicUrl(img.bucket, img.key));
      byAcc.set(img.accommodationId, arr);
    }
    // Re-walk the days so each offer picks up its own lodge's photos.
    const accByAltId = new Map<string, string>();
    for (const day of days) {
      for (const alt of day.alternatives ?? []) {
        if (alt.accommodation) accByAltId.set(alt.id, alt.accommodation);
      }
    }
    for (const offer of alternatives) {
      const accId = accByAltId.get(offer.id);
      // The page shows one thumbnail per lodge; don't ship the rest.
      offer.images = accId ? (byAcc.get(accId) ?? []).slice(0, 1) : [];
    }
  }

  const extras: ExtraOffer[] = (proposal?.extras ?? [])
    .filter((e) => e.name?.trim())
    .map((e) => ({
      id: e.id,
      name: e.name,
      price: Number(e.price) || 0,
      // Legacy extras saved before priceUnit existed are applied once.
      unit: e.priceUnit ?? 'per_group',
      customUnitLabel: e.customUnitLabel ?? null,
    }));

  return { activities, alternatives, extras };
}
