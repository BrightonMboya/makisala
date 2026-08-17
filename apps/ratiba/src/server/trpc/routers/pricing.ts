import { z } from 'zod';
import {
  accommodationRates,
  activityLibrary,
  activityRates,
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
import { protectedProcedure, router } from '../init';
import {
  computePricing,
  type ItineraryDayInput,
  type MealPlan,
  type ParkFeeCategory,
} from '@/lib/pricing-engine';

const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb'] as const;
const PARK_FEE_CATEGORIES = [
  'non_resident_adult',
  'non_resident_child',
  'east_african_resident_adult',
  'east_african_resident_child',
  'citizen_adult',
  'citizen_child',
] as const;

const roomNightSchema = z.object({
  roomType: z.string().min(1).nullable(),
  pax: z.number().int().nonnegative(),
  children: z.number().int().nonnegative().optional(),
});

const activityInputSchema = z.object({
  libraryId: z.string().uuid().nullable().optional(),
  name: z.string().nullish(),
  isOptional: z.boolean().optional(),
});

const dayInputSchema = z.object({
  dayNumber: z.number().int(),
  date: z.coerce.date(),
  accommodationId: z.string().uuid().nullable(),
  accommodationName: z.string().nullish(),
  mealPlan: z.enum(MEAL_PLANS).nullable(),
  rooms: z.array(roomNightSchema).default([]),
  parkId: z.string().uuid().nullable(),
  destinationName: z.string().nullish(),
  activities: z.array(activityInputSchema).default([]),
});

const computeInputSchema = z.object({
  days: z.array(dayInputSchema).min(1),
  pax: z.number().int().positive(),
  travelerCategory: z.enum(PARK_FEE_CATEGORIES).default('non_resident_adult'),
  travelerBreakdown: z
    .array(
      z.object({
        category: z.enum(PARK_FEE_CATEGORIES),
        count: z.number().int().nonnegative(),
      }),
    )
    .optional(),
  vehicleId: z.string().uuid().nullable(),
  vehicleCount: z.number().int().positive().default(1),
  pickupTransferId: z.string().uuid().nullable(),
  dropoffTransferId: z.string().uuid().nullable(),
  markupPct: z.number().nonnegative().max(1000),
  currency: z.string().length(3).default('USD'),
  overrides: z.record(z.string(), z.number()).nullish(),
  internalCostLines: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().min(1),
        amount: z.number(),
        quantity: z.number().positive().optional(),
      }),
    )
    .nullish(),
});

export const pricingRouter = router({
  compute: protectedProcedure.input(computeInputSchema).query(async ({ ctx, input }) => {
    const orgId = ctx.orgId;

    // Sub-regions (e.g. "Central Serengeti") can point at the actual
    // fee-charging park via parentParkId, so an itinerary day picked from a
    // zone/area destination still resolves to the right park_fee_rates row.
    // Resolved below in the same parallel batch as everything else (a single
    // self-join query) rather than as follow-up round-trips after — those
    // used to run sequentially and were adding a couple hundred ms per
    // compute call.
    const dayParkIds = Array.from(
      new Set(input.days.map((d) => d.parkId).filter((id): id is string => !!id)),
    );
    const parentParks = alias(nationalParks, 'parent_national_parks');

    // Load all rate-card data in parallel. Cheap reads, all org-scoped.
    const [
      seasonRows,
      accomRows,
      parkRows,
      parkAncillaryRows,
      activityRows,
      vehicleRows,
      transferRows,
      settingsRow,
      parkAliasRows,
    ] = await Promise.all([
      ctx.db.select().from(seasons).where(eq(seasons.organizationId, orgId)),
      ctx.db.select().from(accommodationRates).where(eq(accommodationRates.organizationId, orgId)),
      ctx.db
        .select({
          parkId: parkFeeRates.parkId,
          parkName: nationalParks.name,
          seasonId: parkFeeRates.seasonId,
          category: parkFeeRates.category,
          perPersonRate: parkFeeRates.perPersonRate,
        })
        .from(parkFeeRates)
        .leftJoin(nationalParks, eq(nationalParks.id, parkFeeRates.parkId))
        .where(eq(parkFeeRates.organizationId, orgId)),
      ctx.db
        .select({
          parkId: parkAncillaryFees.parkId,
          parkName: nationalParks.name,
          seasonId: parkAncillaryFees.seasonId,
          name: parkAncillaryFees.name,
          chargeBasis: parkAncillaryFees.chargeBasis,
          rate: parkAncillaryFees.rate,
        })
        .from(parkAncillaryFees)
        .leftJoin(nationalParks, eq(nationalParks.id, parkAncillaryFees.parkId))
        .where(eq(parkAncillaryFees.organizationId, orgId)),
      ctx.db
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
      ctx.db.select().from(vehicles).where(eq(vehicles.organizationId, orgId)),
      ctx.db.select().from(transferRates).where(eq(transferRates.organizationId, orgId)),
      ctx.db
        .select()
        .from(pricingSettings)
        .where(eq(pricingSettings.organizationId, orgId))
        .limit(1),
      dayParkIds.length > 0
        ? ctx.db
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

    // Falls back to the day's own park when it has no parent (a real park, or
    // a plain city/landmark that was never meant to carry a park fee).
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
          mealPlan: d.mealPlan as MealPlan | null,
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
        };
      }),
      pax: input.pax,
      travelerCategory: input.travelerCategory as ParkFeeCategory,
      travelerBreakdown: input.travelerBreakdown as
        | { category: ParkFeeCategory; count: number }[]
        | undefined,
      vehicleId: input.vehicleId,
      vehicleCount: input.vehicleCount,
      pickupTransferId: input.pickupTransferId,
      dropoffTransferId: input.dropoffTransferId,
      markupPct: input.markupPct,
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
        // DB enum still carries the unused 'ai' value; narrow at the boundary.
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
      })),
      parkAncillaryFees: parkAncillaryRows.map((r) => ({
        parkId: r.parkId,
        parkName: r.parkName ?? '',
        seasonId: r.seasonId,
        name: r.name,
        chargeBasis: r.chargeBasis,
        rate: Number(r.rate),
      })),
      vehicles: vehicleRows.map((v) => ({
        id: v.id,
        perDayRate: Number(v.perDayRate),
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
    });
  }),
});
