import { randomBytes } from 'crypto';
import { z } from 'zod';
import { and, asc, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { clientPortals, portalTravelers, proposals, clients, organizations } from '@repo/db/schema';
import type { PortalTraveler } from '@repo/db/schema';
import { sendPortalSubmissionEmail } from '@repo/resend';
import { env } from '@/lib/env';
import { router, protectedProcedure, publicProcedure, escapeLikeQuery } from '../init';
import { encryptField, decryptField, maskEmail } from '@/lib/portal/crypto';
import {
  getPortalSessionEmail,
  isPortalExpired,
  logPortalEvent,
  recentAccessEvents,
  revokePortalSessions,
} from '@/lib/portal/session';

const MAX_TRAVELERS = 30;
const DEFAULT_EXPIRY_DAYS = 90;

// Fields encrypted at rest. fullName stays plaintext (needed for labels/lists,
// low sensitivity on its own). Everything identity/health/logistics is encrypted.
const ENCRYPTED_FIELDS = [
  'nationality',
  'dateOfBirth',
  'gender',
  'passportNumber',
  'passportIssuingCountry',
  'passportExpiry',
  'dietaryPreferences',
  'allergies',
  'medicalNotes',
  'emergencyContactName',
  'emergencyContactPhone',
  'arrivalDetails',
  'specialRequests',
] as const;

const travelerFieldsSchema = z.object({
  fullName: z.string().trim().min(1, 'Name is required').max(200),
  nationality: z.string().max(100).nullish(),
  dateOfBirth: z.string().max(40).nullish(),
  gender: z.string().max(40).nullish(),
  passportNumber: z.string().max(60).nullish(),
  passportIssuingCountry: z.string().max(100).nullish(),
  passportExpiry: z.string().max(40).nullish(),
  dietaryPreferences: z.string().max(2000).nullish(),
  allergies: z.string().max(2000).nullish(),
  medicalNotes: z.string().max(2000).nullish(),
  emergencyContactName: z.string().max(200).nullish(),
  emergencyContactPhone: z.string().max(60).nullish(),
  arrivalDetails: z.string().max(2000).nullish(),
  specialRequests: z.string().max(2000).nullish(),
});

type TravelerFields = z.infer<typeof travelerFieldsSchema>;

// Encrypt the incoming (already validated) sensitive fields for storage.
function encryptTravelerFields(fields: TravelerFields): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const key of ENCRYPTED_FIELDS) {
    const value = fields[key];
    out[key] = value && value.trim() !== '' ? encryptField(value.trim()) : null;
  }
  return out;
}

// Decrypt a stored traveler row for display. Omits the raw scan storage key;
// exposes only whether a scan exists and its filename.
function decryptTravelerForView(row: PortalTraveler) {
  const decrypted: Record<string, unknown> = { ...row };
  for (const key of ENCRYPTED_FIELDS) {
    decrypted[key] = decryptField(row[key]);
  }
  delete decrypted.passportScanKey;
  return {
    ...(decrypted as Omit<PortalTraveler, 'passportScanKey'>),
    hasScan: !!row.passportScanKey,
  };
}

async function loadOwnedPortal(
  ctx: { db: typeof import('@repo/db').db; orgId: string },
  id: string,
) {
  const portal = await ctx.db.query.clientPortals.findFirst({
    where: and(eq(clientPortals.id, id), eq(clientPortals.organizationId, ctx.orgId)),
  });
  if (!portal) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Portal not found' });
  }
  return portal;
}

async function loadPortalByToken(ctx: { db: typeof import('@repo/db').db }, token: string) {
  const portal = await ctx.db.query.clientPortals.findFirst({
    where: eq(clientPortals.shareToken, token),
  });
  if (!portal) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Portal not found' });
  }
  return portal;
}

// Gate for client-facing mutations: a valid verified session is required, and
// the portal must not be expired. Returns the verified email.
async function requirePortalSession(
  ctx: { db: typeof import('@repo/db').db },
  token: string,
) {
  const portal = await loadPortalByToken(ctx, token);
  if (isPortalExpired(portal)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'This portal has expired.' });
  }
  const email = await getPortalSessionEmail(portal.id);
  if (!email) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Please verify your email first.' });
  }
  return { portal, email };
}

async function touchPortal(
  db: typeof import('@repo/db').db,
  portalId: string,
  extra: Record<string, unknown> = {},
) {
  await db
    .update(clientPortals)
    .set({ updatedAt: new Date().toISOString(), ...extra })
    .where(eq(clientPortals.id, portalId));
}

export const portalsRouter = router({
  // ---------- Operator (authenticated) ----------
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: clientPortals.id,
        tripName: clientPortals.tripName,
        status: clientPortals.status,
        leadEmail: clientPortals.leadEmail,
        dueDate: clientPortals.dueDate,
        expiresAt: clientPortals.expiresAt,
        submittedAt: clientPortals.submittedAt,
        createdAt: clientPortals.createdAt,
        clientName: clients.name,
        travelerCount: sql<number>`(
          select count(*)::int from ${portalTravelers}
          where ${portalTravelers.portalId} = ${clientPortals.id}
        )`,
      })
      .from(clientPortals)
      .leftJoin(clients, eq(clientPortals.clientId, clients.id))
      .where(eq(clientPortals.organizationId, ctx.orgId))
      .orderBy(desc(clientPortals.createdAt));
  }),

  // Typeahead for the "link a booking" picker. Only paid/booked proposals in the
  // current org are eligible for a portal; returns just enough to label a row and
  // derive the trip name + lead email on create. Capped so we never load all 100.
  searchBookings: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(proposals.organizationId, ctx.orgId),
        inArray(proposals.status, ['paid', 'booked']),
      ];

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

      const rows = await ctx.db
        .select({
          id: proposals.id,
          name: proposals.name,
          tourTitle: proposals.tourTitle,
          status: proposals.status,
          clientName: clients.name,
          clientEmail: clients.email,
        })
        .from(proposals)
        .leftJoin(clients, eq(proposals.clientId, clients.id))
        .where(and(...conditions))
        .orderBy(desc(proposals.createdAt))
        .limit(20);

      return rows.map((r) => ({
        id: r.id,
        tripName: r.tourTitle || r.name,
        status: r.status,
        clientName: r.clientName,
        clientEmail: r.clientEmail,
      }));
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const portal = await loadOwnedPortal(ctx, input.id);
      const travelerRows = await ctx.db.query.portalTravelers.findMany({
        where: eq(portalTravelers.portalId, portal.id),
        orderBy: [asc(portalTravelers.position), asc(portalTravelers.createdAt)],
      });
      const client = portal.clientId
        ? await ctx.db.query.clients.findFirst({
            where: eq(clients.id, portal.clientId),
            columns: { id: true, name: true, email: true },
          })
        : null;
      const events = await recentAccessEvents(portal.id, 12);
      return {
        ...portal,
        travelers: travelerRows.map(decryptTravelerForView),
        client,
        events,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().optional(),
        clientId: z.string().uuid().optional(),
        tripName: z.string().trim().max(255).optional(),
        leadEmail: z.string().email().max(255).optional().or(z.literal('')),
        welcomeMessage: z.string().max(2000).optional(),
        dueDate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let tripName = input.tripName?.trim() || '';
      let clientId = input.clientId ?? null;
      let leadEmail = input.leadEmail?.trim() || '';

      if (input.proposalId) {
        const proposal = await ctx.db.query.proposals.findFirst({
          where: and(
            eq(proposals.id, input.proposalId),
            eq(proposals.organizationId, ctx.orgId),
          ),
          columns: { id: true, name: true, tourTitle: true, clientId: true },
          with: { client: { columns: { id: true, email: true } } },
        });
        if (!proposal) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Booking not found' });
        }
        if (!tripName) tripName = proposal.tourTitle || proposal.name;
        if (!clientId) clientId = proposal.clientId;
        if (!leadEmail) leadEmail = proposal.client?.email ?? '';
      } else if (clientId && !leadEmail) {
        const client = await ctx.db.query.clients.findFirst({
          where: and(eq(clients.id, clientId), eq(clients.organizationId, ctx.orgId)),
          columns: { email: true },
        });
        leadEmail = client?.email ?? '';
      }

      if (!tripName) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'A trip name is required (or pick a booking to copy it from).',
        });
      }

      const shareToken = randomBytes(24).toString('base64url');
      const expiresAt = new Date(
        Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const [created] = await ctx.db
        .insert(clientPortals)
        .values({
          organizationId: ctx.orgId,
          proposalId: input.proposalId ?? null,
          clientId,
          tripName,
          leadEmail: leadEmail || null,
          welcomeMessage: input.welcomeMessage?.trim() || null,
          dueDate: input.dueDate || null,
          expiresAt,
          shareToken,
        })
        .returning();

      if (!created) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create portal' });
      }
      return created;
    }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        tripName: z.string().trim().min(1).max(255).optional(),
        leadEmail: z.string().email().max(255).nullish().or(z.literal('')),
        welcomeMessage: z.string().max(2000).nullish(),
        dueDate: z.string().nullish(),
        expiresAt: z.string().nullish(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await loadOwnedPortal(ctx, input.id);
      const [updated] = await ctx.db
        .update(clientPortals)
        .set({
          ...(input.tripName !== undefined ? { tripName: input.tripName } : {}),
          ...(input.leadEmail !== undefined
            ? { leadEmail: input.leadEmail ? input.leadEmail.trim().toLowerCase() : null }
            : {}),
          ...(input.welcomeMessage !== undefined
            ? { welcomeMessage: input.welcomeMessage?.trim() || null }
            : {}),
          ...(input.dueDate !== undefined ? { dueDate: input.dueDate || null } : {}),
          ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt || null } : {}),
          updatedAt: new Date().toISOString(),
        })
        .where(and(eq(clientPortals.id, input.id), eq(clientPortals.organizationId, ctx.orgId)))
        .returning();
      return updated;
    }),

  regenerateLink: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const portal = await loadOwnedPortal(ctx, input.id);
      const shareToken = randomBytes(24).toString('base64url');
      // Revoke every active traveler session; the old link is now dead.
      await revokePortalSessions(portal.id);
      const [updated] = await ctx.db
        .update(clientPortals)
        .set({ shareToken, updatedAt: new Date().toISOString() })
        .where(and(eq(clientPortals.id, input.id), eq(clientPortals.organizationId, ctx.orgId)))
        .returning();
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await loadOwnedPortal(ctx, input.id);
      await ctx.db
        .delete(clientPortals)
        .where(and(eq(clientPortals.id, input.id), eq(clientPortals.organizationId, ctx.orgId)));
      return { success: true };
    }),

  // ---------- Client-facing (public) ----------
  // Preview + gated data. The token alone reveals only the trip name and
  // branding; traveler PII is returned only with a valid verified session.
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const portal = await loadPortalByToken(ctx, input.token);
      const organization = await ctx.db.query.organizations.findFirst({
        where: (org, { eq: eqOp }) => eqOp(org.id, portal.organizationId),
        columns: { name: true, logoUrl: true },
      });

      const expired = isPortalExpired(portal);
      const sessionEmail = expired ? null : await getPortalSessionEmail(portal.id);
      const unlocked = !!sessionEmail;

      const base = {
        tripName: portal.tripName,
        welcomeMessage: portal.welcomeMessage,
        status: portal.status,
        dueDate: portal.dueDate,
        expiresAt: portal.expiresAt,
        expired,
        orgName: organization?.name ?? 'Your travel operator',
        orgLogo: organization?.logoUrl ?? null,
        hasLeadEmail: !!portal.leadEmail,
        emailHint: portal.leadEmail ? maskEmail(portal.leadEmail) : null,
        unlocked,
      };

      if (!unlocked) {
        return { ...base, submittedAt: null, sessionEmail: null, travelers: [] as ReturnType<typeof decryptTravelerForView>[] };
      }

      const travelerRows = await ctx.db.query.portalTravelers.findMany({
        where: eq(portalTravelers.portalId, portal.id),
        orderBy: [asc(portalTravelers.position), asc(portalTravelers.createdAt)],
      });
      return {
        ...base,
        submittedAt: portal.submittedAt,
        sessionEmail,
        travelers: travelerRows.map(decryptTravelerForView),
      };
    }),

  addTraveler: publicProcedure
    .input(travelerFieldsSchema.extend({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { token, ...fields } = input;
      const { portal } = await requirePortalSession(ctx, token);

      const countRows = await ctx.db
        .select({ value: sql<number>`count(*)::int` })
        .from(portalTravelers)
        .where(eq(portalTravelers.portalId, portal.id));
      const existingCount = countRows[0]?.value ?? 0;
      if (existingCount >= MAX_TRAVELERS) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `You can add up to ${MAX_TRAVELERS} travelers.`,
        });
      }

      const [created] = await ctx.db
        .insert(portalTravelers)
        .values({
          portalId: portal.id,
          organizationId: portal.organizationId,
          isLead: existingCount === 0,
          position: existingCount,
          fullName: fields.fullName,
          ...encryptTravelerFields(fields),
        })
        .returning();

      await touchPortal(ctx.db, portal.id, {
        status: 'in_progress',
        submittedAt: portal.status === 'submitted' ? null : portal.submittedAt,
      });
      return decryptTravelerForView(created!);
    }),

  updateTraveler: publicProcedure
    .input(travelerFieldsSchema.extend({ token: z.string(), travelerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { token, travelerId, ...fields } = input;
      const { portal } = await requirePortalSession(ctx, token);

      const existing = await ctx.db.query.portalTravelers.findFirst({
        where: and(
          eq(portalTravelers.id, travelerId),
          eq(portalTravelers.portalId, portal.id),
        ),
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Traveler not found' });
      }

      const [updated] = await ctx.db
        .update(portalTravelers)
        .set({
          fullName: fields.fullName,
          ...encryptTravelerFields(fields),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(portalTravelers.id, travelerId))
        .returning();
      await touchPortal(ctx.db, portal.id);
      return decryptTravelerForView(updated!);
    }),

  removeTraveler: publicProcedure
    .input(z.object({ token: z.string(), travelerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { portal } = await requirePortalSession(ctx, input.token);
      await ctx.db
        .delete(portalTravelers)
        .where(
          and(
            eq(portalTravelers.id, input.travelerId),
            eq(portalTravelers.portalId, portal.id),
          ),
        );
      await touchPortal(ctx.db, portal.id);
      return { success: true };
    }),

  submit: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { portal, email } = await requirePortalSession(ctx, input.token);
      const countRows = await ctx.db
        .select({ value: sql<number>`count(*)::int` })
        .from(portalTravelers)
        .where(eq(portalTravelers.portalId, portal.id));
      const travelerCount = countRows[0]?.value ?? 0;
      if (travelerCount === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Add at least one traveler before submitting.',
        });
      }
      await touchPortal(ctx.db, portal.id, {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
      });
      await logPortalEvent(portal.id, 'submitted', { email });

      // Best-effort operator notification: never fail the client's submit if the
      // email can't be sent. Only fires when the org has a notification address.
      try {
        const organization = await ctx.db.query.organizations.findFirst({
          where: eq(organizations.id, portal.organizationId),
          columns: { name: true, slug: true, notificationEmail: true },
        });
        if (organization?.notificationEmail) {
          await sendPortalSubmissionEmail({
            recipientEmail: organization.notificationEmail,
            orgName: organization.name,
            orgSlug: organization.slug,
            tripName: portal.tripName,
            leadEmail: email,
            travelerCount,
            portalUrl: `${env.NEXT_PUBLIC_APP_URL}/portals/${portal.id}`,
            replyTo: email,
          });
        }
      } catch {
        // Swallow: the submission itself succeeded.
      }

      return { success: true };
    }),
});
