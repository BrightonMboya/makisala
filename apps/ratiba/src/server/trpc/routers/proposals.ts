import { randomBytes, randomUUID } from 'crypto';
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
  paymentMethods,
  accommodationImages,
  emailMessages,
  invoices,
} from '@repo/db/schema';
import type { InternalCostLine } from '@repo/db/schema';
import { recordSentEmail } from '@repo/db';
import { and, asc, desc, eq, gte, inArray, isNull, isNotNull, lte, notInArray, or, sql, count } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import {
  sendProposalShareEmail,
  sendProposalAcceptanceEmail,
} from '@repo/resend';
import { router, protectedProcedure, adminProcedure, publicProcedure, escapeLikeQuery, type Context } from '../init';
import { getHiddenImageIds } from '../lib/hidden-images';
import { loadBookingAddOns } from '../lib/booking-addons';
import { computeBookingTotal, parseSelections, type Selections } from '@/lib/booking-addons';
import { buildCheckoutLineItems, computeTotals } from '@/lib/invoices/seed-from-proposal';
import { getNextInvoiceNumber } from '@/lib/invoices/numbering';
import { formatMoney } from '@/components/invoices/form-types';
import { getOrgPaymentMethodSnapshot } from '@/lib/invoices/payment-methods';
import { checkFeatureAccess, getOrgPlan, ALLOWED_THEMES_BY_TIER } from '@/lib/plans';
import {
  CLIENT_CONFIRMABLE_STATUSES,
  DEFAULT_DASHBOARD_STATUSES,
  isClientConfirmable,
} from '@/lib/proposal-status';
import { deriveMealPlan, type ParkFeeCategory } from '@/lib/pricing-engine';
import { computeOrgPricing, type OrgPricingDayInput } from '../lib/org-pricing';
import { env } from '@/lib/env';
import { getPublicUrl } from '@/lib/storage';
import { log, serializeError } from '@/lib/logger';

/** Thrown to skip checkout invoicing when the proposal already has a sent
 *  invoice. Distinguished from a real failure so it isn't logged as an error. */
class AlreadyInvoiced extends Error {
  constructor(readonly number: string) {
    super(`Proposal already has invoice ${number}`);
  }
}

/**
 * Pin a start date to noon UTC before storing so the calendar day can't drift.
 *
 * Clients serialize picked dates via `toLocalISOString` (noon UTC already), but
 * this strips any stray time-of-day and guarantees a consistent stored value
 * regardless of the write path. Uses UTC fields since the server runs in UTC.
 */
function normalizeStartDate(value: string | Date): string {
  const d = new Date(value);
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0, 0),
  ).toISOString();
}

/**
 * Deep-copies a proposal's days (and their accommodations/activities/meals/
 * transportation) onto `newProposalId`. Shared by `duplicate` and
 * `saveAsTemplate`, which differ only in how the parent `proposals` row is
 * inserted.
 */
async function copyProposalDays(tx: any, days: any[], newProposalId: string) {
  for (const day of days) {
    const [newDay] = await tx
      .insert(proposalDays)
      .values({
        proposalId: newProposalId,
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        previewImage: day.previewImage,
        nationalParkId: day.nationalParkId,
        destinationName: day.destinationName,
        destinationLat: day.destinationLat,
        destinationLng: day.destinationLng,
        alternatives: day.alternatives,
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
        activityLibraryId: activity.activityLibraryId,
        name: activity.name,
        description: activity.description,
        location: activity.location,
        fromLocation: activity.fromLocation,
        toLocation: activity.toLocation,
        moment: activity.moment,
        time: activity.time || null,
        isOptional: activity.isOptional,
        price: activity.price,
        priceUnit: activity.priceUnit,
        imageUrl: activity.imageUrl,
      });
    }

    if (day.meals) {
      await tx.insert(proposalMeals).values({
        proposalDayId: newDay.id,
        breakfast: day.meals.breakfast,
        lunch: day.meals.lunch,
        dinner: day.meals.dinner,
        options: Array.isArray(day.meals.options) ? day.meals.options : [],
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
}

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
  extras?: Array<{
    id: string;
    name: string;
    price: number;
    priceUnit?: 'per_person' | 'per_group' | 'free' | 'custom';
    customUnitLabel?: string;
    selected: boolean;
  }> | null;
  countries?: string[] | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  useAutoPricing?: boolean | null;
  pricingOverrides?: Record<string, number> | null;
  internalCostLines?: InternalCostLine[] | null;
  vehicleId?: string | null;
  vehicleCount?: number | null;
  markupPct?: number | string | null;
  pickupTransferRateId?: string | null;
  dropoffTransferRateId?: string | null;
  currency?: 'USD' | 'EUR' | null;
  days?: BuilderDay[];
}

interface BuilderActivity {
  libraryId?: string | null;
  name: string;
  description?: string | null;
  location?: string | null;
  fromLocation?: string | null;
  toLocation?: string | null;
  moment?: string | null;
  startTime?: string | null;
  time?: string | null;
  isOptional?: boolean;
  /** Optional activities only: what adding it costs on the booking page. */
  price?: number | null;
  priceUnit?: 'per_person' | 'per_group' | null;
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
  accommodationName?: string | null;
  rooms?: Array<{
    roomType: string | null;
    pax: number;
    children?: number;
  }>;
  alternatives?: Array<{
    id: string;
    accommodation: string | null;
    accommodationName?: string | null;
    rooms?: Array<{ roomType: string | null; pax: number }>;
    meals?: { breakfast: boolean; lunch: boolean; dinner: boolean };
    mealOptions?: string[];
    additionalPrice?: number | null;
    /** Free-text unit, used only when priceBasis is 'custom'. */
    priceUnitLabel?: string | null;
    priceBasis?: 'flat' | 'per_person' | 'per_room' | 'custom';
    hideInQuote?: boolean;
  }>;
  activities?: BuilderActivity[];
  meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
  mealOptions?: string[];
  transfer?: BuilderTransfer;
}

// ---------- MCP-facing input schemas ----------
// Strict, LLM-friendly counterparts to the loose `data: z.record(...)` the
// builder UI posts to `save`. Mirror BuilderData/BuilderDay above field-for-
// field; a plain object built from these validates against `save` as-is.
// `accommodation` stays an id (not a free-text name): proposalDays has no
// free-text accommodation column, so a name with no matching id would be
// silently dropped by `save` (unlike destinationName, which has a real column).
const proposalRoomInput = z.object({
  roomType: z.string().max(100).nullable().optional(),
  pax: z.number().int().min(1),
});

const proposalActivityInput = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  fromLocation: z.string().max(255).optional(),
  toLocation: z.string().max(255).optional(),
  moment: z.enum(['Morning', 'Afternoon', 'Evening', 'Half Day', 'Full Day', 'Night']).optional(),
  time: z.string().max(20).optional(),
  isOptional: z.boolean().optional(),
  price: z.number().min(0).optional(),
  priceUnit: z.enum(['per_person', 'per_group']).optional(),
});

const proposalTransferInput = z.object({
  originName: z.string().min(1).max(255),
  destinationName: z.string().min(1).max(255),
  mode: z.enum(['road_4x4', 'road_shuttle', 'road_bus', 'mini_bus', 'flight_domestic', 'flight_bush']),
  durationMinutes: z.number().int().min(0).optional(),
  distanceKm: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

const proposalDayInput = z.object({
  dayNumber: z.number().int().min(1),
  title: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  destinationName: z.string().max(255).optional(),
  // A photo representing this day/destination (e.g. from search_images). Shown
  // as the day card's image in the itinerary.
  previewImage: z.string().url().optional(),
  accommodation: z.string().optional(),
  rooms: z.array(proposalRoomInput).max(20).optional(),
  activities: z.array(proposalActivityInput).max(20).optional(),
  meals: z
    .object({
      breakfast: z.boolean().optional(),
      lunch: z.boolean().optional(),
      dinner: z.boolean().optional(),
    })
    .optional(),
  transfer: proposalTransferInput.optional(),
});

const proposalPricingRowInput = z.object({
  id: z.string(),
  count: z.number().int().min(1),
  type: z.string().min(1).max(100),
  unitPrice: z.number().min(0),
});

const proposalTravelerGroupInput = z.object({
  id: z.string(),
  count: z.number().int().min(1),
  type: z.string().min(1).max(100),
});

export const createProposalInput = z.object({
  name: z.string().min(2).max(255),
  tourId: z.string().optional(),
  clientId: z.string().optional(),
  // The proposal's hero/cover photo (e.g. from search_images). A client-facing
  // proposal should always have one.
  heroImage: z.string().url().optional(),
  // Visual theme for the client-facing page. Defaults to minimalistic if
  // unset, or if the org's plan doesn't allow the requested theme (kudu/
  // discovery require Pro/Business — see ALLOWED_THEMES_BY_TIER). Omits
  // 'safari-portal': a real, renderable theme, but not yet offered in the
  // builder's own theme picker, so not offered here either.
  theme: z.enum(['minimalistic', 'kudu', 'discovery']).optional(),
  currency: z.enum(['USD', 'EUR']).optional(),
  startDate: z.string().optional(),
  startCity: z.string().max(255).optional(),
  endCity: z.string().max(255).optional(),
  pickupPoint: z.string().max(255).optional(),
  countries: z.array(z.string().min(2)).optional(),
  inclusions: z.array(z.string().max(255)).optional(),
  exclusions: z.array(z.string().max(255)).optional(),
  travelerGroups: z.array(proposalTravelerGroupInput).optional(),
  pricingRows: z.array(proposalPricingRowInput).optional(),
  days: z.array(proposalDayInput).max(60).optional(),
});

export const updateProposalInput = createProposalInput.partial().extend({ id: z.string() });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// When a proposal uses the rate-card auto-pricing engine, the builder only
// ever shows the computed sell total/per-pax in its own UI — it never writes
// that number into `pricingRows`, which is the field every display surface
// (public proposal page, PDF export, operator preview) actually reads. Without
// this, an auto-priced proposal saves with whatever `pricingRows` happened to
// be in client state (often still the untouched "2 Adult @ $0" default),
// showing $0 everywhere despite a correct total in the builder. Re-run the
// same engine server-side at save time and reconcile `pricingRows` so every
// consumer of the stored proposal agrees with the auto-priced total.
async function reconcileAutoPricingRows(
  db: Context['db'],
  orgId: string,
  builderData: BuilderData,
): Promise<BuilderData['pricingRows']> {
  const days = builderData.days ?? [];
  const travelerGroups = builderData.travelerGroups ?? [];
  const totalPax = travelerGroups.reduce((sum, g) => sum + g.count, 0);
  if (!builderData.startDate || days.length === 0 || totalPax === 0) return null;

  const startDate = new Date(builderData.startDate);
  if (Number.isNaN(startDate.getTime())) return null;

  const dayInputs: OrgPricingDayInput[] = days.map((d, idx) => {
    const date = new Date(startDate);
    date.setUTCDate(date.getUTCDate() + idx);
    const isParkId = !!d.destination && UUID_RE.test(d.destination);
    return {
      dayNumber: d.dayNumber,
      date,
      accommodationId: d.accommodation ?? null,
      accommodationName: d.accommodationName ?? null,
      mealPlan: deriveMealPlan(d.meals),
      rooms: (d.rooms ?? []).map((r) => ({
        roomType: r.roomType,
        pax: r.pax,
        children: r.children ?? 0,
      })),
      parkId: isParkId ? d.destination! : null,
      destinationName: d.destinationName ?? null,
      activities: (d.activities ?? []).map((a) => ({
        libraryId: a.libraryId ?? null,
        name: a.name ?? null,
        isOptional: a.isOptional ?? false,
      })),
    };
  });

  const travelerBreakdown: Array<{ category: ParkFeeCategory; count: number }> = [];
  const counts = new Map<ParkFeeCategory, number>();
  for (const g of travelerGroups) {
    if (g.type === 'Baby') continue;
    const category: ParkFeeCategory = g.type === 'Child' ? 'non_resident_child' : 'non_resident_adult';
    counts.set(category, (counts.get(category) ?? 0) + g.count);
  }
  for (const [category, count] of counts) travelerBreakdown.push({ category, count });

  const markupPct =
    builderData.markupPct == null || builderData.markupPct === '' ? 0 : Number(builderData.markupPct);

  try {
    const breakdown = await computeOrgPricing(db, orgId, {
      days: dayInputs,
      pax: totalPax,
      travelerCategory: 'non_resident_adult',
      travelerBreakdown,
      vehicleId: builderData.vehicleId ?? null,
      vehicleCount: builderData.vehicleCount ?? 1,
      pickupTransferId: builderData.pickupTransferRateId ?? null,
      dropoffTransferId: builderData.dropoffTransferRateId ?? null,
      markupPct,
      currency: builderData.currency === 'EUR' ? 'EUR' : 'USD',
      overrides: builderData.pricingOverrides ?? null,
      internalCostLines: builderData.internalCostLines ?? null,
    });

    return travelerGroups.map((g) => ({
      id: g.id,
      count: g.count,
      type: g.type,
      unitPrice: breakdown.sellPerPax,
    }));
  } catch (err) {
    log.error('Auto pricing reconciliation failed on proposal save', { orgId, error: serializeError(err) });
    return null;
  }
}

export const proposalsRouter = router({
  listForDashboard: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['mine', 'all']).default('mine'),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        status: z
          .enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled'])
          .optional(),
        statuses: z
          .array(
            z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled']),
          )
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Templates are drafts with no client — exclude them so they don't
      // surface as a stray "fresh draft" row in the pipeline.
      const conditions = [eq(proposals.organizationId, ctx.orgId), eq(proposals.isTemplate, false)];

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

      // Accept a multi-value `statuses` filter (or the legacy single `status`).
      // No status → no filter (this feed is also used by the calendar search).
      const statusFilter = input.statuses ?? (input.status ? [input.status] : null);
      if (statusFilter && statusFilter.length > 0) {
        conditions.push(inArray(proposals.status, statusFilter));
      }

      if (input.search?.trim()) {
        const pattern = `%${escapeLikeQuery(input.search.trim())}%`;

        // Match on client name via a pre-fetched id list rather than a correlated
        // subquery. Drizzle's relational query builder (db.query.proposals.findMany
        // below) rewrites table-qualified columns inside raw `sql` fragments to the
        // root alias, so `clients.id` would become `proposals.id` (text) compared
        // against `proposals.client_id` (uuid) and fail with "operator does not
        // exist: text = uuid".
        const matchingClients = await ctx.db
          .select({ id: clients.id })
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, ctx.orgId),
              sql`${clients.name} ilike ${pattern} escape '\\'`,
            ),
          );
        const matchingClientIds = matchingClients.map((c) => c.id);

        const searchConditions = [
          sql`${proposals.name} ilike ${pattern} escape '\\'`,
          sql`${proposals.tourTitle} ilike ${pattern} escape '\\'`,
        ];
        if (matchingClientIds.length > 0) {
          searchConditions.push(inArray(proposals.clientId, matchingClientIds));
        }

        conditions.push(or(...searchConditions)!);
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

  // The dashboard's default surface: one row per CLIENT (with a proposal count
  // and the latest proposal's status/date for context) rather than one row per
  // proposal, so a client with several proposals shows once. Proposals that have
  // no client yet (fresh drafts) can't be grouped, so they surface as their own
  // rows and navigate straight to the editor. Same mine/all + status + search
  // filters as listForDashboard.
  listClientsForDashboard: protectedProcedure
    .input(
      z.object({
        filter: z.enum(['mine', 'all']).default('mine'),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        status: z
          .enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled'])
          .optional(),
        statuses: z
          .array(
            z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled']),
          )
          .optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Templates are drafts with no client — exclude them so they don't
      // surface as a stray "fresh draft" row in the pipeline.
      const conditions = [eq(proposals.organizationId, ctx.orgId), eq(proposals.isTemplate, false)];

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

      // Restrict to the selected statuses, defaulting to the active pipeline so
      // cancelled/completed trips stay hidden until explicitly requested. Accepts
      // the legacy single `status` too. An empty array means "show none".
      const statusFilter =
        input.statuses ?? (input.status ? [input.status] : DEFAULT_DASHBOARD_STATUSES);
      if (statusFilter.length === 0) {
        return { items: [], totalCount: 0, page: input.page, pageSize: input.pageSize, totalPages: 0 };
      }
      conditions.push(inArray(proposals.status, statusFilter));

      if (input.search?.trim()) {
        const pattern = `%${escapeLikeQuery(input.search.trim())}%`;

        const matchingClients = await ctx.db
          .select({ id: clients.id })
          .from(clients)
          .where(
            and(
              eq(clients.organizationId, ctx.orgId),
              sql`${clients.name} ilike ${pattern} escape '\\'`,
            ),
          );
        const matchingClientIds = matchingClients.map((c) => c.id);

        const searchConditions = [
          sql`${proposals.name} ilike ${pattern} escape '\\'`,
          sql`${proposals.tourTitle} ilike ${pattern} escape '\\'`,
        ];
        if (matchingClientIds.length > 0) {
          searchConditions.push(inArray(proposals.clientId, matchingClientIds));
        }

        conditions.push(or(...searchConditions)!);
      }

      // Pull the matching proposals (light columns), newest activity first, then
      // fold them into one row per client in JS. At the org's scale this stays
      // cheap; if proposal volume grows this can move to a DISTINCT ON query.
      const rows = await ctx.db.query.proposals.findMany({
        where: and(...conditions)!,
        orderBy: desc(proposals.updatedAt),
        columns: {
          id: true,
          clientId: true,
          name: true,
          tourTitle: true,
          status: true,
          startDate: true,
          createdAt: true,
          updatedAt: true,
          travelerGroups: true,
        },
        with: {
          client: { columns: { id: true, name: true, countryOfResidence: true } },
        },
      });

      // Total headcount across a proposal's traveler groups (adults, children, etc).
      const sumTravelers = (groups: (typeof rows)[number]['travelerGroups']): number =>
        (groups ?? []).reduce((total, g) => total + (g.count ?? 0), 0);

      type ClientRow = {
        kind: 'client';
        clientId: string;
        clientName: string;
        country: string | null;
        proposalCount: number;
        // The proposal this card represents: the client's next departure (see
        // pickFeatured). Its fields drive the card's title/status/date.
        featuredProposalId: string;
        featuredTitle: string;
        featuredStatus: (typeof rows)[number]['status'];
        featuredStartDate: string | null;
        travelers: number;
        emailStatus: string | null;
        updatedAt: string;
        // Most recently created proposal in the group, so adding a new proposal
        // to an existing client bumps them back to the top of the list.
        latestCreatedAt: string;
      };
      type OrphanRow = {
        kind: 'proposal';
        proposalId: string;
        title: string;
        status: (typeof rows)[number]['status'];
        startDate: string | null;
        travelers: number;
        emailStatus: string | null;
        updatedAt: string;
        latestCreatedAt: string;
      };

      // Group every matching proposal by client; orphans (no client) stay separate.
      const byClient = new Map<string, typeof rows>();
      const orphanProposals: typeof rows = [];
      for (const p of rows) {
        if (p.clientId && p.client) {
          const arr = byClient.get(p.clientId);
          if (arr) arr.push(p);
          else byClient.set(p.clientId, [p]);
        } else {
          orphanProposals.push(p);
        }
      }

      // A client's card is represented by their next trip: the soonest proposal
      // starting today or later. With none upcoming, fall back to their most
      // recent past trip, then (no dates at all) the most recently edited proposal.
      const startOfToday = (() => {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d.getTime();
      })();
      const ms = (v: string | null): number | null => (v ? new Date(v).getTime() : null);

      const pickFeatured = (list: typeof rows): (typeof rows)[number] => {
        const dated = list.filter((p) => p.startDate);
        const upcoming = dated.filter((p) => ms(p.startDate)! >= startOfToday);
        if (upcoming.length > 0) {
          return upcoming.reduce((soonest, p) =>
            ms(p.startDate)! < ms(soonest.startDate)! ? p : soonest,
          );
        }
        if (dated.length > 0) {
          return dated.reduce((recent, p) =>
            ms(p.startDate)! > ms(recent.startDate)! ? p : recent,
          );
        }
        // list is ordered updatedAt desc, so the first is the most recently edited.
        return list[0]!;
      };

      const clientRows: ClientRow[] = [];
      for (const [clientId, list] of byClient) {
        const featured = pickFeatured(list);
        const latestCreatedAt = list.reduce(
          (latest, p) => (ms(p.createdAt)! > ms(latest)! ? p.createdAt : latest),
          list[0]!.createdAt,
        );
        clientRows.push({
          kind: 'client',
          clientId,
          clientName: featured.client!.name,
          country: featured.client!.countryOfResidence,
          proposalCount: list.length,
          featuredProposalId: featured.id,
          featuredTitle: featured.tourTitle || featured.name,
          featuredStatus: featured.status,
          featuredStartDate: featured.startDate,
          travelers: sumTravelers(featured.travelerGroups),
          emailStatus: null,
          updatedAt: featured.updatedAt,
          latestCreatedAt,
        });
      }

      const orphanRows: OrphanRow[] = orphanProposals.map((p) => ({
        kind: 'proposal',
        proposalId: p.id,
        title: p.tourTitle || p.name,
        status: p.status,
        startDate: p.startDate,
        travelers: sumTravelers(p.travelerGroups),
        emailStatus: null,
        updatedAt: p.updatedAt,
        latestCreatedAt: p.createdAt,
      }));

      // Newest-added first: a client whose proposal was just created (or who
      // just got a fresh proposal added) jumps to the top of the list.
      const all = [...clientRows, ...orphanRows].sort(
        (a, b) => ms(b.latestCreatedAt)! - ms(a.latestCreatedAt)!,
      );

      const totalCount = all.length;
      const totalPages = Math.ceil(totalCount / input.pageSize);
      const start = (input.page - 1) * input.pageSize;
      const items = all.slice(start, start + input.pageSize);

      // Attach the latest email delivery status, but only for the proposals on
      // this page so the lookup stays bounded. Each row maps to one representative
      // proposal (a client's featured trip, or the orphan draft itself).
      const pageProposalIds = items.map((it) =>
        it.kind === 'client' ? it.featuredProposalId : it.proposalId,
      );
      if (pageProposalIds.length > 0) {
        const emailRows = await ctx.db
          .select({
            proposalId: emailMessages.proposalId,
            status: emailMessages.status,
            sentAt: emailMessages.sentAt,
          })
          .from(emailMessages)
          .where(
            and(
              eq(emailMessages.organizationId, ctx.orgId),
              inArray(emailMessages.proposalId, pageProposalIds),
            ),
          )
          .orderBy(desc(emailMessages.sentAt));

        // Rows are newest-first, so the first status seen for a proposal is its
        // most recent send.
        const latestStatus = new Map<string, string>();
        for (const e of emailRows) {
          if (e.proposalId && !latestStatus.has(e.proposalId)) {
            latestStatus.set(e.proposalId, e.status);
          }
        }
        for (const it of items) {
          const pid = it.kind === 'client' ? it.featuredProposalId : it.proposalId;
          it.emailStatus = latestStatus.get(pid) ?? null;
        }
      }

      return { items, totalCount, page: input.page, pageSize: input.pageSize, totalPages };
    }),

  // Lightweight feed for the dashboard calendar view: every scheduled trip in
  // the org (startDate set), with its duration derived from the day count so we
  // can render a multi-day bar. No pagination; a calendar wants the full range.
  listForCalendar: protectedProcedure
    .input(
      z
        .object({
          filter: z.enum(['mine', 'all']).default('all'),
          // Restrict to specific proposal statuses. The dashboard calendar passes
          // ['booked'] so it only shows confirmed departures rather than the whole
          // pipeline (drafts, shared, etc.).
          statuses: z
            .array(
              z.enum([
                'draft',
                'shared',
                'awaiting_payment',
                'paid',
                'booked',
                'completed',
                'cancelled',
              ]),
            )
            .optional(),
          // Visible calendar window. When set, only trips overlapping it are
          // returned so the payload stays bounded as the proposal count grows.
          rangeStart: z.string().datetime().optional(),
          rangeEnd: z.string().datetime().optional(),
        })
        .default({ filter: 'all' }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(proposals.organizationId, ctx.orgId),
        isNotNull(proposals.startDate),
      ];

      if (input.statuses && input.statuses.length > 0) {
        conditions.push(inArray(proposals.status, input.statuses));
      }

      if (input.rangeStart && input.rangeEnd) {
        // A trip occupies [startDate, startDate + duration). We don't have the
        // duration in this table, so widen the lower bound by a generous buffer
        // to still include trips that began before the window but run into it.
        const BUFFER_DAYS = 45;
        const lowerBound = new Date(
          new Date(input.rangeStart).getTime() - BUFFER_DAYS * 24 * 60 * 60 * 1000,
        ).toISOString();
        conditions.push(gte(proposals.startDate, lowerBound));
        conditions.push(lte(proposals.startDate, input.rangeEnd));
      }

      if (input.filter === 'mine') {
        const assignedRows = await ctx.db
          .select({ proposalId: proposalAssignments.proposalId })
          .from(proposalAssignments)
          .where(eq(proposalAssignments.userId, ctx.user.id));
        const assignedIds = assignedRows.map((r) => r.proposalId);
        if (assignedIds.length === 0) return [];
        conditions.push(inArray(proposals.id, assignedIds));
      }

      const rows = await ctx.db.query.proposals.findMany({
        where: and(...conditions)!,
        columns: {
          id: true,
          name: true,
          tourTitle: true,
          status: true,
          startDate: true,
        },
        with: {
          client: { columns: { name: true } },
        },
      });

      // Derive each trip's duration from a grouped COUNT rather than loading
      // every day row: the calendar only needs the tally, not the day contents.
      const dayCounts = new Map<string, number>();
      if (rows.length > 0) {
        const counts = await ctx.db
          .select({ proposalId: proposalDays.proposalId, n: count() })
          .from(proposalDays)
          .where(inArray(proposalDays.proposalId, rows.map((p) => p.id)))
          .groupBy(proposalDays.proposalId);
        for (const c of counts) dayCounts.set(c.proposalId, c.n);
      }

      return rows.map((p) => ({
        id: p.id,
        title: p.tourTitle || p.name,
        client: p.client?.name ?? null,
        status: p.status,
        startDate: p.startDate!,
        // Inclusive day count; a trip always spans at least one day.
        numberOfDays: Math.max(dayCounts.get(p.id) ?? 0, 1),
      }));
    }),

  // The "client deal" view: one client plus every proposal sent to them, most
  // recently touched first. Powers /clients/[id], where an operator drills in
  // from the dashboard list to see all versions of a client's trip and edit any.
  listForClient: protectedProcedure
    .input(z.object({ clientId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [client] = await ctx.db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.clientId), eq(clients.organizationId, ctx.orgId)))
        .limit(1);

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }

      const rows = await ctx.db.query.proposals.findMany({
        where: and(
          eq(proposals.organizationId, ctx.orgId),
          eq(proposals.clientId, input.clientId),
        ),
        orderBy: desc(proposals.updatedAt),
        columns: {
          id: true,
          name: true,
          tourTitle: true,
          status: true,
          startDate: true,
          createdAt: true,
          updatedAt: true,
          travelerGroups: true,
        },
      });

      // Derive each proposal's duration from a grouped COUNT, same as the
      // calendar feed, without loading every day row.
      const dayCounts = new Map<string, number>();
      // Latest email delivery status per proposal, so each row shows whether that
      // specific proposal was sent/opened/etc (the precise, per-proposal signal).
      const emailStatus = new Map<string, string>();
      if (rows.length > 0) {
        const proposalIds = rows.map((p) => p.id);
        const [counts, emailRows] = await Promise.all([
          ctx.db
            .select({ proposalId: proposalDays.proposalId, n: count() })
            .from(proposalDays)
            .where(inArray(proposalDays.proposalId, proposalIds))
            .groupBy(proposalDays.proposalId),
          ctx.db
            .select({
              proposalId: emailMessages.proposalId,
              status: emailMessages.status,
              sentAt: emailMessages.sentAt,
            })
            .from(emailMessages)
            .where(
              and(
                eq(emailMessages.organizationId, ctx.orgId),
                inArray(emailMessages.proposalId, proposalIds),
              ),
            )
            .orderBy(desc(emailMessages.sentAt)),
        ]);
        for (const c of counts) dayCounts.set(c.proposalId, c.n);
        // Newest-first, so the first status seen for a proposal is its latest send.
        for (const e of emailRows) {
          if (e.proposalId && !emailStatus.has(e.proposalId)) {
            emailStatus.set(e.proposalId, e.status);
          }
        }
      }

      return {
        client,
        proposals: rows.map((p) => ({
          id: p.id,
          title: p.tourTitle || p.name,
          status: p.status,
          startDate: p.startDate,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          numberOfDays: Math.max(dayCounts.get(p.id) ?? 0, 1),
          travelers: (p.travelerGroups ?? []).reduce((total, g) => total + (g.count ?? 0), 0),
          emailStatus: emailStatus.get(p.id) ?? null,
        })),
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, input.id),
        with: {
          organization: {
            columns: {
              name: true,
              logoUrl: true,
              aboutDescription: true,
              paymentTerms: true,
              reviewLinks: true,
              socialLinks: true,
              address: true,
              phone: true,
            },
          },
          tour: { columns: { country: true, tourName: true } },
          client: { columns: { name: true, email: true } },
          days: {
            columns: { dayNumber: true, title: true, description: true, previewImage: true, destinationName: true, destinationLat: true, destinationLng: true, alternatives: true },
            with: {
              nationalPark: {
                columns: { id: true, name: true, country: true, park_overview: true, latitude: true, longitude: true },
              },
              accommodations: {
                columns: { id: true, roomType: true, paxCount: true },
                with: {
                  accommodation: {
                    columns: { id: true, name: true, overview: true, description: true },
                    with: {
                      images: { columns: { id: true, bucket: true, key: true, organizationId: true } },
                    },
                  },
                },
              },
              activities: {
                columns: { name: true, description: true, location: true, fromLocation: true, toLocation: true, moment: true, time: true, isOptional: true, imageUrl: true, price: true, priceUnit: true },
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
      if (!result) return null;

      // Restrict every accommodation's images to what THIS proposal's org may
      // see: curated/global images (organizationId IS NULL) plus the org's own,
      // minus any curated image the org has hidden. Another org's private images
      // are never shown to this proposal's traveler.
      const propOrgId = result.organizationId;
      const hiddenSet = new Set(propOrgId ? await getHiddenImageIds(ctx.db, propOrgId) : []);
      for (const day of result.days) {
        for (const da of day.accommodations) {
          const acc = da.accommodation;
          if (acc?.images) {
            acc.images = acc.images.filter(
              (img) =>
                (img.organizationId == null || img.organizationId === propOrgId) &&
                !hiddenSet.has(img.id),
            );
          }
        }
      }

      // Alternatives are stored as denormalized JSON (no join), so their lodge
      // photos aren't part of the relational query. Batch-fetch images for every
      // alternative accommodation and inject resolved public URLs onto each one
      // so the client proposal can show them in a lightbox.
      const altAccIds = Array.from(
        new Set(
          result.days.flatMap((day) =>
            (day.alternatives ?? [])
              .map((alt) => alt.accommodation)
              .filter((id): id is string => !!id),
          ),
        ),
      );
      if (altAccIds.length > 0) {
        const imgs = await ctx.db
          .select({
            accommodationId: accommodationImages.accommodationId,
            bucket: accommodationImages.bucket,
            key: accommodationImages.key,
          })
          .from(accommodationImages)
          .where(
            and(
              inArray(accommodationImages.accommodationId, altAccIds),
              propOrgId
                ? or(
                    isNull(accommodationImages.organizationId),
                    eq(accommodationImages.organizationId, propOrgId),
                  )
                : isNull(accommodationImages.organizationId),
              hiddenSet.size ? notInArray(accommodationImages.id, [...hiddenSet]) : undefined,
            ),
          );
        const urlsByAcc = new Map<string, string[]>();
        for (const img of imgs) {
          const arr = urlsByAcc.get(img.accommodationId) ?? [];
          arr.push(getPublicUrl(img.bucket, img.key));
          urlsByAcc.set(img.accommodationId, arr);
        }
        for (const day of result.days) {
          if (!day.alternatives) continue;
          for (const alt of day.alternatives) {
            alt.images = alt.accommodation ? urlsByAcc.get(alt.accommodation) ?? [] : [];
          }
        }
      }
      return result;
    }),

  getForBuilder: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.id), eq(proposals.organizationId, ctx.orgId)),
        columns: {
          id: true,
          name: true,
          status: true,
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
          useAutoPricing: true,
          pricingOverrides: true,
          internalCostLines: true,
          vehicleId: true,
          vehicleCount: true,
          markupPct: true,
          pickupTransferRateId: true,
          dropoffTransferRateId: true,
          currency: true,
          theme: true,
          heroImage: true,
          language: true,
          emailBodyJson: true,
          emailAttachments: true,
        },
        with: {
          tour: { columns: { country: true } },
          // Org name powers the {{agencyName}} field preview in the share-email composer.
          organization: { columns: { name: true } },
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
              alternatives: true,
            },
            with: {
              accommodations: {
                columns: {
                  accommodationId: true,
                  roomType: true,
                  mealPlan: true,
                  paxCount: true,
                },
                with: {
                  accommodation: { columns: { id: true, name: true } },
                },
              },
              meals: { columns: { breakfast: true, lunch: true, dinner: true, options: true } },
              activities: { columns: { id: true, activityLibraryId: true, name: true, description: true, location: true, fromLocation: true, toLocation: true, moment: true, time: true, isOptional: true, price: true, priceUnit: true, imageUrl: true } },
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

      // No org-scoped match. Distinguish a proposal that exists but belongs to
      // another org (access denied -> the builder should show a not-found
      // fallback) from an id that does not exist yet (a brand-new, not-yet-saved
      // proposal, which must render the empty builder). Only the former throws.
      const foreign = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, input.id),
        columns: { id: true },
      });
      if (foreign) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }
      return null;
    }),

  save: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        data: z.record(z.string(), z.unknown()),
        status: z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled']).optional(),
        tourId: z.string().nullable().optional(),
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

      // Auto-priced proposals never get their sell total written into
      // pricingRows client-side (see reconcileAutoPricingRows above) — derive
      // it here so the public page/PDF/preview don't show $0.
      const reconciledPricingRows = builderData.useAutoPricing
        ? await reconcileAutoPricingRows(ctx.db, ctx.orgId, builderData)
        : null;

      const proposalData = {
        id: proposalId,
        name: input.name,
        tourId: input.tourId || builderData.tourId || null,
        organizationId: ctx.orgId,
        clientId: builderData.clientId || null,
        tourTitle: builderData.tourTitle || input.name,
        tourType: builderData.tourType || null,
        theme: validatedTheme,
        heroImage: builderData.heroImage || null,
        startDate: builderData.startDate ? normalizeStartDate(builderData.startDate) : null,
        startCity: builderData.startCity || null,
        startCityLat: builderData.startCityLat || null,
        startCityLng: builderData.startCityLng || null,
        endCity: builderData.endCity || null,
        endCityLat: builderData.endCityLat || null,
        endCityLng: builderData.endCityLng || null,
        pickupPoint: builderData.pickupPoint || null,
        transferIncluded: builderData.transferIncluded || null,
        pricingRows: reconciledPricingRows || builderData.pricingRows || null,
        extras: builderData.extras || null,
        travelerGroups: builderData.travelerGroups || null,
        countries: builderData.countries || null,
        inclusions: builderData.inclusions || null,
        exclusions: builderData.exclusions || null,
        useAutoPricing: builderData.useAutoPricing ?? false,
        pricingOverrides: builderData.pricingOverrides || null,
        internalCostLines: builderData.internalCostLines || null,
        vehicleId: builderData.vehicleId ?? null,
        vehicleCount: builderData.vehicleCount ?? 1,
        markupPct:
          builderData.markupPct == null || builderData.markupPct === ''
            ? null
            : String(builderData.markupPct),
        pickupTransferRateId: builderData.pickupTransferRateId ?? null,
        dropoffTransferRateId: builderData.dropoffTransferRateId ?? null,
        currency: builderData.currency === 'EUR' ? 'EUR' : 'USD',
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
            useAutoPricing: proposalData.useAutoPricing,
            pricingOverrides: proposalData.pricingOverrides,
            internalCostLines: proposalData.internalCostLines,
            vehicleId: proposalData.vehicleId,
            vehicleCount: proposalData.vehicleCount,
            markupPct: proposalData.markupPct,
            pickupTransferRateId: proposalData.pickupTransferRateId,
            dropoffTransferRateId: proposalData.dropoffTransferRateId,
            currency: proposalData.currency,
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
              useAutoPricing: proposalData.useAutoPricing,
              pricingOverrides: proposalData.pricingOverrides,
              internalCostLines: proposalData.internalCostLines,
              vehicleId: proposalData.vehicleId,
              vehicleCount: proposalData.vehicleCount,
              markupPct: proposalData.markupPct,
              pickupTransferRateId: proposalData.pickupTransferRateId,
              dropoffTransferRateId: proposalData.dropoffTransferRateId,
              currency: proposalData.currency,
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
              // Denormalized alternatives blob. Drop any without a real lodge picked.
              alternatives:
                Array.isArray(day.alternatives) && day.alternatives.length > 0
                  ? day.alternatives.filter((alt) => !!alt.accommodation)
                  : null,
            })
            .returning();

          if (!proposalDay) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Failed to create proposal day ${day.dayNumber}` });

          if (day.accommodation) {
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
              day.accommodation,
            );
            if (isUUID) {
              // One row per room type in the night's mix. Fall back to a single
              // row (no room/pax) so the hotel selection survives even before a
              // room mix is configured.
              const roomRows =
                day.rooms && day.rooms.length > 0
                  ? day.rooms.map((r) => ({
                      roomType: r.roomType ?? null,
                      paxCount: r.pax ?? null,
                    }))
                  : [{ roomType: null, paxCount: null }];
              const nightMealPlan = deriveMealPlan(day.meals);
              for (const rr of roomRows) {
                await tx.insert(proposalAccommodations).values({
                  proposalDayId: proposalDay.id,
                  accommodationId: day.accommodation,
                  roomType: rr.roomType,
                  mealPlan: nightMealPlan,
                  paxCount: rr.paxCount,
                });
              }
            }
          }

          if (day.activities && Array.isArray(day.activities)) {
            for (const activity of day.activities) {
              await tx.insert(proposalActivities).values({
                proposalDayId: proposalDay.id,
                activityLibraryId: activity.libraryId || null,
                name: activity.name,
                description: activity.description || null,
                location: activity.location || null,
                fromLocation: activity.fromLocation || null,
                toLocation: activity.toLocation || null,
                moment: activity.moment || '',
                time: activity.startTime || null,
                isOptional: activity.isOptional || false,
                // Only meaningful for optional activities; the pricing engine
                // costs the rest from rate cards.
                price:
                  activity.isOptional && activity.price != null
                    ? String(activity.price)
                    : null,
                priceUnit: activity.isOptional ? (activity.priceUnit ?? 'per_person') : null,
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
              options: Array.isArray(day.mealOptions) ? day.mealOptions : [],
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

  // Persist the share-email draft (editor body JSON + attachment list) composed
  // on /share. Kept separate from `save` so the operator can autosave email edits
  // without rewriting the whole proposal/day tree. Deliberately does NOT bump
  // `updatedAt`: the email body isn't part of the client-facing proposal, and
  // bumping it would invalidate the prewarmed PDF cache keyed on updatedAt.
  saveEmailDraft: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        emailBodyJson: z.unknown().optional(),
        emailAttachments: z
          .array(
            z.object({
              key: z.string().max(1024),
              filename: z.string().max(255),
              size: z.number().int().nonnegative(),
              contentType: z.string().max(255),
            }),
          )
          .max(20)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.id), eq(proposals.organizationId, ctx.orgId)),
        columns: { id: true },
      });
      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      // Guard against an oversized editor blob (a runaway paste, etc). The editor
      // JSON for a normal email is a few KB; 512KB is a generous ceiling.
      if (
        input.emailBodyJson !== undefined &&
        JSON.stringify(input.emailBodyJson).length > 512 * 1024
      ) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Email body is too large' });
      }

      await ctx.db
        .update(proposals)
        .set({
          ...(input.emailBodyJson !== undefined ? { emailBodyJson: input.emailBodyJson } : {}),
          ...(input.emailAttachments !== undefined
            ? { emailAttachments: input.emailAttachments }
            : {}),
        })
        .where(eq(proposals.id, input.id));

      return { success: true };
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
        orgSlug: proposal.organization?.slug,
        replyToEmail: proposal.organization?.notificationEmail ?? undefined,
      });

      if (!result.success) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }

      // Log the send for delivery analytics (best-effort: never block the flow).
      if (result.id) {
        try {
          await recordSentEmail(ctx.db, {
            resendId: result.id,
            type: 'proposal_share',
            toEmail: proposal.client.email,
            subject: `Your Travel Proposal: ${proposal.tourTitle || proposal.name}`,
            organizationId: proposal.organizationId ?? null,
            proposalId: input.proposalId,
          });
        } catch {
          // Analytics logging is non-critical; the email already went out.
        }
      }

      // Auto-transition status to shared
      await ctx.db
        .update(proposals)
        .set({ status: 'shared', updatedAt: new Date().toISOString() })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),

  confirm: publicProcedure
    .input(
      z.object({
        proposalId: z.string(),
        clientName: z.string().max(255),
        // Ids only: the server re-reads every price from the proposal, so a
        // tampered browser can change what was picked but never what it costs.
        selections: z
          .object({
            activityIds: z.array(z.string()).max(100),
            alternativeByDayId: z.record(z.string(), z.string()),
            extraIds: z.array(z.string()).max(100),
          })
          .optional(),
      }),
    )
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

      // Cheap pre-check for the common case. It is NOT the guard: the real one
      // is the conditional UPDATE below, which is what makes this safe against
      // two tabs confirming at once.
      if (!isClientConfirmable(proposal.status)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This booking has already been confirmed. Contact the operator to change it.',
        });
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

      // Reprice from stored data: the only figure that binds.
      const rows = (proposal.pricingRows as Array<{ count: number; unitPrice: number }>) || [];
      const baseTotal = rows.reduce((acc, row) => acc + row.count * row.unitPrice, 0);
      const groups = (proposal.travelerGroups as Array<{ count: number }>) || [];
      const travelerCount = groups.reduce((acc, g) => acc + g.count, 0);

      const selections: Selections = parseSelections(input.selections);
      const addOns = await loadBookingAddOns(ctx.db, proposal.id, proposal.organizationId);
      const { lines, total } = computeBookingTotal(baseTotal, addOns, selections, travelerCount);

      const currency = proposal.currency ?? 'USD';
      const totalPrice = total > 0 ? formatMoney(total, currency, 0) : undefined;

      // No availability check exists in the booking flow, so a swap may be a
      // lodge we cannot hold. Surfaced in the email, not blocked.
      const lodgeChanges = lines.filter((l) => l.kind === 'alternative');

      const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${input.proposalId}`;

      // Claim the booking before doing anything with side effects. The status
      // predicate lives in the WHERE, so of two tabs confirming at the same
      // instant exactly one updates a row; the loser matches nothing and bails
      // without a second acceptance email or a second invoice.
      //
      // The total is snapshotted here rather than recomputed on read: the
      // operator can keep editing the proposal afterwards, so a later
      // recomputation would not reproduce the figure the client agreed to.
      const claimed = await ctx.db
        .update(proposals)
        .set({
          status: 'awaiting_payment',
          clientSelections: selections,
          confirmedTotal: total.toFixed(2),
          confirmedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(proposals.id, input.proposalId),
            inArray(proposals.status, CLIENT_CONFIRMABLE_STATUSES),
          ),
        )
        .returning({ id: proposals.id });

      if (claimed.length === 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'This booking has already been confirmed. Contact the operator to change it.',
        });
      }

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
        orgSlug: proposal.organization.slug,
        baseTotal: baseTotal > 0 ? formatMoney(baseTotal, currency, 0) : undefined,
        addOns: lines.map((l) => ({
          label: l.label,
          detail: l.detail,
          amount: l.onRequest
            ? 'On request'
            : `${l.amount < 0 ? '-' : '+'}${formatMoney(Math.abs(Math.round(l.amount)), currency, 0)}`,
          needsReview: l.kind === 'alternative' || l.onRequest,
        })),
        lodgeChangeCount: lodgeChanges.length,
      });

      // The operator learning about the booking is the whole point of this
      // mutation, so a failed send is a failed confirm. Release the claim so
      // the client's retry is not met with "already confirmed".
      if (!result.success) {
        await ctx.db
          .update(proposals)
          .set({
            status: proposal.status,
            clientSelections: proposal.clientSelections,
            confirmedTotal: proposal.confirmedTotal,
            confirmedAt: proposal.confirmedAt,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(proposals.id, input.proposalId));
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
      }

      // The traveler's downloadable receipt, from exactly what they confirmed.
      // Best-effort: confirmation already succeeded, so an invoice-numbering
      // hiccup must not fail the booking.
      let checkoutInvoice: {
        number: string;
        currency: string;
        totalCents: number;
        amountPaidCents: number;
        status: string;
        dueDate: string | null;
        shareToken: string;
      } | null = null;
      try {
        // The operator may have already sent one from the dashboard. Issuing a
        // second numbered invoice for one trip is an accounting problem, and
        // the two would disagree: the dashboard seeder bills every offered
        // extra, this one bills only what the client actually picked.
        const existingSent = await ctx.db.query.invoices.findFirst({
          where: and(eq(invoices.proposalId, proposal.id), isNotNull(invoices.sentAt)),
          columns: { number: true },
        });
        if (existingSent) {
          throw new AlreadyInvoiced(existingSent.number);
        }

        const lineItems = buildCheckoutLineItems(
          proposal.pricingRows as Array<{ id: string; count: number; type: string; unitPrice: number }>,
          lines,
        );
        const { subtotalCents, taxCents, totalCents } = computeTotals(lineItems, null);
        const [number, paymentMethodSnapshot] = await Promise.all([
          getNextInvoiceNumber(proposal.organization.id),
          getOrgPaymentMethodSnapshot(ctx.db, proposal.organization.id),
        ]);
        const nowIso = new Date().toISOString();
        const shareToken = randomBytes(24).toString('base64url');
        await ctx.db.insert(invoices).values({
          id: randomUUID(),
          organizationId: proposal.organization.id,
          proposalId: proposal.id,
          clientId: proposal.client?.id ?? null,
          number,
          title: proposal.tourTitle || proposal.name,
          currency: 'USD',
          lineItems,
          subtotalCents,
          taxCents,
          totalCents,
          fromDetails: {
            name: proposal.organization.name ?? null,
            email: proposal.organization.notificationEmail ?? null,
            phone: proposal.organization.phone ?? null,
            address: proposal.organization.address ?? null,
            taxId: proposal.organization.taxId ?? null,
            logoUrl: proposal.organization.logoUrl ?? null,
          },
          toDetails: {
            name: input.clientName || proposal.client?.name || null,
            email: proposal.client?.email ?? null,
            phone: proposal.client?.phone ?? null,
          },
          paymentMethods: paymentMethodSnapshot,
          // Issued at checkout, not an operator draft: mark it sent so the
          // public invoice page skips its "draft preview" banner.
          status: 'sent',
          sentAt: nowIso,
          shareToken,
        });
        checkoutInvoice = {
          number,
          currency: 'USD',
          totalCents,
          amountPaidCents: 0,
          status: 'sent',
          dueDate: null,
          shareToken,
        };
      } catch (err) {
        if (err instanceof AlreadyInvoiced) {
          // Not a failure. getBookingDetails serves the existing one, so the
          // client still gets a receipt on the page.
          log.info('Skipped checkout invoice, proposal already invoiced', {
            proposalId: input.proposalId,
            number: err.number,
          });
        } else {
          log.error('Failed to generate checkout invoice', {
            proposalId: input.proposalId,
            error: serializeError(err),
          });
        }
      }

      // Return the operator's payment methods so the client can pay directly.
      // The booking page also fetches these; returning them here keeps the
      // post-confirm response self-contained.
      const methods = await ctx.db
        .select({
          id: paymentMethods.id,
          type: paymentMethods.type,
          label: paymentMethods.label,
          instructions: paymentMethods.instructions,
          url: paymentMethods.url,
        })
        .from(paymentMethods)
        .where(eq(paymentMethods.organizationId, proposal.organization.id))
        .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt));

      return { success: true, paymentMethods: methods, total, addOnLines: lines, invoice: checkoutInvoice };
    }),

  // Powers the standalone booking page (/proposal/[id]/book). Returns the
  // proposal summary plus the operator's payment methods so the client can pay
  // directly. Public: the proposal link is the access token. Payment details
  // (bank/Stripe/Pesapal) are the operator's own payout info, safe to show to
  // the client who received the proposal.
  getBookingDetails: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, input.id),
        columns: {
          id: true,
          name: true,
          tourTitle: true,
          startDate: true,
          pricingRows: true,
          travelerGroups: true,
          status: true,
          organizationId: true,
          clientSelections: true,
          confirmedTotal: true,
          currency: true,
        },
        with: {
          organization: { columns: { name: true, logoUrl: true } },
          client: { columns: { name: true } },
        },
      });
      if (!proposal) return null;

      const rows = (proposal.pricingRows as Array<{ count: number; unitPrice: number }>) || [];
      const total = rows.reduce((acc, r) => acc + r.count * r.unitPrice, 0);
      const groups = (proposal.travelerGroups as Array<{ count: number }>) || [];
      const travelerCount = groups.reduce((acc, g) => acc + g.count, 0);

      // Independent reads, and this query is the whole booking page: the add-on
      // load alone fans out to days, activities and accommodation images.
      const [methods, addOns, invoiceRow] = await Promise.all([
        proposal.organizationId
          ? ctx.db
              .select({
                id: paymentMethods.id,
                type: paymentMethods.type,
                label: paymentMethods.label,
                instructions: paymentMethods.instructions,
                url: paymentMethods.url,
              })
              .from(paymentMethods)
              .where(eq(paymentMethods.organizationId, proposal.organizationId))
              .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.createdAt))
          : Promise.resolve([]),
        loadBookingAddOns(ctx.db, proposal.id, proposal.organizationId),
        // Newest issued invoice, so a returning client can still download it.
        // Unsent drafts stay hidden: they are the operator's working copy.
        ctx.db.query.invoices.findFirst({
          where: and(eq(invoices.proposalId, proposal.id), isNotNull(invoices.sentAt)),
          orderBy: desc(invoices.createdAt),
          columns: {
            number: true,
            currency: true,
            totalCents: true,
            amountPaidCents: true,
            status: true,
            dueDate: true,
            shareToken: true,
          },
        }),
      ]);
      const invoice =
        invoiceRow && invoiceRow.shareToken
          ? {
              number: invoiceRow.number,
              currency: invoiceRow.currency,
              totalCents: invoiceRow.totalCents,
              amountPaidCents: invoiceRow.amountPaidCents,
              status: invoiceRow.status,
              dueDate: invoiceRow.dueDate,
              shareToken: invoiceRow.shareToken,
            }
          : null;

      return {
        id: proposal.id,
        title: proposal.tourTitle || proposal.name,
        clientName: proposal.client?.name ?? '',
        startDate: proposal.startDate,
        status: proposal.status,
        travelerCount,
        totalPrice: total > 0 ? total : null,
        currency: proposal.currency ?? 'USD',
        organization: proposal.organization
          ? { name: proposal.organization.name, logoUrl: proposal.organization.logoUrl }
          : null,
        paymentMethods: methods,
        addOns,
        // Rehydrates a returning client's choices.
        selections: parseSelections(proposal.clientSelections),
        confirmedTotal: proposal.confirmedTotal == null ? null : Number(proposal.confirmedTotal),
        invoice,
      };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        status: z.enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled']),
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
    .input(
      z.object({
        proposalId: z.string(),
        // Optional overrides applied to the copy so the "duplicate" dialog can
        // set a new client, dates and party size in one flow. Omit any field to
        // carry over the original's value.
        clientId: z.string().nullish(),
        startDate: z.string().optional(),
        travelerGroups: z
          .array(z.object({ id: z.string(), count: z.number().int().min(1), type: z.string() }))
          .optional(),
        tourTitle: z.string().min(1).optional(),
      }),
    )
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

      const newId = crypto.randomUUID();

      // Apply the dialog's overrides, falling back to the original's values.
      // A template isn't a prior deal, so instantiating one shouldn't read as
      // a "(copy)" — just use its title directly.
      const newTourTitle = input.tourTitle ?? original.tourTitle;
      const newName =
        input.tourTitle ?? (original.isTemplate ? original.tourTitle ?? original.name : `${original.name} (copy)`);
      const newStartDate = input.startDate ? normalizeStartDate(input.startDate) : original.startDate;
      const newTravelerGroups = input.travelerGroups ?? original.travelerGroups;
      // When the party size changes, rebuild pricing rows to match the new
      // groups, carrying over the original's first unit price so pricing isn't
      // lost. Without an override, keep the original rows untouched.
      const basePrice = original.pricingRows?.[0]?.unitPrice ?? 0;
      const newPricingRows = input.travelerGroups
        ? input.travelerGroups.map((g) => ({
            id: g.id,
            count: g.count,
            type: g.type,
            unitPrice: basePrice,
          }))
        : original.pricingRows;

      await ctx.db.transaction(async (tx) => {
        await tx.insert(proposals).values({
          id: newId,
          name: newName,
          tourId: original.tourId,
          organizationId: ctx.orgId,
          clientId: input.clientId ?? null,
          tourTitle: newTourTitle,
          tourType: original.tourType,
          theme: original.theme,
          heroImage: original.heroImage,
          startDate: newStartDate,
          startCity: original.startCity,
          startCityLat: original.startCityLat,
          startCityLng: original.startCityLng,
          endCity: original.endCity,
          endCityLat: original.endCityLat,
          endCityLng: original.endCityLng,
          pickupPoint: original.pickupPoint,
          transferIncluded: original.transferIncluded,
          travelerGroups: newTravelerGroups,
          pricingRows: newPricingRows,
          extras: original.extras,
          countries: original.countries,
          inclusions: original.inclusions,
          exclusions: original.exclusions,
          useAutoPricing: original.useAutoPricing,
          pricingOverrides: original.pricingOverrides,
          internalCostLines: original.internalCostLines,
          vehicleId: original.vehicleId,
          vehicleCount: original.vehicleCount,
          markupPct: original.markupPct,
          pickupTransferRateId: original.pickupTransferRateId,
          dropoffTransferRateId: original.dropoffTransferRateId,
          status: 'draft',
        });

        await copyProposalDays(tx, original.days, newId);

        // Assign the current user
        await tx
          .insert(proposalAssignments)
          .values({ proposalId: newId, userId: ctx.user.id })
          .onConflictDoNothing();
      });

      return { success: true, newProposalId: newId };
    }),

  // Flags a finished proposal as a reusable template: a client-stripped copy
  // that shows up on /tours instead of the live pipeline. "Send to client"
  // later instantiates it back into a real proposal via `duplicate`.
  saveAsTemplate: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        templateName: z.string().min(1).optional(),
      }),
    )
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

      const newId = crypto.randomUUID();
      const newName = input.templateName ?? original.tourTitle ?? original.name;

      await ctx.db.transaction(async (tx) => {
        await tx.insert(proposals).values({
          id: newId,
          name: newName,
          tourId: original.tourId,
          organizationId: ctx.orgId,
          clientId: null,
          tourTitle: original.tourTitle,
          tourType: original.tourType,
          theme: original.theme,
          heroImage: original.heroImage,
          startDate: null,
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
          useAutoPricing: original.useAutoPricing,
          pricingOverrides: original.pricingOverrides,
          internalCostLines: original.internalCostLines,
          vehicleId: original.vehicleId,
          vehicleCount: original.vehicleCount,
          markupPct: original.markupPct,
          pickupTransferRateId: original.pickupTransferRateId,
          dropoffTransferRateId: original.dropoffTransferRateId,
          status: 'draft',
          isTemplate: true,
        });

        await copyProposalDays(tx, original.days, newId);
      });

      return { success: true, templateId: newId };
    }),

  // The org's reusable proposal templates, shown on /tours.
  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.proposals.findMany({
      where: and(eq(proposals.organizationId, ctx.orgId), eq(proposals.isTemplate, true)),
      orderBy: desc(proposals.updatedAt),
      with: {
        days: { columns: { id: true } },
      },
      columns: {
        id: true,
        name: true,
        tourTitle: true,
        heroImage: true,
        countries: true,
        updatedAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      tourTitle: row.tourTitle,
      heroImage: row.heroImage,
      countries: row.countries ?? [],
      numberOfDays: row.days.length,
      updatedAt: row.updatedAt,
    }));
  }),

  delete: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(eq(proposals.id, input.proposalId), eq(proposals.organizationId, ctx.orgId)),
        columns: { id: true },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      // All proposal children (days, activities, meals, transportation,
      // assignments, invoices, ...) are declared `onDelete: 'cascade'`, so a
      // single delete removes the whole tree.
      await ctx.db.delete(proposals).where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),
});
