import { z } from 'zod';
import {
  proposals,
  proposalAssignments,
  proposalDays,
  proposalAccommodations,
  proposalActivities,
  proposalMeals,
  proposalTransportation,
  member,
  clients,
} from '@repo/db/schema';
import { and, desc, eq, inArray, or, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  sendProposalShareEmail,
  sendProposalAcceptanceEmail,
} from '@repo/resend';
import { router, protectedProcedure, adminProcedure, publicProcedure, escapeLikeQuery } from '../init';
import { checkFeatureAccess, getOrgPlan, ALLOWED_THEMES_BY_TIER } from '@/lib/plans';
import { env } from '@/lib/env';

interface BuilderData {
  selectedTheme?: string;
  tourId?: string;
  clientId?: string | null;
  tourTitle?: string;
  tourType?: string | null;
  heroImage?: string | null;
  startDate?: string | null;
  startCity?: string | null;
  startCityLat?: string | null;
  startCityLng?: string | null;
  endCity?: string | null;
  endCityLat?: string | null;
  endCityLng?: string | null;
  pickupPoint?: string | null;
  transferIncluded?: string | null;
  travelerGroups?: Array<{ id: string; count: number; type: string }> | null;
  pricingRows?: Array<{ id: string; count: number; type: string; unitPrice: number }> | null;
  extras?: Array<{ id: string; name: string; price: number; selected: boolean }> | null;
  countries?: string[] | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  hidePricing?: boolean;
  days?: BuilderDay[];
}

interface BuilderActivity {
  name: string;
  description?: string | null;
  location?: string | null;
  moment?: string | null;
  isOptional?: boolean;
  imageUrl?: string | null;
}

interface BuilderTransfer {
  originName: string;
  originId?: string | null;
  destinationName: string;
  destinationId?: string | null;
  mode: 'road_4x4' | 'road_shuttle' | 'road_bus' | 'flight_domestic' | 'flight_bush';
  durationMinutes?: number | null;
  distanceKm?: number | null;
  notes?: string | null;
}

interface BuilderDay {
  dayNumber: number;
  title?: string;
  description?: string | null;
  previewImage?: string | null;
  destination?: string;
  destinationName?: string | null;
  destinationLat?: number | null;
  destinationLng?: number | null;
  accommodation?: string;
  activities?: BuilderActivity[];
  meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
  transfer?: BuilderTransfer;
}

export const proposalsRouter = router({
  listForDashboard: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['mine', 'all']).default('mine'),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        status: z
          .enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'cancelled'])
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(proposals.organizationId, ctx.orgId)];

      if (input.filter === 'mine') {
        const assignedRows = await ctx.db
          .select({ proposalId: proposalAssignments.proposalId })
          .from(proposalAssignments)
          .where(eq(proposalAssignments.userId, ctx.user.id));

        const assignedIds = assignedRows.map((r) => r.proposalId);
        if (assignedIds.length === 0) {
          return { items: [], totalCount: 0, page: input.page, pageSize: input.pageSize, totalPages: 0 };
        }

        conditions.push(inArray(proposals.id, assignedIds));
      }

      if (input.status) {
        conditions.push(eq(proposals.status, input.status));
      }

      if (input.search?.trim()) {
        const pattern = `%${escapeLikeQuery(input.search.trim())}%`;
        conditions.push(
          or(
            sql`${proposals.name} ilike ${pattern} escape '\\'`,
            sql`${proposals.tourTitle} ilike ${pattern} escape '\\'`,
            sql`exists (
              select 1
              from ${clients}
              where ${clients.id} = ${proposals.clientId}
                and ${clients.name} ilike ${pattern} escape '\\'
            )`,
          )!,
        );
      }

      const whereClause = and(...conditions)!;

      const [countResult, items] = await Promise.all([
        ctx.db
          .select({ value: count() })
          .from(proposals)
          .where(whereClause),
        ctx.db.query.proposals.findMany({
          where: whereClause,
          orderBy: desc(proposals.createdAt),
          offset: (input.page - 1) * input.pageSize,
          limit: input.pageSize,
          with: {
            client: true,
            assignments: {
              with: {
                user: {
                  columns: { id: true, name: true, image: true },
                },
              },
            },
          },
          columns: {
            id: true,
            name: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            tourTitle: true,
            startDate: true,
          },
        }),
      ]);

      const totalCount = countResult[0]?.value ?? 0;
      const totalPages = Math.ceil(totalCount / input.pageSize);

      return { items, totalCount, page: input.page, pageSize: input.pageSize, totalPages };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, input.id),
        with: {
          organization: {
            columns: { name: true, logoUrl: true, aboutDescription: true, paymentTerms: true },
          },
          tour: { columns: { country: true, tourName: true } },
          client: { columns: { name: true, email: true } },
          days: {
            columns: { dayNumber: true, title: true, description: true, previewImage: true, destinationName: true, destinationLat: true, destinationLng: true },
            with: {
              nationalPark: {
                columns: { id: true, name: true, country: true, park_overview: true, latitude: true, longitude: true },
              },
              accommodations: {
                columns: { id: true },
                with: {
                  accommodation: {
                    columns: { id: true, name: true, overview: true, description: true },
                    with: { images: { columns: { bucket: true, key: true } } },
                  },
                },
              },
              activities: {
                columns: { name: true, description: true, location: true, moment: true, isOptional: true, imageUrl: true },
              },
              meals: true,
              transportation: {
                columns: { id: true, originName: true, destinationName: true, mode: true, durationMinutes: true, distanceKm: true, notes: true },
              },
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });
      return result ?? null;
    }),

  getForBuilder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.id), eq(proposals.organizationId, ctx.orgId)),
        columns: {
          id: true,
          name: true,
          tourId: true,
          tourTitle: true,
          tourType: true,
          clientId: true,
          startDate: true,
          startCity: true,
          startCityLat: true,
          startCityLng: true,
          endCity: true,
          endCityLat: true,
          endCityLng: true,
          pickupPoint: true,
          transferIncluded: true,
          travelerGroups: true,
          pricingRows: true,
          extras: true,
          countries: true,
          inclusions: true,
          exclusions: true,
          hidePricing: true,
          theme: true,
          heroImage: true,
        },
        with: {
          tour: { columns: { country: true } },
          days: {
            columns: {
              id: true,
              dayNumber: true,
              title: true,
              nationalParkId: true,
              destinationName: true,
              destinationLat: true,
              destinationLng: true,
              description: true,
              previewImage: true,
            },
            with: {
              accommodations: {
                columns: { accommodationId: true },
                with: {
                  accommodation: { columns: { id: true, name: true } },
                },
              },
              meals: { columns: { breakfast: true, lunch: true, dinner: true } },
              activities: { columns: { id: true, name: true, description: true, location: true, moment: true, isOptional: true, imageUrl: true } },
              transportation: {
                columns: {
                  id: true,
                  originId: true,
                  originName: true,
                  destinationId: true,
                  destinationName: true,
                  mode: true,
                  durationMinutes: true,
                  distanceKm: true,
                  notes: true,
                },
              },
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });

      if (result) {
        return {
          ...result,
          country: result.tour?.country || null,
        };
      }
      return result ?? null;
    }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        data: z.record(z.string(), z.unknown()),
        status: z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'cancelled']).optional(),
        tourId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let proposalId = input.id;
      if (!proposalId || proposalId.trim() === '') {
        const { randomUUID } = await import('crypto');
        proposalId = randomUUID();
      }

      const builderData = input.data as unknown as BuilderData;

      const existingProposal = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, proposalId),
        columns: { id: true, organizationId: true },
      });

      if (existingProposal) {
        if (existingProposal.organizationId !== ctx.orgId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Proposal belongs to another organization' });
        }
      } else {
        const access = await checkFeatureAccess(ctx.orgId, 'activeProposals');
        if (!access.allowed) {
          throw new TRPCError({ code: 'FORBIDDEN', message: access.reason });
        }
      }

      const selectedTheme = builderData.selectedTheme || 'minimalistic';
      const plan = await getOrgPlan(ctx.orgId);
      const allowedThemes = plan ? ALLOWED_THEMES_BY_TIER[plan.effectiveTier] : ['minimalistic'];
      const validatedTheme = allowedThemes.includes(selectedTheme) ? selectedTheme : 'minimalistic';

      const proposalData = {
        id: proposalId,
        name: input.name,
        tourId: input.tourId || builderData.tourId!,
        organizationId: ctx.orgId,
        clientId: builderData.clientId || null,
        tourTitle: builderData.tourTitle || input.name,
        tourType: builderData.tourType || null,
        theme: validatedTheme,
        heroImage: builderData.heroImage || null,
        startDate: builderData.startDate ? new Date(builderData.startDate).toISOString() : null,
        startCity: builderData.startCity || null,
        startCityLat: builderData.startCityLat || null,
        startCityLng: builderData.startCityLng || null,
        endCity: builderData.endCity || null,
        endCityLat: builderData.endCityLat || null,
        endCityLng: builderData.endCityLng || null,
        pickupPoint: builderData.pickupPoint || null,
        transferIncluded: builderData.transferIncluded || null,
        pricingRows: builderData.pricingRows || null,
        extras: builderData.extras || null,
        travelerGroups: builderData.travelerGroups || null,
        countries: builderData.countries || null,
        inclusions: builderData.inclusions || null,
        exclusions: builderData.exclusions || null,
        hidePricing: builderData.hidePricing || false,
        status: input.status || 'draft',
        updatedAt: new Date().toISOString(),
      };

      await ctx.db.transaction(async (tx) => {
        await tx
          .insert(proposals)
          .values({
            id: proposalId,
            name: proposalData.name,
            tourId: proposalData.tourId,
            organizationId: proposalData.organizationId,
            clientId: proposalData.clientId || null,
            tourTitle: proposalData.tourTitle || null,
            tourType: proposalData.tourType || null,
            theme: proposalData.theme || 'minimalistic',
            heroImage: proposalData.heroImage || null,
            startDate: proposalData.startDate || null,
            startCity: proposalData.startCity || null,
            startCityLat: proposalData.startCityLat || null,
            startCityLng: proposalData.startCityLng || null,
            endCity: proposalData.endCity || null,
            endCityLat: proposalData.endCityLat || null,
            endCityLng: proposalData.endCityLng || null,
            pickupPoint: proposalData.pickupPoint || null,
            transferIncluded: proposalData.transferIncluded || null,
            travelerGroups: proposalData.travelerGroups || null,
            pricingRows: proposalData.pricingRows || null,
            extras: proposalData.extras || null,
            countries: proposalData.countries || null,
            inclusions: proposalData.inclusions || null,
            exclusions: proposalData.exclusions || null,
            hidePricing: proposalData.hidePricing || false,
            status: proposalData.status || 'draft',
            updatedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: proposals.id,
            set: {
              name: proposalData.name,
              tourId: proposalData.tourId,
              organizationId: proposalData.organizationId,
              clientId: proposalData.clientId || null,
              tourTitle: proposalData.tourTitle || null,
              tourType: proposalData.tourType || null,
              theme: proposalData.theme || 'minimalistic',
              heroImage: proposalData.heroImage || null,
              startDate: proposalData.startDate || null,
              startCity: proposalData.startCity || null,
              endCity: proposalData.endCity || null,
              pickupPoint: proposalData.pickupPoint || null,
              transferIncluded: proposalData.transferIncluded || null,
              travelerGroups: proposalData.travelerGroups || null,
              pricingRows: proposalData.pricingRows || null,
              extras: proposalData.extras || null,
              countries: proposalData.countries || null,
              inclusions: proposalData.inclusions || null,
              exclusions: proposalData.exclusions || null,
              status: proposalData.status || 'draft',
              updatedAt: new Date().toISOString(),
            },
          });

        await tx.delete(proposalDays).where(eq(proposalDays.proposalId, proposalId));

        const days = builderData.days || [];

        for (const day of days) {
          let nationalParkId: string | null = null;

          if (day.destination) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              day.destination,
            );
            if (isUUID) nationalParkId = day.destination;
          }

          const [proposalDay] = await tx
            .insert(proposalDays)
            .values({
              proposalId,
              dayNumber: day.dayNumber,
              title: day.title || `Day ${day.dayNumber}`,
              description: day.description || null,
              previewImage: day.previewImage || null,
              nationalParkId,
              destinationName: day.destinationName || null,
              destinationLat: day.destinationLat != null ? String(day.destinationLat) : null,
              destinationLng: day.destinationLng != null ? String(day.destinationLng) : null,
            })
            .returning();

          if (!proposalDay) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create proposal day ${day.dayNumber}` });

          if (day.accommodation) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              day.accommodation,
            );
            if (isUUID) {
              await tx.insert(proposalAccommodations).values({
                proposalDayId: proposalDay.id,
                accommodationId: day.accommodation,
              });
            }
          }

          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              await tx.insert(proposalActivities).values({
                proposalDayId: proposalDay.id,
                name: activity.name,
                description: activity.description || null,
                location: activity.location || null,
                moment: activity.moment || 'Full Day',
                isOptional: activity.isOptional || false,
                imageUrl: activity.imageUrl || null,
              });
            }
          }

          if (day.meals) {
            await tx.insert(proposalMeals).values({
              proposalDayId: proposalDay.id,
              breakfast: day.meals.breakfast || false,
              lunch: day.meals.lunch || false,
              dinner: day.meals.dinner || false,
            });
          }

          if (day.transfer) {
            await tx.insert(proposalTransportation).values({
              proposalDayId: proposalDay.id,
              originName: day.transfer.originName,
              originId: day.transfer.originId || null,
              destinationName: day.transfer.destinationName,
              destinationId: day.transfer.destinationId || null,
              mode: day.transfer.mode,
              durationMinutes: day.transfer.durationMinutes || null,
              distanceKm: day.transfer.distanceKm || null,
              notes: day.transfer.notes || null,
            });
          }
        }

        // Auto-assign creator if no assignments exist yet
        if (ctx.user.id) {
          const existingAssignments = await tx
            .select({ id: proposalAssignments.id })
            .from(proposalAssignments)
            .where(eq(proposalAssignments.proposalId, proposalId))
            .limit(1);

          if (existingAssignments.length === 0) {
            await tx
              .insert(proposalAssignments)
              .values({ proposalId, userId: ctx.user.id })
              .onConflictDoNothing();
          }
        }
      });

      return { success: true, id: proposalId };
    }),

  assign: adminProcedure
    .input(z.object({ proposalId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        columns: { id: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      const [targetMembership] = await ctx.db
        .select({ userId: member.userId })
        .from(member)
        .where(and(eq(member.userId, input.userId), eq(member.organizationId, ctx.orgId)))
        .limit(1);

      if (!targetMembership) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is not a member of this organization' });
      }

      await ctx.db
        .insert(proposalAssignments)
        .values({
          proposalId: input.proposalId,
          userId: input.userId,
          assignedBy: ctx.user.id,
        })
        .onConflictDoNothing();

      return { success: true };
    }),

  unassign: adminProcedure
    .input(z.object({ proposalId: z.string(), userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(proposalAssignments)
        .where(
          and(
            eq(proposalAssignments.proposalId, input.proposalId),
            eq(proposalAssignments.userId, input.userId),
          ),
        );

      return { success: true };
    }),

  sendToClient: protectedProcedure
    .input(z.object({ proposalId: z.string(), message: z.string().max(5000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        with: { client: true, organization: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      if (!proposal.client?.email) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Client does not have an email address' });
      }

      const daysCountResult = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(proposalDays)
        .where(eq(proposalDays.proposalId, input.proposalId));
      const daysCount = daysCountResult[0]?.count ?? 0;
      const duration = daysCount > 0 ? `${daysCount} days` : undefined;

      const startDate = proposal.startDate
        ? new Date(proposal.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : undefined;

      const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${input.proposalId}`;

      const result = await sendProposalShareEmail({
        clientEmail: proposal.client.email,
        clientName: proposal.client.name,
        agencyName: proposal.organization?.name || 'Your Travel Agency',
        proposalTitle: proposal.tourTitle || proposal.name,
        proposalUrl,
        startDate,
        duration,
        message: input.message,
      });

      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }

      // Auto-transition status to shared
      await ctx.db
        .update(proposals)
        .set({ status: 'shared', updatedAt: new Date().toISOString() })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),

  confirm: publicProcedure
    .input(z.object({ proposalId: z.string(), clientName: z.string().max(255) }))
    .mutation(async ({ ctx, input }) => {
      const [proposal, daysCountResult] = await Promise.all([
        ctx.db.query.proposals.findFirst({
          where: eq(proposals.id, input.proposalId),
          with: { organization: true, client: true },
        }),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(proposalDays)
          .where(eq(proposalDays.proposalId, input.proposalId)),
      ]);

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      if (!proposal.organization?.notificationEmail) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No notification email configured for this organization' });
      }

      const daysCount = daysCountResult[0]?.count ?? 0;
      const duration = daysCount > 0 ? `${daysCount} days` : undefined;

      const startDate = proposal.startDate
        ? new Date(proposal.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : undefined;

      let totalPrice: string | undefined;
      if (proposal.pricingRows) {
        const rows = proposal.pricingRows as Array<{ count: number; unitPrice: number }>;
        const total = rows.reduce((acc, row) => acc + row.count * row.unitPrice, 0);
        if (total > 0) totalPrice = `$${total.toLocaleString()}`;
      }

      const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${input.proposalId}`;

      const result = await sendProposalAcceptanceEmail({
        agencyName: proposal.organization.name,
        clientName: input.clientName || proposal.client?.name || 'Guest',
        clientEmail: proposal.client?.email || undefined,
        proposalTitle: proposal.tourTitle || proposal.name,
        proposalUrl,
        startDate,
        duration,
        totalPrice,
        recipientEmail: proposal.organization.notificationEmail,
      });

      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }

      // Auto-transition status to awaiting_payment
      await ctx.db
        .update(proposals)
        .set({ status: 'awaiting_payment', updatedAt: new Date().toISOString() })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        status: z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'cancelled']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        columns: { id: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      await ctx.db
        .update(proposals)
        .set({ status: input.status })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),

  duplicate: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        with: {
          days: {
            with: {
              accommodations: true,
              activities: true,
              meals: true,
              transportation: true,
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });

      if (!original) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      const access = await checkFeatureAccess(ctx.orgId, 'activeProposals');
      if (!access.allowed) {
        throw new TRPCError({ code: 'FORBIDDEN', message: access.reason });
      }

      const newId = Math.random().toString(36).substring(2, 9);

      await ctx.db.transaction(async (tx) => {
        await tx.insert(proposals).values({
          id: newId,
          name: `${original.name} (copy)`,
          tourId: original.tourId,
          organizationId: ctx.orgId,
          clientId: null,
          tourTitle: original.tourTitle,
          tourType: original.tourType,
          theme: original.theme,
          heroImage: original.heroImage,
          startDate: original.startDate,
          startCity: original.startCity,
          startCityLat: original.startCityLat,
          startCityLng: original.startCityLng,
          endCity: original.endCity,
          endCityLat: original.endCityLat,
          endCityLng: original.endCityLng,
          pickupPoint: original.pickupPoint,
          transferIncluded: original.transferIncluded,
          travelerGroups: original.travelerGroups,
          pricingRows: original.pricingRows,
          extras: original.extras,
          countries: original.countries,
          inclusions: original.inclusions,
          exclusions: original.exclusions,
          hidePricing: original.hidePricing,
          status: 'draft',
        });

        for (const day of original.days) {
          const [newDay] = await tx
            .insert(proposalDays)
            .values({
              proposalId: newId,
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              previewImage: day.previewImage,
              nationalParkId: day.nationalParkId,
              destinationName: day.destinationName,
              destinationLat: day.destinationLat,
              destinationLng: day.destinationLng,
            })
            .returning();

          if (!newDay) continue;

          for (const acc of day.accommodations) {
            await tx.insert(proposalAccommodations).values({
              proposalDayId: newDay.id,
              accommodationId: acc.accommodationId,
            });
          }

          for (const activity of day.activities) {
            await tx.insert(proposalActivities).values({
              proposalDayId: newDay.id,
              name: activity.name,
              description: activity.description,
              location: activity.location,
              moment: activity.moment,
              isOptional: activity.isOptional,
              imageUrl: activity.imageUrl,
            });
          }

          if (day.meals) {
            await tx.insert(proposalMeals).values({
              proposalDayId: newDay.id,
              breakfast: day.meals.breakfast,
              lunch: day.meals.lunch,
              dinner: day.meals.dinner,
            });
          }

          for (const transport of day.transportation) {
            await tx.insert(proposalTransportation).values({
              proposalDayId: newDay.id,
              originName: transport.originName,
              originId: transport.originId,
              destinationName: transport.destinationName,
              destinationId: transport.destinationId,
              mode: transport.mode,
              durationMinutes: transport.durationMinutes,
              distanceKm: transport.distanceKm,
              notes: transport.notes,
            });
          }
        }

        // Assign the current user
        await tx
          .insert(proposalAssignments)
          .values({ proposalId: newId, userId: ctx.user.id })
          .onConflictDoNothing();
      });

      return { success: true, newProposalId: newId };
    }),
});
