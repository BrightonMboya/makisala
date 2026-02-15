import { z } from 'zod';
import { db } from '@repo/db';
import {
  proposals,
  proposalAssignments,
  proposalDays,
  proposalAccommodations,
  proposalActivities,
  proposalMeals,
  proposalTransportation,
  member,
} from '@repo/db/schema';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  sendProposalShareEmail,
  sendProposalAcceptanceEmail,
} from '@repo/resend';
import { router, protectedProcedure, adminProcedure, publicProcedure } from '../init';
import { checkFeatureAccess, getOrgPlan, ALLOWED_THEMES_BY_TIER } from '@/lib/plans';
import { env } from '@/lib/env';

export const proposalsRouter = router({
  listForDashboard: protectedProcedure
    .input(z.object({ filter: z.enum(['mine', 'all']).default('mine') }))
    .query(async ({ ctx, input }) => {
      let whereClause = eq(proposals.organizationId, ctx.orgId);

      if (input.filter === 'mine') {
        const assignedRows = await db
          .select({ proposalId: proposalAssignments.proposalId })
          .from(proposalAssignments)
          .where(eq(proposalAssignments.userId, ctx.user.id));

        const assignedIds = assignedRows.map((r) => r.proposalId);
        if (assignedIds.length === 0) return [];

        whereClause = and(
          eq(proposals.organizationId, ctx.orgId),
          inArray(proposals.id, assignedIds),
        )!;
      }

      return await db.query.proposals.findMany({
        where: whereClause,
        orderBy: desc(proposals.updatedAt),
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
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const result = await db.query.proposals.findFirst({
        where: eq(proposals.id, input.id),
        with: {
          organization: {
            columns: { name: true, logoUrl: true, aboutDescription: true, paymentTerms: true },
          },
          tour: { columns: { country: true, tourName: true } },
          client: { columns: { name: true, email: true } },
          days: {
            columns: { dayNumber: true, title: true, description: true, previewImage: true },
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
      const result = await db.query.proposals.findFirst({
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
          endCity: true,
          pickupPoint: true,
          transferIncluded: true,
          travelerGroups: true,
          pricingRows: true,
          extras: true,
          countries: true,
          inclusions: true,
          exclusions: true,
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
              activities: { columns: { id: true, name: true, description: true } },
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
        data: z.any(),
        status: z.enum(['draft', 'shared']).optional(),
        tourId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let proposalId = input.id;
      if (!proposalId || proposalId.trim() === '') {
        const { randomUUID } = await import('crypto');
        proposalId = randomUUID();
      }

      const builderData = input.data;

      const existingProposal = await db.query.proposals.findFirst({
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
        tourId: input.tourId || builderData.tourId,
        organizationId: ctx.orgId,
        clientId: builderData.clientId || null,
        tourTitle: builderData.tourTitle || input.name,
        tourType: builderData.tourType || null,
        theme: validatedTheme,
        heroImage: builderData.heroImage || null,
        startDate: builderData.startDate ? new Date(builderData.startDate).toISOString() : null,
        startCity: builderData.startCity || null,
        endCity: builderData.endCity || null,
        pickupPoint: builderData.pickupPoint || null,
        transferIncluded: builderData.transferIncluded || null,
        pricingRows: builderData.pricingRows || null,
        extras: builderData.extras || null,
        travelerGroups: builderData.travelerGroups || null,
        countries: builderData.countries || null,
        inclusions: builderData.inclusions || null,
        exclusions: builderData.exclusions || null,
        status: input.status || 'draft',
        updatedAt: new Date().toISOString(),
      };

      await db.transaction(async (tx) => {
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

        const days: any[] = builderData.days || [];

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
            })
            .returning();

          if (!proposalDay) throw new Error(`Failed to create proposal day ${day.dayNumber}`);

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
      const proposal = await db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        columns: { id: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      const [targetMembership] = await db
        .select({ userId: member.userId })
        .from(member)
        .where(and(eq(member.userId, input.userId), eq(member.organizationId, ctx.orgId)))
        .limit(1);

      if (!targetMembership) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is not a member of this organization' });
      }

      await db
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
    .mutation(async ({ input }) => {
      await db
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
    .input(z.object({ proposalId: z.string(), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        with: { client: true, organization: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      if (!proposal.client?.email) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Client does not have an email address' });
      }

      const daysCountResult = await db
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

      return { success: true };
    }),

  confirm: publicProcedure
    .input(z.object({ proposalId: z.string(), clientName: z.string() }))
    .mutation(async ({ input }) => {
      const [proposal, daysCountResult] = await Promise.all([
        db.query.proposals.findFirst({
          where: eq(proposals.id, input.proposalId),
          with: { organization: true, client: true },
        }),
        db
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

      return { success: true };
    }),
});
