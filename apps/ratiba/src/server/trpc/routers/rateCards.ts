import { z } from 'zod';
import {
  seasons,
  accommodationRates,
  parkFeeRates,
  parkAncillaryFees,
  vehicles,
  transferRates,
  pricingSettings,
  accommodations,
  nationalParks,
  activityLibrary,
  activityRates,
} from '@repo/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../init';

const MEAL_PLANS = ['ro', 'bb', 'hb', 'fb'] as const;
const RATE_BASES = ['per_person', 'per_room'] as const;
const PARK_FEE_CATEGORIES = [
  'non_resident_adult',
  'non_resident_child',
  'east_african_resident_adult',
  'east_african_resident_child',
  'citizen_adult',
  'citizen_child',
] as const;
const TRANSFER_MODES = ['per_vehicle', 'per_pax'] as const;
const ANCILLARY_CHARGE_BASES = ['per_vehicle_per_day', 'per_vehicle_once_per_visit'] as const;
const ACTIVITY_CHARGE_BASES = ['per_person', 'per_group'] as const;

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

  create: adminProcedure
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

  update: adminProcedure
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

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(seasons)
        .where(and(eq(seasons.id, input.id), eq(seasons.organizationId, ctx.orgId)));
      return { ok: true };
    }),

  // Seeds the standard East Africa season calendar if the org has no seasons yet.
  seedDefaults: adminProcedure.mutation(async ({ ctx }) => {
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

  roomTypesForAccommodation: protectedProcedure
    .input(z.object({ accommodationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          roomType: accommodationRates.roomType,
          rateBasis: accommodationRates.rateBasis,
          maxOccupancy: accommodationRates.maxOccupancy,
        })
        .from(accommodationRates)
        .where(
          and(
            eq(accommodationRates.organizationId, ctx.orgId),
            eq(accommodationRates.accommodationId, input.accommodationId),
          ),
        );
      const map = new Map<string, { roomType: string; rateBasis: string; maxOccupancy: number | null }>();
      for (const r of rows) {
        if (!map.has(r.roomType)) {
          map.set(r.roomType, {
            roomType: r.roomType,
            rateBasis: r.rateBasis,
            maxOccupancy: r.maxOccupancy ?? null,
          });
        }
      }
      return [...map.values()];
    }),

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
        rateBasis: accommodationRates.rateBasis,
        maxOccupancy: accommodationRates.maxOccupancy,
        currency: accommodationRates.currency,
      })
      .from(accommodationRates)
      .leftJoin(accommodations, eq(accommodations.id, accommodationRates.accommodationId))
      .where(eq(accommodationRates.organizationId, ctx.orgId)),
  ),

  create: adminProcedure
    .input(
      z.object({
        accommodationId: z.string().uuid(),
        seasonId: z.string().uuid(),
        roomType: z.string().min(1).max(100),
        mealPlan: z.enum(MEAL_PLANS),
        perPaxRate: z.number().nonnegative(),
        rateBasis: z.enum(RATE_BASES).default('per_person'),
        maxOccupancy: z.number().int().positive().nullable().optional(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(accommodationRates)
        .values({
          ...input,
          perPaxRate: String(input.perPaxRate),
          maxOccupancy: input.maxOccupancy ?? null,
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        seasonId: z.string().uuid().optional(),
        roomType: z.string().min(1).max(100).optional(),
        mealPlan: z.enum(MEAL_PLANS).optional(),
        perPaxRate: z.number().nonnegative().optional(),
        rateBasis: z.enum(RATE_BASES).optional(),
        maxOccupancy: z.number().int().positive().nullable().optional(),
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

  // Basis + capacity are properties of a (hotel, room type), so set them across
  // every rate row for that room type at once.
  setRoomTypeBasis: adminProcedure
    .input(
      z.object({
        accommodationId: z.string().uuid(),
        roomType: z.string().min(1).max(100),
        rateBasis: z.enum(RATE_BASES),
        maxOccupancy: z.number().int().positive().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(accommodationRates)
        .set({
          rateBasis: input.rateBasis,
          maxOccupancy: input.rateBasis === 'per_room' ? input.maxOccupancy : null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accommodationRates.organizationId, ctx.orgId),
            eq(accommodationRates.accommodationId, input.accommodationId),
            eq(accommodationRates.roomType, input.roomType),
          ),
        );
      return { ok: true };
    }),

  delete: adminProcedure
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

  create: adminProcedure
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

  update: adminProcedure
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

  delete: adminProcedure
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

const parkAncillaryFeesRouter = router({
  listByPark: protectedProcedure
    .input(z.object({ parkId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(parkAncillaryFees)
        .where(
          and(
            eq(parkAncillaryFees.organizationId, ctx.orgId),
            eq(parkAncillaryFees.parkId, input.parkId),
          ),
        )
        .orderBy(asc(parkAncillaryFees.name)),
    ),

  listAll: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: parkAncillaryFees.id,
        parkId: parkAncillaryFees.parkId,
        parkName: nationalParks.name,
        seasonId: parkAncillaryFees.seasonId,
        name: parkAncillaryFees.name,
        chargeBasis: parkAncillaryFees.chargeBasis,
        rate: parkAncillaryFees.rate,
        currency: parkAncillaryFees.currency,
      })
      .from(parkAncillaryFees)
      .leftJoin(nationalParks, eq(nationalParks.id, parkAncillaryFees.parkId))
      .where(eq(parkAncillaryFees.organizationId, ctx.orgId)),
  ),

  create: adminProcedure
    .input(
      z.object({
        parkId: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(120),
        chargeBasis: z.enum(ANCILLARY_CHARGE_BASES),
        rate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(parkAncillaryFees)
        .values({
          ...input,
          seasonId: input.seasonId ?? null,
          rate: String(input.rate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        name: z.string().min(1).max(120).optional(),
        chargeBasis: z.enum(ANCILLARY_CHARGE_BASES).optional(),
        rate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (rate !== undefined) patch.rate = String(rate);
      const [row] = await ctx.db
        .update(parkAncillaryFees)
        .set(patch)
        .where(
          and(eq(parkAncillaryFees.id, id), eq(parkAncillaryFees.organizationId, ctx.orgId)),
        )
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(parkAncillaryFees)
        .where(
          and(
            eq(parkAncillaryFees.id, input.id),
            eq(parkAncillaryFees.organizationId, ctx.orgId),
          ),
        );
      return { ok: true };
    }),
});

const activityRatesRouter = router({
  listAll: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: activityRates.id,
        activityId: activityRates.activityId,
        activityName: activityLibrary.name,
        activityLocationName: activityLibrary.locationName,
        activityLatitude: activityLibrary.latitude,
        activityLongitude: activityLibrary.longitude,
        seasonId: activityRates.seasonId,
        chargeBasis: activityRates.chargeBasis,
        rate: activityRates.rate,
        currency: activityRates.currency,
      })
      .from(activityRates)
      .leftJoin(activityLibrary, eq(activityLibrary.id, activityRates.activityId))
      .where(eq(activityRates.organizationId, ctx.orgId)),
  ),

  listByActivity: protectedProcedure
    .input(z.object({ activityId: z.string().uuid() }))
    .query(({ ctx, input }) =>
      ctx.db
        .select()
        .from(activityRates)
        .where(
          and(
            eq(activityRates.organizationId, ctx.orgId),
            eq(activityRates.activityId, input.activityId),
          ),
        ),
    ),

  create: adminProcedure
    .input(
      z.object({
        activityId: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        chargeBasis: z.enum(ACTIVITY_CHARGE_BASES).default('per_person'),
        rate: z.number().nonnegative(),
        currency: z.string().length(3).default('USD'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .insert(activityRates)
        .values({
          ...input,
          seasonId: input.seasonId ?? null,
          rate: String(input.rate),
          organizationId: ctx.orgId,
        })
        .returning();
      return row;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        seasonId: z.string().uuid().nullable().optional(),
        chargeBasis: z.enum(ACTIVITY_CHARGE_BASES).optional(),
        rate: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, rate, ...rest } = input;
      const patch: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (rate !== undefined) patch.rate = String(rate);
      const [row] = await ctx.db
        .update(activityRates)
        .set(patch)
        .where(and(eq(activityRates.id, id), eq(activityRates.organizationId, ctx.orgId)))
        .returning();
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' });
      return row;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(activityRates)
        .where(
          and(eq(activityRates.id, input.id), eq(activityRates.organizationId, ctx.orgId)),
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

  create: adminProcedure
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

  update: adminProcedure
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

  delete: adminProcedure
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

  create: adminProcedure
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

  update: adminProcedure
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

  delete: adminProcedure
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

  upsert: adminProcedure
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
  parkAncillaryFees: parkAncillaryFeesRouter,
  activityRates: activityRatesRouter,
  vehicles: vehiclesRouter,
  transferRates: transferRatesRouter,
  settings: settingsRouter,
});
