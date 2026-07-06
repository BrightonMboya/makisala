import { NextResponse } from 'next/server';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalVerifications } from '@repo/db/schema';
import { safeEqualHex, sha256 } from '@/lib/portal/crypto';
import {
  createPortalSession,
  getPortalByToken,
  isPortalExpired,
  logPortalEvent,
  MAX_CODE_ATTEMPTS,
  requestMeta,
  sessionCookieName,
  sessionCookieOptions,
  SESSION_TTL_SECONDS,
} from '@/lib/portal/session';

// 6-digit code fallback (for travelers who can't click the magic link).
export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const meta = requestMeta(req);

  let code = '';
  try {
    const body = (await req.json()) as { code?: string };
    code = (body.code ?? '').trim();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'Enter the 6-digit code.' }, { status: 400 });
  }

  const portal = await getPortalByToken(token);
  if (!portal || isPortalExpired(portal)) {
    return NextResponse.json({ ok: false, error: 'This link is no longer valid.' }, { status: 410 });
  }

  const now = new Date().toISOString();
  const [verification] = await db
    .select()
    .from(portalVerifications)
    .where(
      and(
        eq(portalVerifications.portalId, portal.id),
        isNull(portalVerifications.consumedAt),
        gt(portalVerifications.expiresAt, now),
      ),
    )
    .orderBy(desc(portalVerifications.createdAt))
    .limit(1);

  if (!verification) {
    return NextResponse.json(
      { ok: false, error: 'Your code expired. Request a new one.' },
      { status: 400 },
    );
  }

  if (verification.attempts >= MAX_CODE_ATTEMPTS) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Request a new code.' },
      { status: 429 },
    );
  }

  if (!safeEqualHex(sha256(code), verification.codeHash)) {
    await db
      .update(portalVerifications)
      .set({ attempts: verification.attempts + 1 })
      .where(eq(portalVerifications.id, verification.id));
    await logPortalEvent(portal.id, 'failed', { email: verification.email, meta });
    return NextResponse.json({ ok: false, error: 'Incorrect code.' }, { status: 400 });
  }

  await db
    .update(portalVerifications)
    .set({ consumedAt: now })
    .where(eq(portalVerifications.id, verification.id));

  const sessionToken = await createPortalSession(portal.id, verification.email, meta);
  await logPortalEvent(portal.id, 'verified', { email: verification.email, meta });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(
    sessionCookieName(portal.id),
    sessionToken,
    sessionCookieOptions(SESSION_TTL_SECONDS),
  );
  return res;
}
