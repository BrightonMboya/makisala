import { z } from 'zod';
import { protectedProcedure, router } from '../init';
import type { ParkFeeCategory } from '@/lib/pricing-engine';
import { computeOrgPricing, type OrgPricingDayInput } from '../lib/org-pricing';

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

const DAY_KINDS = ['touring', 'airport_transfer', 'none'] as const;

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
  dayKind: z.enum(DAY_KINDS).optional(),
  isTransit: z.boolean().optional(),
  mealCostId: z.string().uuid().nullish(),
  flightId: z.string().uuid().nullish(),
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
  guideId: z.string().uuid().nullish(),
  pickupTransferId: z.string().uuid().nullable(),
  dropoffTransferId: z.string().uuid().nullable(),
  markupPct: z.number().nonnegative().max(1000),
  markupTiers: z
    .array(z.object({ minPax: z.number().int().positive(), markupPct: z.number().nonnegative() }))
    .nullish(),
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
    return computeOrgPricing(ctx.db, ctx.orgId, {
      days: input.days.map(
        (d): OrgPricingDayInput => ({
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
          parkId: d.parkId,
          destinationName: d.destinationName ?? null,
          activities: d.activities.map((a) => ({
            libraryId: a.libraryId ?? null,
            name: a.name ?? null,
            isOptional: a.isOptional ?? false,
          })),
          dayKind: d.dayKind,
          isTransit: d.isTransit,
          mealCostId: d.mealCostId ?? null,
          flightId: d.flightId ?? null,
        }),
      ),
      pax: input.pax,
      travelerCategory: input.travelerCategory as ParkFeeCategory,
      travelerBreakdown: input.travelerBreakdown as
        | { category: ParkFeeCategory; count: number }[]
        | undefined,
      vehicleId: input.vehicleId,
      vehicleCount: input.vehicleCount,
      guideId: input.guideId ?? null,
      pickupTransferId: input.pickupTransferId,
      dropoffTransferId: input.dropoffTransferId,
      markupPct: input.markupPct,
      markupTiers: input.markupTiers ?? null,
      currency: input.currency,
      overrides: input.overrides ?? null,
      internalCostLines: input.internalCostLines ?? null,
    });
  }),
});
