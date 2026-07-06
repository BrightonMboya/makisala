import { cookies } from 'next/headers';
import { and, desc, eq, gt } from 'drizzle-orm';
import { db } from '@repo/db';
import {
  clientPortals,
  organizations,
  portalAccessEvents,
  portalSessions,
} from '@repo/db/schema';
import { generateToken, sha256 } from './crypto';

const SESSION_TTL_DAYS = 30;
export const SESSION_TTL_SECONDS = SESSION_TTL_DAYS * 24 * 60 * 60;
export const VERIFICATION_TTL_MS = 15 * 60 * 1000; // magic link / code lifetime
export const MAX_CODE_ATTEMPTS = 6;

export function sessionCookieName(portalId: string) {
  return `portal_sess_${portalId}`;
}

export function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export function requestMeta(req: Request): RequestMeta {
  const fwd = req.headers.get('x-forwarded-for');
  const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
  return { ip, userAgent: req.headers.get('user-agent') || null };
}

/** Load a portal by its public share token (route-handler use, no tRPC). */
export async function getPortalByToken(token: string) {
  const [portal] = await db
    .select()
    .from(clientPortals)
    .where(eq(clientPortals.shareToken, token))
    .limit(1);
  return portal ?? null;
}

export async function getPortalOrg(organizationId: string) {
  const [org] = await db
    .select({ name: organizations.name, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  return org ?? null;
}

export function isPortalExpired(portal: { expiresAt: string | null }): boolean {
  return !!portal.expiresAt && new Date(portal.expiresAt).getTime() < Date.now();
}

/**
 * Read and validate the portal session from the request cookie. Returns the
 * verified email, or null if there's no valid, unexpired session for this
 * portal. Safe to call from tRPC procedures and RSCs.
 */
export async function getPortalSessionEmail(portalId: string): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(sessionCookieName(portalId))?.value;
  if (!raw) return null;
  const [session] = await db
    .select({ email: portalSessions.email })
    .from(portalSessions)
    .where(
      and(
        eq(portalSessions.tokenHash, sha256(raw)),
        eq(portalSessions.portalId, portalId),
        gt(portalSessions.expiresAt, new Date().toISOString()),
      ),
    )
    .limit(1);
  return session?.email ?? null;
}

/** Create a session row and return the raw cookie token to set on the response. */
export async function createPortalSession(
  portalId: string,
  email: string,
  meta: RequestMeta,
): Promise<string> {
  const token = generateToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000).toISOString();
  await db.insert(portalSessions).values({
    portalId,
    email,
    tokenHash: sha256(token),
    ip: meta.ip,
    userAgent: meta.userAgent,
    lastSeenAt: new Date().toISOString(),
    expiresAt,
  });
  return token;
}

/** Revoke every session for a portal (used when the operator regenerates the link). */
export async function revokePortalSessions(portalId: string) {
  await db.delete(portalSessions).where(eq(portalSessions.portalId, portalId));
}

export async function logPortalEvent(
  portalId: string,
  event: string,
  opts: { email?: string | null; meta?: RequestMeta } = {},
) {
  await db.insert(portalAccessEvents).values({
    portalId,
    event,
    email: opts.email ?? null,
    ip: opts.meta?.ip ?? null,
    userAgent: opts.meta?.userAgent ?? null,
  });
}

export async function recentAccessEvents(portalId: string, limit = 10) {
  return db
    .select()
    .from(portalAccessEvents)
    .where(eq(portalAccessEvents.portalId, portalId))
    .orderBy(desc(portalAccessEvents.createdAt))
    .limit(limit);
}
