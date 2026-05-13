import { z } from 'zod';
import {
  seasons,
  accommodationRates,
  parkFeeRates,
  vehicles,
  transferRates,
  pricingSettings,
  accommodations,
  nationalParks,
} from '@repo/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';

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
const TRANSFER_MODES = ['per_vehicle', 'per_pax'] as const;

// ----- helpers -----
const monthDay = z.object({
  startMonth: z.number().int().min(1).max(12),
  startDay: z.number().int().min(1).max(31),
  endMonth: z.number().int().min(1).max(12),
  endDay: z.number().int().min(1).max(31),
});

// ----- seasons -----
const seasonsRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(seasons)
      .where(eq(seasons.organizationId, ctx.orgId))
      .orderBy(asc(seasons.priority), asc(seasons.startMonth), asc(seasons.startDay)),
  ),

  create: protectedProcedure
    .input(
      z
        .object({
          name: z.string().min(1).max(120),
          priority: z.number().int().default(0),
        })
        .merge(monthDay),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(seasons)
        .values({ ...input, organizationId: ctx.orgId })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          id: z.string().uuid(),
          name: z.string().min(1).max(120).optional(),
          priority: z.number().int().optional(),
        })
        .merge(monthDay.partial()),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      const [row] = await ctx.db
        .update(seasons)
        .set({ ...patch, updatedAt: new Date() })
        .where(and(eq(seasons.id, id), eq(seasons.organizationId, ctx.orgId)))
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(seasons)
        .where(and(eq(seasons.id, input.id), eq(seasons.organizationId, ctx.orgId)));
      return { ok: true };
    }),

  // Seeds the standard East Africa season calendar if the org has no seasons yet.
  seedDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const existing = await ctx.db
      .select({ id: seasons.id })
      .from(seasons)
      .where(eq(seasons.organizationId, ctx.orgId))
      .limit(1);
    if (existing.length > 0) return { seeded: false };

    await ctx.db.insert(seasons).values([
      // High: peak migration + holiday window
      {
        organizationId: ctx.orgId,
        name: 'High',
        startMonth: 6,
        startDay: 15,
        endMonth: 10,
        endDay: 31,
        priority: 10,
      },
      {
        organizationId: ctx.orgId,
        name: 'High',
        startMonth: 12,
        startDay: 20,
        endMonth: 1,
        endDay: 5,
        priority: 10,
      },
      // Low: long rains
      {
        organizationId: ctx.orgId,
        name: 'Low',
        startMonth: 4,
        startDay: 1,
        endMonth: 5,
        endDay: 31,
        priority: 5,
      },
      // Shoulder: everything else
      {
        organizationId: ctx.orgId,
        name: 'Shoulder',
        startMonth: 1,
        startDay: 6,
        endMonth: 3,
        endDay: 31,
        priority: 1,
      },
      {
        organizationId: ctx.orgId,
        name: 'Shoulder',
        startMonth: 6,
        startDay: 1,
        endMonth: 6,
        endDay: 14,
        priority: 1,
      },
      {
        organizationId: ctx.orgId,
        name: 'Shoulder',
        startMonth: 11,
        startDay: 1,
        endMonth: 12,
        endDay: 19,
        priority: 1,
      },
    ]);
    return { seeded: true };
  }),
});

// ----- accommodation rates -----
const accommodationRatesRouter = router({
  listByAccommodation: protectedProcedure
    .input(z.object({ accommodationId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(accommodationRates)
        .where(
          and(
            eq(accommodationRates.organizationId, ctx.orgId),
            eq(accommodationRates.accommodationId, input.accommodationId),
          ),
        ),
    ),

  // List with accommodation name joined, for the top-level rate-card admin page.
  listAll: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: accommodationRates.id,
        accommodationId: accommodationRates.accommodationId,
        accommodationName: accommodations.name,
        seasonId: accommodationRates.seasonId,
        roomType: accommodationRates.roomType,
        mealPlan: accommodationRates.mealPlan,
        perPaxRate: accommodationRates.perPaxRate,
        currency: accommodationRates.currency,
      })
      .from(accommodationRates)
      .leftJoin(accommodations, eq(accommodations.id, accommodationRates.accommodationId))
      .where(eq(accommodationRates.organizationId, ctx.orgId)),
  ),

  create: protectedProcedure
    .input(
      z.object({
        accommodationId: z.string().uuid(),
        seasonId: z.string().uuid(),
        roomType: z.enum(ROOM_TYPES),
        mealPlan: z.enum(MEAL_PLANS),
        perPaxRate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(accommodationRates)
        .values({
          ...input,
          perPaxRate: String(input.perPaxRate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        seasonId: z.string().uuid().optional(),
        roomType: z.enum(ROOM_TYPES).optional(),
        mealPlan: z.enum(MEAL_PLANS).optional(),
        perPaxRate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, perPaxRate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (perPaxRate !== undefined) patch.perPaxRate = String(perPaxRate);
      const [row] = await ctx.db
        .update(accommodationRates)
        .set(patch)
        .where(
          and(eq(accommodationRates.id, id), eq(accommodationRates.organizationId, ctx.orgId)),
        )
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(accommodationRates)
        .where(
          and(
            eq(accommodationRates.id, input.id),
            eq(accommodationRates.organizationId, ctx.orgId),
          ),
        );
      return { ok: true };
    }),
});

// ----- park fee rates -----
const parkFeeRatesRouter = router({
  listByPark: protectedProcedure
    .input(z.object({ parkId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(parkFeeRates)
        .where(
          and(
            eq(parkFeeRates.organizationId, ctx.orgId),
            eq(parkFeeRates.parkId, input.parkId),
          ),
        ),
    ),

  listAll: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: parkFeeRates.id,
        parkId: parkFeeRates.parkId,
        parkName: nationalParks.name,
        seasonId: parkFeeRates.seasonId,
        category: parkFeeRates.category,
        perPersonRate: parkFeeRates.perPersonRate,
        currency: parkFeeRates.currency,
      })
      .from(parkFeeRates)
      .leftJoin(nationalParks, eq(nationalParks.id, parkFeeRates.parkId))
      .where(eq(parkFeeRates.organizationId, ctx.orgId)),
  ),

  create: protectedProcedure
    .input(
      z.object({
        parkId: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        category: z.enum(PARK_FEE_CATEGORIES),
        perPersonRate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(parkFeeRates)
        .values({
          ...input,
          seasonId: input.seasonId ?? null,
          perPersonRate: String(input.perPersonRate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        category: z.enum(PARK_FEE_CATEGORIES).optional(),
        perPersonRate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, perPersonRate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (perPersonRate !== undefined) patch.perPersonRate = String(perPersonRate);
      const [row] = await ctx.db
        .update(parkFeeRates)
        .set(patch)
        .where(and(eq(parkFeeRates.id, id), eq(parkFeeRates.organizationId, ctx.orgId)))
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(parkFeeRates)
        .where(
          and(eq(parkFeeRates.id, input.id), eq(parkFeeRates.organizationId, ctx.orgId)),
        );
      return { ok: true };
    }),
});

// ----- vehicles -----
const vehiclesRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(vehicles)
      .where(eq(vehicles.organizationId, ctx.orgId))
      .orderBy(asc(vehicles.name)),
  ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(2000).optional(),
        capacity: z.number().int().positive(),
        perDayRate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(vehicles)
        .values({
          ...input,
          perDayRate: String(input.perDayRate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(2000).optional(),
        capacity: z.number().int().positive().optional(),
        perDayRate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, perDayRate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (perDayRate !== undefined) patch.perDayRate = String(perDayRate);
      const [row] = await ctx.db
        .update(vehicles)
        .set(patch)
        .where(and(eq(vehicles.id, id), eq(vehicles.organizationId, ctx.orgId)))
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(vehicles)
        .where(and(eq(vehicles.id, input.id), eq(vehicles.organizationId, ctx.orgId)));
      return { ok: true };
    }),
});

// ----- transfer rates -----
const transferRatesRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(transferRates)
      .where(eq(transferRates.organizationId, ctx.orgId))
      .orderBy(asc(transferRates.name)),
  ),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        mode: z.enum(TRANSFER_MODES),
        rate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(transferRates)
        .values({
          ...input,
          rate: String(input.rate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        mode: z.enum(TRANSFER_MODES).optional(),
        rate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (rate !== undefined) patch.rate = String(rate);
      const [row] = await ctx.db
        .update(transferRates)
        .set(patch)
        .where(and(eq(transferRates.id, id), eq(transferRates.organizationId, ctx.orgId)))
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(transferRates)
        .where(
          and(eq(transferRates.id, input.id), eq(transferRates.organizationId, ctx.orgId)),
        );
      return { ok: true };
    }),
});

// ----- pricing settings (singleton per org) -----
const settingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const [row] = await ctx.db
      .select()
      .from(pricingSettings)
      .where(eq(pricingSettings.organizationId, ctx.orgId))
      .limit(1);
    return row ?? null;
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        defaultMarkupPct: z.number().nonnegative().max(1000),
        defaultCurrency: z.string().length(3),
        defaultTravelerCategory: z.enum(PARK_FEE_CATEGORIES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(pricingSettings)
        .values({
          organizationId: ctx.orgId,
          defaultMarkupPct: String(input.defaultMarkupPct),
          defaultCurrency: input.defaultCurrency,
          defaultTravelerCategory: input.defaultTravelerCategory,
        })
        .onConflictDoUpdate({
          target: pricingSettings.organizationId,
          set: {
            defaultMarkupPct: String(input.defaultMarkupPct),
            defaultCurrency: input.defaultCurrency,
            defaultTravelerCategory: input.defaultTravelerCategory,
            updatedAt: new Date(),
          },
        })
        .returning();
      return row;
    }),
});

export const rateCardsRouter = router({
  seasons: seasonsRouter,
  accommodationRates: accommodationRatesRouter,
  parkFeeRates: parkFeeRatesRouter,
  vehicles: vehiclesRouter,
  transferRates: transferRatesRouter,
  settings: settingsRouter,
});
