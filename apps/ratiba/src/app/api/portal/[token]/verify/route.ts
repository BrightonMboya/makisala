import { NextResponse } from 'next/server';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalVerifications } from '@repo/db/schema';
import { env } from '@/lib/env';
import { sha256 } from '@/lib/portal/crypto';
import {
  createPortalSession,
  getPortalByToken,
  isPortalExpired,
  logPortalEvent,
  requestMeta,
  sessionCookieName,
  sessionCookieOptions,
  SESSION_TTL_SECONDS,
} from '@/lib/portal/session';

// Magic-link entry point. Clicking the link in the email lands here, we mint a
// session, set the cookie, and bounce the traveler into the portal.
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const url = new URL(req.url);
  const linkToken = url.searchParams.get('c') ?? '';
  const portalUrl = `${env.NEXT_PUBLIC_APP_URL}/portal/${token}`;

  const portal = await getPortalByToken(token);
  if (!portal || isPortalExpired(portal) || !linkToken) {
    return NextResponse.redirect(`${portalUrl}?e=link`);
  }

  const now = new Date().toISOString();
  const [verification] = await db
    .select()
    .from(portalVerifications)
    .where(
      and(
        eq(portalVerifications.portalId, portal.id),
        eq(portalVerifications.linkTokenHash, sha256(linkToken)),
        isNull(portalVerifications.consumedAt),
        gt(portalVerifications.expiresAt, now),
      ),
    )
    .orderBy(desc(portalVerifications.createdAt))
    .limit(1);

  if (!verification) {
    await logPortalEvent(portal.id, 'failed', { meta: requestMeta(req) });
    return NextResponse.redirect(`${portalUrl}?e=link`);
  }

  await db
    .update(portalVerifications)
    .set({ consumedAt: now })
    .where(eq(portalVerifications.id, verification.id));

  const meta = requestMeta(req);
  const sessionToken = await createPortalSession(portal.id, verification.email, meta);
  await logPortalEvent(portal.id, 'verified', { email: verification.email, meta });

  const res = NextResponse.redirect(portalUrl);
  res.cookies.set(
    sessionCookieName(portal.id),
    sessionToken,
    sessionCookieOptions(SESSION_TTL_SECONDS),
  );
  return res;
}
