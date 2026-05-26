import { z } from 'zod';
import {
  accommodationRates,
  nationalParks,
  parkAncillaryFees,
  parkFeeRates,
  pricingSettings,
  seasons,
  transferRates,
  vehicles,
} from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { protectedProcedure, router } from '../init';
import {
  computePricing,
  type ItineraryDayInput,
  type MealPlan,
  type ParkFeeCategory,
  type RoomType,
} from '@/lib/pricing-engine';

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'family'] as const;
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
  roomType: z.enum(ROOM_TYPES).nullable(),
  pax: z.number().int().nonnegative(),
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
});

const computeInputSchema = z.object({
  days: z.array(dayInputSchema).min(1),
  pax: z.number().int().positive(),
  travelerCategory: z.enum(PARK_FEE_CATEGORIES).default('non_resident_adult'),
  vehicleId: z.string().uuid().nullable(),
  pickupTransferId: z.string().uuid().nullable(),
  dropoffTransferId: z.string().uuid().nullable(),
  markupPct: z.number().nonnegative().max(1000),
  currency: z.string().length(3).default('USD'),
});

export const pricingRouter = router({
  compute: protectedProcedure.input(computeInputSchema).query(async ({ ctx, input }) => {
    const orgId = ctx.orgId;

    // Load all rate-card data in parallel. Cheap reads, all org-scoped.
    const [
      seasonRows,
      accomRows,
      parkRows,
      parkAncillaryRows,
      vehicleRows,
      transferRows,
      settingsRow,
    ] = await Promise.all([
        ctx.db.select().from(seasons).where(eq(seasons.organizationId, orgId)),
        ctx.db
          .select()
          .from(accommodationRates)
          .where(eq(accommodationRates.organizationId, orgId)),
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
        ctx.db.select().from(vehicles).where(eq(vehicles.organizationId, orgId)),
        ctx.db.select().from(transferRates).where(eq(transferRates.organizationId, orgId)),
        ctx.db
          .select()
          .from(pricingSettings)
          .where(eq(pricingSettings.organizationId, orgId))
          .limit(1),
      ]);

    return computePricing({
      days: input.days.map(
        (d): ItineraryDayInput => ({
          dayNumber: d.dayNumber,
          date: d.date,
          accommodationId: d.accommodationId,
          accommodationName: d.accommodationName ?? null,
          mealPlan: d.mealPlan as MealPlan | null,
          rooms: d.rooms.map((r) => ({
            roomType: r.roomType as RoomType | null,
            pax: r.pax,
          })),
          parkId: d.parkId,
          destinationName: d.destinationName ?? null,
        }),
      ),
      pax: input.pax,
      travelerCategory: input.travelerCategory as ParkFeeCategory,
      vehicleId: input.vehicleId,
      pickupTransferId: input.pickupTransferId,
      dropoffTransferId: input.dropoffTransferId,
      markupPct: input.markupPct,
      currency: input.currency || settingsRow[0]?.defaultCurrency || 'USD',
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
    });
  }),
});
