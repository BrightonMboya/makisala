// Shared by the pricing.compute tRPC procedure (live builder preview) and
// proposals.save (server-side reconciliation of auto-priced proposals) so
// both read rate cards and resolve parks/seasons identically.
import type { InternalCostLine } from '@repo/db/schema';
import {
  accommodationRates,
  activityLibrary,
  activityRates,
  flightRates,
  guides,
  mealCostRates,
  nationalParks,
  parkAncillaryFees,
  parkFeeRates,
  pricingSettings,
  seasons,
  transferRates,
  vehicles,
} from '@repo/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { Context } from '../init';
import {
  computePricing,
  type ItineraryDayInput,
  type MealPlan,
  type ParkFeeCategory,
  type PricingBreakdown,
} from '@/lib/pricing-engine';

type DB = Context['db'];

export interface OrgPricingDayInput {
  dayNumber: number;
  date: Date;
  accommodationId: string | null;
  accommodationName?: string | null;
  mealPlan: MealPlan | null;
  rooms: Array<{ roomType: string | null; pax: number; children?: number }>;
  parkId: string | null;
  destinationName?: string | null;
  activities: Array<{ libraryId?: string | null; name?: string | null; isOptional?: boolean }>;
  dayKind?: 'touring' | 'airport_transfer' | 'none';
  isTransit?: boolean;
  mealCostId?: string | null;
  flightId?: string | null;
}

export interface OrgPricingParams {
  days: OrgPricingDayInput[];
  pax: number;
  travelerCategory: ParkFeeCategory;
  travelerBreakdown?: Array<{ category: ParkFeeCategory; count: number }>;
  vehicleId: string | null;
  vehicleCount: number;
  guideId?: string | null;
  pickupTransferId: string | null;
  dropoffTransferId: string | null;
  markupPct: number;
  // Group-size-tiered markup schedule; when omitted, the org's saved
  // pricing-settings tiers (if any) are used instead.
  markupTiers?: Array<{ minPax: number; markupPct: number }> | null;
  currency: string;
  overrides?: Record<string, number> | null;
  internalCostLines?: InternalCostLine[] | null;
}

export async function computeOrgPricing(
  db: DB,
  orgId: string,
  input: OrgPricingParams,
): Promise<PricingBreakdown> {
  const dayParkIds = Array.from(
    new Set(input.days.map((d) => d.parkId).filter((id): id is string => !!id)),
  );
  const parentParks = alias(nationalParks, 'parent_national_parks');

  const [
    seasonRows,
    accomRows,
    parkRows,
    parkAncillaryRows,
    activityRows,
    vehicleRows,
    transferRows,
    guideRows,
    mealCostRows,
    flightRateRows,
    settingsRow,
    parkAliasRows,
  ] = await Promise.all([
    db.select().from(seasons).where(eq(seasons.organizationId, orgId)),
    db.select().from(accommodationRates).where(eq(accommodationRates.organizationId, orgId)),
    db
      .select({
        parkId: parkFeeRates.parkId,
        parkName: nationalParks.name,
        seasonId: parkFeeRates.seasonId,
        category: parkFeeRates.category,
        perPersonRate: parkFeeRates.perPersonRate,
        feeType: parkFeeRates.feeType,
      })
      .from(parkFeeRates)
      .leftJoin(nationalParks, eq(nationalParks.id, parkFeeRates.parkId))
      .where(eq(parkFeeRates.organizationId, orgId)),
    db
      .select({
        parkId: parkAncillaryFees.parkId,
        parkName: nationalParks.name,
        seasonId: parkAncillaryFees.seasonId,
        name: parkAncillaryFees.name,
        chargeBasis: parkAncillaryFees.chargeBasis,
        rate: parkAncillaryFees.rate,
        category: parkAncillaryFees.category,
      })
      .from(parkAncillaryFees)
      .leftJoin(nationalParks, eq(nationalParks.id, parkAncillaryFees.parkId))
      .where(eq(parkAncillaryFees.organizationId, orgId)),
    db
      .select({
        activityId: activityRates.activityId,
        activityName: activityLibrary.name,
        seasonId: activityRates.seasonId,
        chargeBasis: activityRates.chargeBasis,
        rate: activityRates.rate,
      })
      .from(activityRates)
      .leftJoin(activityLibrary, eq(activityLibrary.id, activityRates.activityId))
      .where(eq(activityRates.organizationId, orgId)),
    db.select().from(vehicles).where(eq(vehicles.organizationId, orgId)),
    db.select().from(transferRates).where(eq(transferRates.organizationId, orgId)),
    db.select().from(guides).where(eq(guides.organizationId, orgId)),
    db.select().from(mealCostRates).where(eq(mealCostRates.organizationId, orgId)),
    db.select().from(flightRates).where(eq(flightRates.organizationId, orgId)),
    db.select().from(pricingSettings).where(eq(pricingSettings.organizationId, orgId)).limit(1),
    dayParkIds.length > 0
      ? db
          .select({
            id: nationalParks.id,
            name: nationalParks.name,
            parentId: parentParks.id,
            parentName: parentParks.name,
          })
          .from(nationalParks)
          .leftJoin(parentParks, eq(nationalParks.parentParkId, parentParks.id))
          .where(inArray(nationalParks.id, dayParkIds))
      : Promise.resolve([]),
  ]);

  const parkAliasMap = new Map<string, { id: string; name: string }>();
  for (const r of parkAliasRows) {
    parkAliasMap.set(
      r.id,
      r.parentId ? { id: r.parentId, name: r.parentName! } : { id: r.id, name: r.name },
    );
  }

  return computePricing({
    days: input.days.map((d): ItineraryDayInput => {
      const canonicalPark = d.parkId ? parkAliasMap.get(d.parkId) : null;
      return {
        dayNumber: d.dayNumber,
        date: d.date,
        accommodationId: d.accommodationId,
        accommodationName: d.accommodationName ?? null,
        mealPlan: d.mealPlan,
        rooms: d.rooms.map((r) => ({
          roomType: r.roomType,
          pax: r.pax,
          children: r.children ?? 0,
        })),
        parkId: canonicalPark?.id ?? d.parkId,
        destinationName: canonicalPark?.name ?? d.destinationName ?? null,
        activities: d.activities.map((a) => ({
          libraryId: a.libraryId ?? null,
          name: a.name ?? null,
          isOptional: a.isOptional ?? false,
        })),
        dayKind: d.dayKind,
        isTransit: d.isTransit,
        mealCostId: d.mealCostId ?? null,
        flightId: d.flightId ?? null,
      };
    }),
    pax: input.pax,
    travelerCategory: input.travelerCategory,
    travelerBreakdown: input.travelerBreakdown,
    vehicleId: input.vehicleId,
    vehicleCount: input.vehicleCount,
    guideId: input.guideId ?? null,
    pickupTransferId: input.pickupTransferId,
    dropoffTransferId: input.dropoffTransferId,
    markupPct: input.markupPct,
    markupTiers: input.markupTiers ?? settingsRow[0]?.markupTiers ?? null,
    currency: input.currency || settingsRow[0]?.defaultCurrency || 'USD',
    overrides: input.overrides ?? null,
    internalCostLines: input.internalCostLines ?? null,
    seasons: seasonRows.map((s) => ({
      id: s.id,
      name: s.name,
      startMonth: s.startMonth,
      startDay: s.startDay,
      endMonth: s.endMonth,
      endDay: s.endDay,
      priority: s.priority,
    })),
    accommodationRates: accomRows.map((r) => ({
      accommodationId: r.accommodationId,
      seasonId: r.seasonId,
      roomType: r.roomType,
      mealPlan: r.mealPlan as MealPlan,
      perPaxRate: Number(r.perPaxRate),
      rateBasis: r.rateBasis,
      maxOccupancy: r.maxOccupancy,
      additionalAdultPct: r.additionalAdultPct == null ? null : Number(r.additionalAdultPct),
      additionalChildPct: r.additionalChildPct == null ? null : Number(r.additionalChildPct),
    })),
    parkFeeRates: parkRows.map((r) => ({
      parkId: r.parkId,
      parkName: r.parkName ?? '',
      seasonId: r.seasonId,
      category: r.category,
      perPersonRate: Number(r.perPersonRate),
      feeType: r.feeType,
    })),
    parkAncillaryFees: parkAncillaryRows.map((r) => ({
      parkId: r.parkId,
      parkName: r.parkName ?? '',
      seasonId: r.seasonId,
      name: r.name,
      chargeBasis: r.chargeBasis,
      rate: Number(r.rate),
      category: r.category,
    })),
    vehicles: vehicleRows.map((v) => ({
      id: v.id,
      perDayRate: Number(v.perDayRate),
      seatCapacity: v.capacity,
    })),
    transferRates: transferRows.map((t) => ({
      id: t.id,
      name: t.name,
      mode: t.mode,
      rate: Number(t.rate),
    })),
    activityRates: activityRows.map((r) => ({
      activityId: r.activityId,
      activityName: r.activityName ?? '',
      seasonId: r.seasonId,
      chargeBasis: r.chargeBasis,
      rate: Number(r.rate),
    })),
    guides: guideRows.map((g) => ({
      id: g.id,
      name: g.name,
      touringRate: Number(g.touringRate),
      airportTransferRate: Number(g.airportTransferRate),
    })),
    mealRates: mealCostRows.map((m) => ({
      id: m.id,
      name: m.name,
      perPersonRate: Number(m.perPersonRate),
    })),
    flightRates: flightRateRows.map((f) => ({
      id: f.id,
      name: f.name,
      seasonId: f.seasonId,
      perPersonRate: Number(f.perPersonRate),
    })),
  });
}
