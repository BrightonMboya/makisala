import { z } from 'zod';
import {
  accommodationRates,
  parkFeeRates,
  pricingSettings,
  seasons,
  transferRates,
  vehicles,
} from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../init';
import {
  computePricing,
  type ItineraryDayInput,
  type MealPlan,
  type ParkFeeCategory,
  type RoomType,
} from '@/lib/pricing-engine';

const ROOM_TYPES = ['single', 'double', 'triple', 'quad', 'family'] as const;
const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb', 'ai'] as const;
const PARK_FEE_CATEGORIES = [
  'non_resident_adult',
  'non_resident_child',
  'east_african_resident_adult',
  'east_african_resident_child',
  'citizen_adult',
  'citizen_child',
] as const;

const dayInputSchema = z.object({
  dayNumber: z.number().int(),
  date: z.coerce.date(),
  accommodationId: z.string().uuid().nullable(),
  roomType: z.enum(ROOM_TYPES).nullable(),
  mealPlan: z.enum(MEAL_PLANS).nullable(),
  parkId: z.string().uuid().nullable(),
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
    const [seasonRows, accomRows, parkRows, vehicleRows, transferRows, settingsRow] =
      await Promise.all([
        ctx.db.select().from(seasons).where(eq(seasons.organizationId, orgId)),
        ctx.db
          .select()
          .from(accommodationRates)
          .where(eq(accommodationRates.organizationId, orgId)),
        ctx.db.select().from(parkFeeRates).where(eq(parkFeeRates.organizationId, orgId)),
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
          roomType: d.roomType as RoomType | null,
          mealPlan: d.mealPlan as MealPlan | null,
          parkId: d.parkId,
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
        mealPlan: r.mealPlan,
        perPaxRate: Number(r.perPaxRate),
      })),
      parkFeeRates: parkRows.map((r) => ({
        parkId: r.parkId,
        seasonId: r.seasonId,
        category: r.category,
        perPersonRate: Number(r.perPersonRate),
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
