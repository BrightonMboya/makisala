import { NextResponse } from 'next/server';
import { and, eq, gt } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalVerifications } from '@repo/db/schema';
import { sendPortalAccessEmail } from '@repo/resend';
import { env } from '@/lib/env';
import { generateCode, generateToken, sha256 } from '@/lib/portal/crypto';
import {
  getPortalByToken,
  getPortalOrg,
  isPortalExpired,
  logPortalEvent,
  requestMeta,
  VERIFICATION_TTL_MS,
} from '@/lib/portal/session';
import { log } from '@/lib/logger';

const MAX_REQUESTS_PER_WINDOW = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const meta = requestMeta(req);

  let email = '';
  try {
    const body = (await req.json()) as { email?: string };
    email = (body.email ?? '').trim().toLowerCase();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email.' }, { status: 400 });
  }

  const portal = await getPortalByToken(token);
  if (!portal || isPortalExpired(portal)) {
    // Generic response: don't reveal whether a token is valid.
    return NextResponse.json({ ok: true });
  }

  // Rate limit: cap verification requests per portal per window.
  const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
  const recent = await db
    .select({ id: portalVerifications.id })
    .from(portalVerifications)
    .where(
      and(
        eq(portalVerifications.portalId, portal.id),
        gt(portalVerifications.createdAt, windowStart),
      ),
    );
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    await logPortalEvent(portal.id, 'rate_limited', { email, meta });
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Please wait a few minutes and try again.' },
      { status: 429 },
    );
  }

  // Only send if the email matches the authorized lead. Respond generically
  // either way so the endpoint can't be used to probe who's on a booking.
  const authorized =
    !!portal.leadEmail && portal.leadEmail.trim().toLowerCase() === email;

  if (!authorized) {
    await logPortalEvent(portal.id, 'failed', { email, meta });
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  const linkToken = generateToken(32);
  const expiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();

  await db.insert(portalVerifications).values({
    portalId: portal.id,
    email,
    codeHash: sha256(code),
    linkTokenHash: sha256(linkToken),
    expiresAt,
  });

  const org = await getPortalOrg(portal.organizationId);
  const magicLink = `${env.NEXT_PUBLIC_APP_URL}/api/portal/${token}/verify?c=${linkToken}`;

  const result = await sendPortalAccessEmail({
    clientEmail: email,
    orgName: org?.name ?? 'Your travel operator',
    orgSlug: org?.slug ?? null,
    tripName: portal.tripName,
    code,
    magicLink,
  });

  if (!result.success) {
    log.error('portal access email failed', { portalId: portal.id, error: result.error });
    return NextResponse.json(
      { ok: false, error: 'Could not send the email. Please try again.' },
      { status: 502 },
    );
  }

  await logPortalEvent(portal.id, 'code_requested', { email, meta });
  return NextResponse.json({ ok: true });
}
