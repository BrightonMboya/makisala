import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalSessions } from '@repo/db/schema';
import { sha256 } from '@/lib/portal/crypto';
import { getPortalByToken, sessionCookieName } from '@/lib/portal/session';

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const portal = await getPortalByToken(token);
  if (portal) {
    const cookieName = sessionCookieName(portal.id);
    const raw = req.headers
      .get('cookie')
      ?.split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith(`${cookieName}=`))
      ?.slice(cookieName.length + 1);
    if (raw) {
      await db
        .delete(portalSessions)
        .where(
          and(eq(portalSessions.portalId, portal.id), eq(portalSessions.tokenHash, sha256(raw))),
        );
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
    return res;
  }
  return NextResponse.json({ ok: true });
}
