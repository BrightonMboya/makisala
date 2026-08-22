import { z } from 'zod';
import type { AuthInfo } from '@modelcontextprotocol/server';
import { createMcpHandler } from 'mcp-handler';
import { requireMcpAuth } from '@better-auth/mcp';
import { auth } from '@/lib/auth';
import { env } from '@/lib/env';
import { log } from '@/lib/logger';
import { checkFeatureAccess } from '@/lib/plans';
import { createMcpCaller } from '@/server/trpc/caller';
import { resolveOrgId } from '@/server/trpc/init';
import {
  createProposalInput,
  updateProposalInput,
  listProposalsForDashboardInput,
  reconcileAutoPricingRows,
  type BuilderData,
} from '@/server/trpc/routers/proposals';
import { db } from '@repo/db';
import { clientsListInput, createClientInput } from '@/server/trpc/routers/clients';
import { translateProposalInput } from '@/server/trpc/routers/translations';
import { accommodationsSearchInput } from '@/server/trpc/routers/accommodations';
import type { PricingBreakdown } from '@/lib/pricing-engine';
import { getPublicUrl } from '@/lib/storage';

type McpCaller = Awaited<ReturnType<typeof createMcpCaller>>;

/** Public URL an accommodation/day image (bucket+key) resolves to. */
function imageUrl(img: { bucket: string; key: string }): string {
  return getPublicUrl(img.bucket, img.key);
}

// The client-shareable page and the operator's edit view for a proposal id —
// the only two URLs that exist for a proposal (see routers/proposals.ts
// sendToClient/confirm for the canonical /proposal/{id} pattern). Tools must
// return these rather than let the caller guess at a URL shape.
function proposalUrls(id: string) {
  return {
    shareUrl: `${env.NEXT_PUBLIC_APP_URL}/proposal/${id}`,
    editUrl: `${env.NEXT_PUBLIC_APP_URL}/itineraries/${id}/day-by-day`,
  };
}

// ---------------------------------------------------------------------------
// MCP tool outputSchema definitions.
//
// These mirror each handler's actual return shape below — the SDK validates
// every response's structuredContent against them and hard-fails the call on
// any mismatch (see textResult above), so accuracy here isn't optional.
//
// The itinerary/pricing internals (day objects, pricingSummary.lineItems,
// listForDashboard's proposal rows) are deliberately left as loose records
// rather than fully modeled field-by-field: they're large, evolving, and
// already loosely typed server-side (see ExistingProposalDay/BuilderData
// above), so pinning them down exactly would be more likely to break a real
// call than to help the calling model. Fields that matter for chaining
// (ids, urls, warnings) are typed precisely; everything else is permissive.
// ---------------------------------------------------------------------------

const lineItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  dayNumber: z.number().optional(),
  quantity: z.number(),
  unitCost: z.number(),
  totalCost: z.number(),
  source: z.enum([
    'accommodation',
    'park_fee',
    'activity',
    'vehicle',
    'transfer',
    'internal',
    'guide',
    'meal',
    'flight',
  ]),
  missing: z.string().optional(),
  occupantBreakdown: z.string().optional(),
  overridden: z.boolean().optional(),
  originalUnitCost: z.number().optional(),
  originalTotalCost: z.number().optional(),
});

const pricingWarningSchema = z.object({
  kind: z.enum([
    'missing_room_meal',
    'room_pax_mismatch',
    'missing_room_capacity',
    'no_season',
    'missing_hotel_rate',
    'missing_park_fee',
    'missing_park_ancillary_no_vehicle',
    'missing_activity_rate',
    'missing_vehicle',
    'missing_transfer',
    'vehicle_capacity_exceeded',
    'missing_guide',
    'unpriced_transfer_day',
    'missing_transit_fee',
    'missing_meal_rate',
    'missing_flight_rate',
    'no_start_date',
  ]),
  message: z.string(),
  dayNumber: z.number().optional(),
  key: z.string().optional(),
});

// The raw engine breakdown, as returned inline on create_proposal/update_proposal
// (proposals.save returns it verbatim as `pricingBreakdown`) — distinct from the
// smaller `pricingSummary` derived from it by summarizePricingBreakdown below.
const pricingBreakdownSchema = z
  .object({
    currency: z.string(),
    lineItems: z.array(lineItemSchema),
    costSubtotal: z.number(),
    markupPct: z.number(),
    markupAmount: z.number(),
    sellTotal: z.number(),
    costPerPax: z.number(),
    sellPerPax: z.number(),
    pax: z.number(),
    warnings: z.array(pricingWarningSchema),
  })
  .nullable();

const pricingSummarySchema = z
  .object({
    currency: z.string(),
    pax: z.number(),
    costBySource: z.record(z.string(), z.number()),
    costSubtotal: z.number(),
    markupPct: z.number(),
    markupAmount: z.number(),
    sellTotal: z.number(),
    sellPerPax: z.number(),
    lineItems: z.array(
      z.object({
        label: z.string(),
        quantity: z.number(),
        unitCost: z.number(),
        totalCost: z.number(),
        source: z.string(),
        missing: z.string().optional(),
      }),
    ),
  })
  .nullable();

const proposalWarningsSchema = z.array(z.string());

const clientRecordSchema = z
  .object({
    id: z.string(),
    organizationId: z.string(),
    name: z.string(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    countryOfResidence: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .catchall(z.unknown());

const roomTypeSchema = z.object({
  name: z.string(),
  description: z.string(),
  capacity: z.string().optional(),
});

const accommodationSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  country: z.string().nullable(),
  latitude: z.union([z.string(), z.number()]).nullable(),
  longitude: z.union([z.string(), z.number()]).nullable(),
  overview: z.string().nullable(),
  roomTypes: z.array(roomTypeSchema).nullable(),
  locationHighlights: z.array(z.string()).nullable(),
  images: z.array(z.string()),
});

const accommodationDetailSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable(),
    url: z.string().nullable(),
    overview: z.string().nullable(),
    description: z.string().nullable(),
    latitude: z.union([z.string(), z.number()]).nullable(),
    longitude: z.union([z.string(), z.number()]).nullable(),
    enhancedDescription: z.string().nullable(),
    amenities: z.array(z.object({ category: z.string(), items: z.array(z.string()) })).nullable(),
    roomTypes: z.array(roomTypeSchema).nullable(),
    locationHighlights: z.array(z.string()).nullable(),
    pricingInfo: z.string().nullable(),
    country: z.string().nullable(),
    isInsidePark: z.boolean(),
    organizationId: z.string().nullable(),
    images: z.array(
      z.object({ id: z.string(), bucket: z.string(), key: z.string(), url: z.string() }).catchall(z.unknown()),
    ),
  })
  .catchall(z.unknown())
  .nullable();

const searchImagesResultSchema = z.object({
  destinationImages: z.array(z.object({ destination: z.string(), images: z.array(z.string()) })),
  accommodationImages: z.array(
    z.object({ accommodation: z.string(), accommodationId: z.string(), images: z.array(z.string()) }),
  ),
  organizationImages: z.array(z.object({ name: z.string(), url: z.string() })),
});

const listProposalsOutputSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

// getForBuilder's return, plus the pricingSummary/warnings the get_proposal
// handler adds on top of it.
const getProposalOutputSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    status: z.string().nullable().optional(),
    days: z.array(z.record(z.string(), z.unknown())).optional(),
    pricingSummary: pricingSummarySchema,
    warnings: proposalWarningsSchema,
  })
  .catchall(z.unknown())
  .nullable();

// proposals.save's return (`{success, id, pricingBreakdown}`) plus the
// shareUrl/editUrl/pricingSummary/warnings create_proposal/update_proposal add.
const saveProposalOutputSchema = z
  .object({
    success: z.boolean(),
    id: z.string(),
    pricingBreakdown: pricingBreakdownSchema,
    shareUrl: z.string(),
    editUrl: z.string(),
    pricingSummary: pricingSummarySchema,
    warnings: proposalWarningsSchema,
  })
  .catchall(z.unknown());

const successResultSchema = z.object({ success: z.boolean() });

/**
 * Pre-flight checks run before create_proposal/update_proposal persist.
 * - Rejects any day.accommodation that isn't a real, org-visible accommodation
 *   id (save() would otherwise just silently drop it, producing a proposal
 *   that looks fine to the agent but has no lodge booked).
 * - Returns non-blocking warnings for things a client-facing proposal should
 *   normally have (a hero image, accommodation on every day) so the agent can
 *   decide whether to fix them before telling the user it's done.
 */
async function validateProposalDays(
  caller: McpCaller,
  days: ProposalDayInput[] | undefined,
  heroImage: string | undefined,
): Promise<string[]> {
  const warnings: string[] = [];
  if (!heroImage) {
    warnings.push('No heroImage set — a client-facing proposal should have a cover photo (see search_images).');
  }
  for (const day of days ?? []) {
    if (day.accommodation) {
      const acc = await caller.accommodations.getById({ id: day.accommodation });
      if (!acc) {
        throw new Error(
          `Day ${day.dayNumber}: accommodation id "${day.accommodation}" does not exist or is not ` +
            'accessible to this organization. Use search_accommodations to find a valid id.',
        );
      }
    } else {
      warnings.push(
        `Day ${day.dayNumber} ("${day.title ?? 'untitled'}") has no accommodation assigned — confirm ` +
          'this is intentional (e.g. a travel/departure day) rather than a missed overnight.',
      );
    }
  }
  return warnings;
}

function textResult(data: unknown) {
  // Round-trip through JSON so structuredContent is exactly what the text
  // content shows (no Date instances, etc.) and always defined — the SDK
  // hard-fails any tool with an outputSchema if structuredContent is
  // undefined, even when the value itself is legitimately null.
  const structuredContent = data === undefined ? null : JSON.parse(JSON.stringify(data));
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    structuredContent,
  };
}

/**
 * Reads the {userId, orgId} that the auth wrapper below stashed in
 * request.auth.extra (see requireMcpAuth call) — resolved once per request
 * from the verified OAuth token, not re-derived per tool call.
 */
function getAuth(ctx: { http?: { authInfo?: AuthInfo } }): { userId: string; orgId: string } {
  const extra = ctx.http?.authInfo?.extra;
  const userId = extra?.userId;
  const orgId = extra?.orgId;
  if (typeof userId !== 'string' || typeof orgId !== 'string') {
    throw new Error('MCP request reached a tool without resolved auth context');
  }
  return { userId, orgId };
}

type ArrayElement<T> = T extends Array<infer E> ? E : never;
type ProposalDayInput = ArrayElement<NonNullable<z.infer<typeof createProposalInput>['days']>>;

// Builder-facing day shape that `proposals.save`'s day-insertion loop reads
// (see BuilderDay/BuilderActivity/BuilderTransfer in routers/proposals.ts).
// Both `mapProposalDays` (LLM-supplied days) and `daysFromExisting` (days
// carried over unchanged) produce this shape, so `save` can't tell which
// source a day came from — the latter just populates more of it.
interface BuilderFacingDay {
  dayNumber: number;
  title?: string;
  description?: string;
  destination?: string;
  destinationName?: string;
  destinationLat?: number;
  destinationLng?: number;
  previewImage?: string;
  alternatives?: unknown;
  accommodation?: string;
  rooms?: Array<{ roomType?: string | null; pax: number }>;
  activities?: Array<{
    libraryId?: string;
    name: string;
    description?: string;
    location?: string;
    fromLocation?: string;
    toLocation?: string;
    moment?: string;
    startTime?: string;
    isOptional?: boolean;
    price?: number;
    priceUnit?: 'per_person' | 'per_group';
    imageUrl?: string;
  }>;
  meals?: { breakfast?: boolean; lunch?: boolean; dinner?: boolean };
  mealOptions?: string[];
  transfer?: {
    originName: string;
    originId?: string;
    destinationName: string;
    destinationId?: string;
    mode: string;
    durationMinutes?: number;
    distanceKm?: number;
    notes?: string;
    flightRateId?: string;
  };
}

// Maps our strict, LLM-facing day input onto the loose builder day shape.
// `time` maps to `startTime` because that's the field `save`'s
// day-insertion loop actually reads (BuilderActivity carries both, only
// `startTime` is used). Fields that only make sense when carrying over an
// existing day (map coordinates, alternates, catalog/image links, transfer
// place ids) have no LLM-facing equivalent and are simply absent here.
function mapProposalDays(days: ProposalDayInput[] | undefined): BuilderFacingDay[] | undefined {
  return days?.map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    destinationName: day.destinationName,
    previewImage: day.previewImage,
    accommodation: day.accommodation,
    rooms: day.rooms,
    activities: day.activities?.map((activity) => ({
      name: activity.name,
      description: activity.description,
      location: activity.location,
      fromLocation: activity.fromLocation,
      toLocation: activity.toLocation,
      moment: activity.moment,
      startTime: activity.time,
      isOptional: activity.isOptional,
      price: activity.price,
      priceUnit: activity.priceUnit,
    })),
    meals: day.meals,
    transfer: day.transfer,
  }));
}

// Auto-pricing engine settings. `useAutoPricing` itself is authorable via the
// MCP schema (createProposalInput); the rate-card selectors it depends on —
// vehicle/guide/markup/transfer-rate — have no MCP-facing equivalent and are
// only ever carried over from an existing proposal (see update_proposal's
// passthrough below), never authored via MCP. `save` treats a missing key as
// "reset to null/default" (it isn't a partial patch), so leaving these out
// entirely — as opposed to passing them as `undefined` — would silently wipe
// a proposal's vehicle/guide/markup/transfer-rate selection on every MCP
// edit, even one unrelated to pricing.
interface AutoPricingPassthrough {
  vehicleId?: string | null;
  vehicleCount?: number | null;
  guideId?: string | null;
  markupPct?: number | string | null;
  pickupTransferRateId?: string | null;
  dropoffTransferRateId?: string | null;
  useAutoPricing?: boolean | null;
  pricingOverrides?: unknown;
  internalCostLines?: unknown;
}

// Builds the loose `data` blob `proposals.save` expects from our strict,
// LLM-facing input, plus the already-mapped `days` (from mapProposalDays or
// daysFromExisting — see callers).
function proposalDataFromInput(
  input: Omit<z.infer<typeof createProposalInput>, 'name' | 'tourId' | 'days'>,
  days: BuilderFacingDay[] | undefined,
  autoPricing?: AutoPricingPassthrough,
): Record<string, unknown> {
  return {
    clientId: input.clientId,
    heroImage: input.heroImage,
    // `save()` reads `selectedTheme`, not `theme` — see BuilderData in routers/proposals.ts.
    selectedTheme: input.theme,
    currency: input.currency,
    startDate: input.startDate,
    startCity: input.startCity,
    endCity: input.endCity,
    pickupPoint: input.pickupPoint,
    countries: input.countries,
    inclusions: input.inclusions,
    exclusions: input.exclusions,
    travelerGroups: input.travelerGroups,
    pricingRows: input.pricingRows,
    ...autoPricing,
    days,
  };
}

// Turns a rate-card PricingBreakdown into something worth relaying to the
// human on the other end of the conversation — the line-item cost, the
// markup, and the final sell price, not just a single number. Also flags
// the one case that's silent otherwise: an auto-priced proposal that landed
// at 0% markup (the org's real default markup couldn't be resolved, or
// someone explicitly zeroed it) is selling at raw cost with no margin — the
// agent should confirm that's intentional before treating this proposal as
// ready to send to a client, not just note it in passing.
function summarizePricingBreakdown(breakdown: PricingBreakdown | null | undefined): {
  pricingSummary: Record<string, unknown> | null;
  zeroMarkupWarning: string | null;
} {
  if (!breakdown) return { pricingSummary: null, zeroMarkupWarning: null };
  const lineItemsBySource = new Map<string, number>();
  for (const li of breakdown.lineItems) {
    lineItemsBySource.set(li.source, (lineItemsBySource.get(li.source) ?? 0) + li.totalCost);
  }
  const pricingSummary = {
    currency: breakdown.currency,
    pax: breakdown.pax,
    costBySource: Object.fromEntries(lineItemsBySource),
    costSubtotal: breakdown.costSubtotal,
    markupPct: breakdown.markupPct,
    markupAmount: breakdown.markupAmount,
    sellTotal: breakdown.sellTotal,
    sellPerPax: breakdown.sellPerPax,
    lineItems: breakdown.lineItems.map((li) => ({
      label: li.label,
      quantity: li.quantity,
      unitCost: li.unitCost,
      totalCost: li.totalCost,
      source: li.source,
      ...(li.missing ? { missing: li.missing } : {}),
    })),
  };
  const zeroMarkupWarning =
    breakdown.markupPct === 0
      ? 'This proposal has 0% markup applied — the sell price equals raw cost with no margin. Do not present ' +
        'this as a final, ready-to-send price without confirming with the user that no markup is intentional ' +
        '(check the org\'s default markup setting, or set one explicitly).'
      : null;
  return { pricingSummary, zeroMarkupWarning };
}

interface ExistingProposalDay {
  dayNumber: number;
  title: string | null;
  description: string | null;
  destinationName: string | null;
  nationalParkId: string | null;
  destinationLat: string | null;
  destinationLng: string | null;
  previewImage: string | null;
  alternatives: unknown;
  accommodations: Array<{
    accommodationId: string;
    roomType: string | null;
    paxCount: number | null;
  }>;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean; options: string[] | null } | null;
  activities: Array<{
    activityLibraryId: string | null;
    name: string;
    description: string | null;
    location: string | null;
    fromLocation: string | null;
    toLocation: string | null;
    moment: string;
    time: string | null;
    isOptional: boolean;
    price: string | null;
    priceUnit: 'per_person' | 'per_group' | null;
    imageUrl: string | null;
  }>;
  transportation: Array<{
    originName: string;
    originId: string | null;
    destinationName: string;
    destinationId: string | null;
    mode: 'road_4x4' | 'road_shuttle' | 'road_bus' | 'mini_bus' | 'flight_domestic' | 'flight_bush';
    durationMinutes: number | null;
    distanceKm: number | null;
    notes: string | null;
    flightRateId: string | null;
  }>;
}

// Reconstructs the builder day shape from a previously-saved proposal, for
// update_proposal to fall back on when the caller doesn't resend `days` —
// `save` replaces the entire day list on every call, so omitting this would
// silently wipe the existing itinerary. Carries over every persisted field
// (map coordinates, alternates, catalog/image links, transfer place ids,
// meal options), not just the subset the LLM-facing schema knows about —
// otherwise those fields get silently deleted the next time save() runs.
function daysFromExisting(days: ExistingProposalDay[]): BuilderFacingDay[] {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title ?? undefined,
    description: day.description ?? undefined,
    destination: day.nationalParkId ?? undefined,
    destinationName: day.destinationName ?? undefined,
    destinationLat: day.destinationLat != null ? Number(day.destinationLat) : undefined,
    destinationLng: day.destinationLng != null ? Number(day.destinationLng) : undefined,
    previewImage: day.previewImage ?? undefined,
    alternatives: day.alternatives ?? undefined,
    accommodation: day.accommodations[0]?.accommodationId,
    rooms: day.accommodations.map((a) => ({
      roomType: a.roomType,
      pax: a.paxCount ?? 1,
    })),
    activities: day.activities.map((a) => ({
      libraryId: a.activityLibraryId ?? undefined,
      name: a.name,
      description: a.description ?? undefined,
      location: a.location ?? undefined,
      fromLocation: a.fromLocation ?? undefined,
      toLocation: a.toLocation ?? undefined,
      moment: a.moment,
      startTime: a.time ?? undefined,
      isOptional: a.isOptional,
      price: a.price != null ? Number(a.price) : undefined,
      priceUnit: a.priceUnit ?? undefined,
      imageUrl: a.imageUrl ?? undefined,
    })),
    meals: day.meals
      ? { breakfast: day.meals.breakfast, lunch: day.meals.lunch, dinner: day.meals.dinner }
      : undefined,
    mealOptions: day.meals?.options ?? undefined,
    transfer: day.transportation[0]
      ? {
          originName: day.transportation[0].originName,
          originId: day.transportation[0].originId ?? undefined,
          destinationName: day.transportation[0].destinationName,
          destinationId: day.transportation[0].destinationId ?? undefined,
          mode: day.transportation[0].mode,
          durationMinutes: day.transportation[0].durationMinutes ?? undefined,
          distanceKm: day.transportation[0].distanceKm ?? undefined,
          notes: day.transportation[0].notes ?? undefined,
          flightRateId: day.transportation[0].flightRateId ?? undefined,
        }
      : undefined,
  }));
}

const SERVER_INSTRUCTIONS = `You are connected to Ratiba, an itinerary builder.

When creating or updating a client-facing proposal:

1. Create a complete, client-ready proposal by default — don't wait to be asked for accommodations, imagery, meals, or activities.
2. If the proposal is for a named client, search_clients first; if they don't already exist, create_client, then pass the returned id as \`clientId\` on create_proposal. Don't leave a named proposal with no clientId just because the client wasn't looked up.
3. Always assign an appropriate existing accommodation to every applicable overnight day (use search_accommodations first; a day with no accommodation and no obvious reason — e.g. a same-day departure — is a mistake).
4. Always set room types and pax counts on accommodation nights.
5. Configure meals for each day where relevant.
6. Include relevant activities and transfers/transportation.
7. Every national park has a curated photo library. For each distinct destinationName in the itinerary (e.g. Arusha, Tarangire, Serengeti), call search_images once with that name; set each day's previewImage from that day's own destination's destinationImages (a day at Tarangire gets a Tarangire photo, not a Serengeti one), and set the proposal's heroImage from the primary/opening destination's destinationImages.
8. There are three visual themes: minimalistic (default, clean/typographic), kudu (dark, immersive, snap-scroll), and discovery (split-screen, image-forward). Keep the default unless the user asks for a particular look or a theme's style clearly fits the trip (e.g. discovery for a photography-heavy safari). kudu/discovery require a Pro/Business plan — if the org's plan doesn't allow the requested theme it's silently saved as minimalistic, which create_proposal/update_proposal surface back as a warning.
9. If the user asks for the proposal in another language, use translate_proposal after the proposal (and its final content) exists — translating first and editing the itinerary after would leave the translation stale, since re-running translate_proposal regenerates it from the current content.
10. Prefer existing Ratiba records (accommodations, images, clients) over inventing values. \`accommodation\` fields must be real accommodation ids — look them up with search_accommodations or get_accommodation; a lodge name with no id will not be linked.
11. Search before you create: look up clients, accommodations, and images before calling create_proposal/update_proposal, not after.
12. After creating or updating a proposal, call get_proposal again and verify the important fields actually persisted (client, accommodations, meals, pricing, hero image, theme).
13. Never claim a proposal is complete until you've verified it this way.
14. Never invent or guess a proposal URL. create_proposal/update_proposal return \`shareUrl\` (client-facing) and \`editUrl\` (operator builder) — only use those, never construct a URL yourself.
15. If required information is missing (e.g. no matching accommodation exists for a destination), say so explicitly rather than silently creating an incomplete proposal.

These are default conventions and should be followed unless the user explicitly asks for an exception.`;

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_proposals',
      {
        title: 'List proposals',
        description:
          'List client proposals (quotes/sales documents) in the connected Ratiba account, optionally filtered by status or search text.',
        inputSchema: listProposalsForDashboardInput.pick({
          status: true,
          search: true,
          page: true,
          pageSize: true,
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: listProposalsOutputSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(await caller.proposals.listForDashboard({ ...input, filter: 'all' }));
      },
    );

    server.registerTool(
      'get_proposal',
      {
        title: 'Get proposal',
        description:
          'Get the full details of one proposal by id, including its day-by-day itinerary and pricing. For an ' +
          'auto-priced proposal (`useAutoPricing: true`), also includes a freshly-computed `pricingSummary` ' +
          '(cost by category, markup, sell total) and flags in `warnings` if it has 0% markup applied.',
        inputSchema: z.object({ id: z.string() }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: getProposalOutputSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const existing = await caller.proposals.getForBuilder({ id: input.id });
        if (!existing) return textResult(null);

        let pricingSummary: Record<string, unknown> | null = null;
        const warnings: string[] = [];
        if (existing.useAutoPricing) {
          // daysFromExisting's return type is a slightly looser shape than
          // BuilderDay (this same data already flows through it via
          // proposalDataFromInput's untyped Record<string, unknown> return
          // in update_proposal above) — safe to assert here too.
          const builderData: BuilderData = {
            days: daysFromExisting(existing.days).map((d) => ({
              ...d,
              rooms: d.rooms?.map((r) => ({ ...r, roomType: r.roomType ?? null })),
            })) as BuilderData['days'],
            travelerGroups: existing.travelerGroups,
            startDate: existing.startDate,
            vehicleId: existing.vehicleId,
            vehicleCount: existing.vehicleCount,
            guideId: existing.guideId,
            markupPct: existing.markupPct,
            pickupTransferRateId: existing.pickupTransferRateId,
            dropoffTransferRateId: existing.dropoffTransferRateId,
            currency: existing.currency as 'USD' | 'EUR' | undefined,
            pricingOverrides: existing.pricingOverrides,
            internalCostLines: existing.internalCostLines,
          };
          const reconciled = await reconcileAutoPricingRows(db, orgId, builderData);
          const summarized = summarizePricingBreakdown(reconciled?.breakdown);
          pricingSummary = summarized.pricingSummary;
          if (summarized.zeroMarkupWarning) warnings.push(summarized.zeroMarkupWarning);
        }
        return textResult({ ...existing, pricingSummary, warnings });
      },
    );

    server.registerTool(
      'search_clients',
      {
        title: 'Search clients',
        description:
          'Search existing clients by name. Use this before create_client to avoid creating a duplicate — if the client already exists, reuse their id as `clientId` on create_proposal/update_proposal.',
        inputSchema: clientsListInput.pick({ query: true, limit: true }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: z.array(clientRecordSchema),
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const result = await caller.clients.list(input);
        return textResult(result.clients);
      },
    );

    server.registerTool(
      'create_client',
      {
        title: 'Create client',
        description:
          'Create a new client record. Search first with search_clients to avoid duplicates. Returns the new client id — pass it as `clientId` when creating a proposal for them.',
        inputSchema: createClientInput,
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        outputSchema: z.object({ id: z.string() }),
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(await caller.clients.create(input));
      },
    );

    server.registerTool(
      'translate_proposal',
      {
        title: 'Translate proposal',
        description:
          "Translate a proposal's client-facing content into another language and set it as the proposal's active language. Re-running with the same language regenerates and overwrites that translation (e.g. after the itinerary changes).",
        inputSchema: translateProposalInput,
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
        outputSchema: successResultSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(await caller.translations.translate(input));
      },
    );

    server.registerTool(
      'reset_proposal_language',
      {
        title: 'Reset proposal language',
        description: "Set a proposal's active language back to English, undoing translate_proposal.",
        inputSchema: z.object({ proposalId: z.string() }),
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        outputSchema: successResultSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(await caller.translations.resetLanguage(input));
      },
    );

    server.registerTool(
      'search_accommodations',
      {
        title: 'Search accommodations',
        description:
          'Search existing accommodations (lodges/camps/hotels) to find valid ids for use as `accommodation` on a proposal day. Search by name, or filter by country (accommodations have no destination/park field, only a country and coordinates — use judgment, or cross-check `latitude`/`longitude` against the day\'s destination, when narrowing beyond country). Always search before guessing an id.',
        // Same shape as accommodations.search, but capped at 50 results
        // instead of 100 — a tighter limit for an LLM caller's context.
        inputSchema: accommodationsSearchInput.extend({
          query: z.string().default('').describe('Free-text match against accommodation name'),
          country: z.string().optional().describe('Filter by country, e.g. "Tanzania"'),
          limit: z.number().int().positive().max(50).default(20),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: z.array(accommodationSearchResultSchema),
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const results = await caller.accommodations.search(input);
        return textResult(
          results.map((acc) => ({
            id: acc.id,
            name: acc.name,
            country: acc.country,
            latitude: acc.latitude,
            longitude: acc.longitude,
            overview: acc.overview,
            roomTypes: acc.roomTypes,
            locationHighlights: acc.locationHighlights,
            images: acc.images.map(imageUrl),
          })),
        );
      },
    );

    server.registerTool(
      'get_accommodation',
      {
        title: 'Get accommodation',
        description: 'Get full details (description, room types, amenities, images) for one accommodation by id.',
        inputSchema: z.object({ id: z.string() }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: accommodationDetailSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const acc = await caller.accommodations.getById({ id: input.id });
        if (!acc) return textResult(null);
        return textResult({ ...acc, images: acc.images.map((img) => ({ ...img, url: imageUrl(img) })) });
      },
    );

    server.registerTool(
      'search_images',
      {
        title: 'Search images',
        description:
          'Find real, existing images to use as a proposal hero image or a day preview image. Matches the query against national park/destination names (returning that destination\'s photo library in `destinationImages`), accommodation names (returning that lodge\'s photos in `accommodationImages`), and this organization\'s own uploaded image library (matched by name/caption, returned in `organizationImages`). Every national park already has a curated library — call this once per distinct `destinationName` in the itinerary (e.g. once for "Serengeti", once for "Tarangire", once for "Arusha"), then set each day\'s `previewImage` from that day\'s own destination\'s `destinationImages`, and pick the proposal\'s `heroImage` from the primary/opening destination\'s `destinationImages`. Always use this instead of inventing an image URL — check the organization\'s own library first, since those are often Makisala-branded or trip-specific photos not tied to any single destination/lodge.',
        inputSchema: z.object({
          query: z
            .string()
            .min(2)
            .describe(
              'A destination name or accommodation name. For destinations, use the short official park name ' +
                '(e.g. "Serengeti", "Tarangire", "Ngorongoro Crater") — matching is substring-based against the ' +
                'park\'s name, so a longer descriptive phrase will fail to match.',
            ),
        }),
        annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
        outputSchema: searchImagesResultSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);

        const [parks, accs, orgImages] = await Promise.all([
          caller.storage.searchNationalParkFolders({ query: input.query }),
          caller.accommodations.search({ query: input.query, limit: 5 }),
          caller.contentLibrary.getOrgImages({ query: input.query, limit: 20 }),
        ]);

        const destinationImages = await Promise.all(
          parks.map(async (park) => ({
            destination: park.displayName,
            images: (await caller.storage.getImages({ folder: park.path })).map((img) => img.secure_url),
          })),
        );

        const accommodationImages = accs.map((acc) => ({
          accommodation: acc.name,
          accommodationId: acc.id,
          images: acc.images.map(imageUrl),
        }));

        const organizationImages = orgImages.images.map((img) => ({ name: img.name, url: img.url }));

        return textResult({ destinationImages, accommodationImages, organizationImages });
      },
    );

    server.registerTool(
      'create_proposal',
      {
        title: 'Create proposal',
        description:
          'Create a new client-facing proposal (a day-by-day itinerary with pricing) in Ratiba. `clientId` should reference a real client — search_clients (and create_client if they\'re new) before calling this, rather than leaving it unset for a named proposal. A complete proposal normally has: an accommodation on every overnight day (with room type and pax), meals, activities, transfers, pricing, and a hero image — search_accommodations/search_images first, then fill these in; do not create a bare-minimum proposal and wait to be asked. `accommodation` on a day must be a real accommodation id (from search_accommodations/get_accommodation) — a lodge name with no id will not be linked and should go in `description` instead. `theme` picks the client page\'s visual style (minimalistic/kudu/discovery) — defaults to minimalistic; kudu/discovery need a Pro/Business plan or the request is silently downgraded (surfaced as a warning). `useAutoPricing: true` computes pricing from the org\'s rate card (park fees, accommodation, and any org markup tiers) instead of flat `pricingRows`; the vehicle/guide/transfer selectors that feed that engine can\'t be set via MCP, so a brand-new auto-priced proposal excludes vehicle and guide costs — and prices any airport-transfer day with no transfer/flight leg at $0 — until someone assigns those in the builder (surfaced as a warning). Without a `startDate`, seasonal rates (accommodation/park fee/activity/flight) can\'t be resolved to a real date, so each is priced at its highest-season rate as a conservative estimate instead (also surfaced as a warning) — pass `startDate` when it\'s known for an accurate price. Leave it unset (or use `pricingRows`) unless the org relies on rate-card pricing. Returns `shareUrl`/`editUrl` — use those, never construct a URL yourself. After creating, call get_proposal to verify what was actually persisted before telling the user it is done; the response also includes non-blocking `warnings` for anything obviously missing. To send the proposal in another language, use translate_proposal afterward.',
        inputSchema: createProposalInput,
        annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
        outputSchema: saveProposalOutputSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const warnings = await validateProposalDays(caller, input.days, input.heroImage);
        if (input.useAutoPricing) {
          warnings.push(
            'useAutoPricing is on, but this proposal has no vehicle or guide assigned yet (MCP can\'t set those) ' +
              '— the rate-card price will exclude vehicle/guide costs until one is assigned in the builder.',
          );
          if (!input.startDate) {
            warnings.push(
              'useAutoPricing is on with no startDate set — rate-card pricing used each item\'s highest-season ' +
                'rate as a conservative estimate; set a startDate (or edit in the builder) for the real seasonal price.',
            );
          }
        }
        const result = await caller.proposals.save({
          id: '',
          name: input.name,
          tourId: input.tourId ?? null,
          data: proposalDataFromInput(input, mapProposalDays(input.days), {
            useAutoPricing: input.useAutoPricing,
          }),
        });
        if (input.theme) {
          const saved = await caller.proposals.getForBuilder({ id: result.id });
          if (saved && saved.theme !== input.theme) {
            warnings.push(
              `Requested theme "${input.theme}" isn't available on this plan — saved as "${saved.theme}" instead.`,
            );
          }
        }
        const { pricingSummary, zeroMarkupWarning } = summarizePricingBreakdown(result.pricingBreakdown);
        if (zeroMarkupWarning) warnings.push(zeroMarkupWarning);
        return textResult({ ...result, ...proposalUrls(result.id), pricingSummary, warnings });
      },
    );

    server.registerTool(
      'update_proposal',
      {
        title: 'Update proposal',
        description:
          'Update an existing proposal. Fields left out keep their current value — including `theme`, which stays as-is unless a new one is passed, and `useAutoPricing`, which is carried over from the existing proposal unless explicitly set. If `days` is provided it replaces the whole itinerary; if omitted, the existing itinerary (accommodations, meals, activities, transfers included) is kept as-is. Same completeness expectations as create_proposal: search_accommodations/search_images before referencing new ids, and verify with get_proposal afterward. Returns `shareUrl`/`editUrl` and non-blocking `warnings`.',
        inputSchema: updateProposalInput,
        annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
        outputSchema: saveProposalOutputSchema,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const existing = await caller.proposals.getForBuilder({ id: input.id });
        if (!existing) throw new Error(`Proposal ${input.id} not found`);

        const { id, ...rest } = input;
        const days = rest.days ? mapProposalDays(rest.days) : daysFromExisting(existing.days);
        const heroImage = rest.heroImage ?? existing.heroImage ?? undefined;
        const warnings = await validateProposalDays(caller, rest.days, heroImage);
        const useAutoPricing = rest.useAutoPricing ?? existing.useAutoPricing;
        if (useAutoPricing && !existing.vehicleId) {
          warnings.push(
            'useAutoPricing is on, but this proposal has no vehicle or guide assigned yet (MCP can\'t set those) ' +
              '— the rate-card price will exclude vehicle/guide costs until one is assigned in the builder.',
          );
        }
        if (useAutoPricing && !(rest.startDate ?? existing.startDate)) {
          warnings.push(
            'useAutoPricing is on with no startDate set — rate-card pricing used each item\'s highest-season ' +
              'rate as a conservative estimate; set a startDate (or edit in the builder) for the real seasonal price.',
          );
        }
        const result = await caller.proposals.save({
          id,
          name: rest.name ?? existing.name,
          tourId: rest.tourId ?? existing.tourId ?? null,
          status: existing.status,
          data: proposalDataFromInput(
            {
              clientId: rest.clientId ?? existing.clientId ?? undefined,
              heroImage,
              theme: rest.theme ?? (existing.theme as 'minimalistic' | 'kudu' | 'discovery' | undefined),
              currency: rest.currency ?? (existing.currency as 'USD' | 'EUR' | undefined),
              startDate: rest.startDate ?? existing.startDate ?? undefined,
              startCity: rest.startCity ?? existing.startCity ?? undefined,
              endCity: rest.endCity ?? existing.endCity ?? undefined,
              pickupPoint: rest.pickupPoint ?? existing.pickupPoint ?? undefined,
              countries: rest.countries ?? existing.countries ?? undefined,
              inclusions: rest.inclusions ?? existing.inclusions ?? undefined,
              exclusions: rest.exclusions ?? existing.exclusions ?? undefined,
              travelerGroups: rest.travelerGroups ?? existing.travelerGroups ?? undefined,
              pricingRows: rest.pricingRows ?? existing.pricingRows ?? undefined,
            },
            days,
            // MCP has no inputs for the rate-card selectors — always carry
            // the existing values forward so an unrelated edit (e.g. a
            // description tweak) can't reset the proposal's
            // vehicle/guide/markup/transfer selection. `useAutoPricing`
            // itself IS authorable — an explicit value overrides the
            // existing one, otherwise it's carried forward like the rest.
            {
              vehicleId: existing.vehicleId,
              vehicleCount: existing.vehicleCount,
              guideId: existing.guideId,
              markupPct: existing.markupPct,
              pickupTransferRateId: existing.pickupTransferRateId,
              dropoffTransferRateId: existing.dropoffTransferRateId,
              useAutoPricing,
              pricingOverrides: existing.pricingOverrides,
              internalCostLines: existing.internalCostLines,
            },
          ),
        });
        if (rest.theme) {
          const saved = await caller.proposals.getForBuilder({ id: result.id });
          if (saved && saved.theme !== rest.theme) {
            warnings.push(
              `Requested theme "${rest.theme}" isn't available on this plan — saved as "${saved.theme}" instead.`,
            );
          }
        }
        const { pricingSummary, zeroMarkupWarning } = summarizePricingBreakdown(result.pricingBreakdown);
        if (zeroMarkupWarning) warnings.push(zeroMarkupWarning);
        return textResult({ ...result, ...proposalUrls(result.id), pricingSummary, warnings });
      },
    );
  },
  { serverInfo: { name: 'ratiba', version: '1.0.0' }, instructions: SERVER_INSTRUCTIONS },
);

const resource = `${env.NEXT_PUBLIC_APP_URL}/api/mcp`;

const handler = requireMcpAuth(
  auth,
  async (request, claims) => {
    const start = Date.now();
    const userId = claims.sub;
    if (!userId) {
      return new Response('Invalid token: missing subject', { status: 401 });
    }

    const orgId = await resolveOrgId(userId);
    const access = await checkFeatureAccess(orgId, 'mcpAccess');
    if (!access.allowed) {
      return new Response(access.reason ?? 'MCP access requires the Pro or Business plan', {
        status: 403,
      });
    }

    // Bridge better-auth's verified claims into the shape the MCP SDK exposes
    // to tool callbacks (ctx.http.authInfo), so registerTool handlers can read
    // {userId, orgId} via getAuth() above without threading them through closures.
    // clientId/scopes aren't used for authorization (that already happened
    // above), so they're left as harmless placeholders.
    request.auth = {
      token: '',
      clientId: 'unknown',
      scopes: [],
      extra: { userId, orgId },
    };

    let status: 'success' | 'error' = 'success';
    try {
      return await mcpHandler(request);
    } catch (error) {
      status = 'error';
      throw error;
    } finally {
      log.info('MCP request', { orgId, userId, durationMs: Date.now() - start, status });
    }
  },
  { resource },
);

export { handler as GET, handler as POST };
