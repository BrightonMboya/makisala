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
import { createProposalInput, updateProposalInput } from '@/server/trpc/routers/proposals';

function textResult(data: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(data) }] };
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
type ProposalActivityInput = ArrayElement<NonNullable<ProposalDayInput['activities']>>;

// Builds the loose `data` blob `proposals.save` expects from our strict,
// LLM-facing input. Field names mostly pass through 1:1; `time` maps to
// `startTime` because that's the field `save`'s day-insertion loop actually
// reads (BuilderActivity carries both, only `startTime` is used).
function proposalDataFromInput(
  input: Omit<z.infer<typeof createProposalInput>, 'name' | 'tourId'>,
): Record<string, unknown> {
  return {
    clientId: input.clientId,
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
    days: input.days?.map((day: ProposalDayInput) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      description: day.description,
      destinationName: day.destinationName,
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
    })),
  };
}

interface ExistingProposalDay {
  dayNumber: number;
  title: string | null;
  description: string | null;
  destinationName: string | null;
  accommodations: Array<{
    accommodationId: string;
    roomType: string | null;
    paxCount: number | null;
  }>;
  meals: { breakfast: boolean; lunch: boolean; dinner: boolean } | null;
  activities: Array<{
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
  }>;
  transportation: Array<{
    originName: string;
    destinationName: string;
    mode: 'road_4x4' | 'road_shuttle' | 'road_bus' | 'mini_bus' | 'flight_domestic' | 'flight_bush';
    durationMinutes: number | null;
    distanceKm: number | null;
    notes: string | null;
  }>;
}

// Reconstructs the day-input shape from a previously-saved proposal, for
// update_proposal to fall back on when the caller doesn't resend `days` —
// `save` replaces the entire day list on every call, so omitting this would
// silently wipe the existing itinerary.
function daysFromExisting(days: ExistingProposalDay[]) {
  return days.map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title ?? undefined,
    description: day.description ?? undefined,
    destinationName: day.destinationName ?? undefined,
    accommodation: day.accommodations[0]?.accommodationId,
    rooms: day.accommodations.map((a) => ({
      roomType: a.roomType,
      pax: a.paxCount ?? 1,
    })),
    activities: day.activities.map((a) => ({
      name: a.name,
      description: a.description ?? undefined,
      location: a.location ?? undefined,
      fromLocation: a.fromLocation ?? undefined,
      toLocation: a.toLocation ?? undefined,
      moment: a.moment as NonNullable<ProposalActivityInput['moment']>,
      time: a.time ?? undefined,
      isOptional: a.isOptional,
      price: a.price != null ? Number(a.price) : undefined,
      priceUnit: a.priceUnit ?? undefined,
    })),
    meals: day.meals
      ? { breakfast: day.meals.breakfast, lunch: day.meals.lunch, dinner: day.meals.dinner }
      : undefined,
    transfer: day.transportation[0]
      ? {
          originName: day.transportation[0].originName,
          destinationName: day.transportation[0].destinationName,
          mode: day.transportation[0].mode,
          durationMinutes: day.transportation[0].durationMinutes ?? undefined,
          distanceKm: day.transportation[0].distanceKm ?? undefined,
          notes: day.transportation[0].notes ?? undefined,
        }
      : undefined,
  }));
}

const mcpHandler = createMcpHandler(
  (server) => {
    server.registerTool(
      'list_proposals',
      {
        title: 'List proposals',
        description:
          'List client proposals (quotes/sales documents) in the connected Ratiba account, optionally filtered by status or search text.',
        inputSchema: z.object({
          status: z
            .enum(['draft', 'shared', 'awaiting_payment', 'paid', 'booked', 'completed', 'cancelled'])
            .optional(),
          search: z.string().optional(),
          page: z.number().int().min(1).optional(),
          pageSize: z.number().int().min(1).max(100).optional(),
        }),
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(
          await caller.proposals.listForDashboard({
            filter: 'all',
            status: input.status,
            search: input.search,
            page: input.page ?? 1,
            pageSize: input.pageSize ?? 20,
          }),
        );
      },
    );

    server.registerTool(
      'get_proposal',
      {
        title: 'Get proposal',
        description:
          'Get the full details of one proposal by id, including its day-by-day itinerary and pricing.',
        inputSchema: z.object({ id: z.string() }),
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(await caller.proposals.getForBuilder({ id: input.id }));
      },
    );

    server.registerTool(
      'create_proposal',
      {
        title: 'Create proposal',
        description:
          "Create a new client proposal (quote/sales document) with a day-by-day itinerary and pricing. Use this when the user wants to put together a proposal to send to a client. `accommodation` on a day must be an existing accommodation id (look it up first) — a lodge name with no id just won't be linked; mention it in `description` instead.",
        inputSchema: createProposalInput,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        return textResult(
          await caller.proposals.save({
            id: '',
            name: input.name,
            tourId: input.tourId ?? null,
            data: proposalDataFromInput(input),
          }),
        );
      },
    );

    server.registerTool(
      'update_proposal',
      {
        title: 'Update proposal',
        description:
          'Update an existing proposal. Fields left out keep their current value. If `days` is provided it replaces the whole itinerary; if omitted, the existing itinerary is kept as-is.',
        inputSchema: updateProposalInput,
      },
      async (input, ctx) => {
        const { userId, orgId } = getAuth(ctx);
        const caller = await createMcpCaller(userId, orgId);
        const existing = await caller.proposals.getForBuilder({ id: input.id });
        if (!existing) throw new Error(`Proposal ${input.id} not found`);

        const { id, ...rest } = input;
        return textResult(
          await caller.proposals.save({
            id,
            name: rest.name ?? existing.name,
            tourId: rest.tourId ?? existing.tourId ?? null,
            status: existing.status,
            data: proposalDataFromInput({
              clientId: rest.clientId ?? existing.clientId ?? undefined,
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
              days: rest.days ?? daysFromExisting(existing.days),
            }),
          }),
        );
      },
    );
  },
  { serverInfo: { name: 'ratiba', version: '1.0.0' } },
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
