import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { invoices, linkViews, proposals } from '@repo/db/schema';
import { generateToken } from '@/lib/portal/crypto';
import { isLikelyBot, parseUserAgent } from '@/lib/tracking/user-agent';
import { VIEW_SESSION_COOKIE, viewSessionCookieOptions } from '@/lib/tracking/session';
import { decodeCityHeader } from '@/lib/tracking/geo';
import { isOwnOrgViewer } from '@/lib/tracking/internal-viewer';
import { log, serializeError } from '@/lib/logger';

const bodySchema = z.object({
  kind: z.enum(['proposal', 'invoice']),
  id: z.string(),
  format: z.enum(['html', 'pdf']).default('html'),
  referrer: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const { kind, id, format, referrer } = parsed.data;

  const userAgent = req.headers.get('user-agent');
  if (isLikelyBot(userAgent)) {
    return NextResponse.json({ viewId: null });
  }

  // Re-derive organizationId server-side rather than trusting the client, so
  // a tampered request can't attribute a fake view to another org.
  const subject =
    kind === 'proposal'
      ? await db.query.proposals.findFirst({
          where: eq(proposals.id, id),
          columns: { organizationId: true },
        })
      : await db.query.invoices.findFirst({
          where: eq(invoices.id, id),
          columns: { organizationId: true },
        });

  if (!subject) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Staff previewing their own org's link shouldn't count as a client view.
  if (await isOwnOrgViewer(subject.organizationId)) {
    return NextResponse.json({ viewId: null });
  }

  // Tracking is best-effort: a DB hiccup here must never surface as an error
  // to the caller, since ViewBeacon fires on every real page load.
  try {
    const store = await cookies();
    const existingSessionId = store.get(VIEW_SESSION_COOKIE)?.value ?? null;
    const sessionId = existingSessionId ?? generateToken(16);

    const fwd = req.headers.get('x-forwarded-for');
    const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const { device, browser } = parseUserAgent(userAgent);

    const [view] = await db
      .insert(linkViews)
      .values({
        organizationId: subject.organizationId,
        proposalId: kind === 'proposal' ? id : null,
        invoiceId: kind === 'invoice' ? id : null,
        format,
        sessionId,
        ip,
        country: req.headers.get('x-vercel-ip-country'),
        region: req.headers.get('x-vercel-ip-country-region'),
        city: decodeCityHeader(req.headers.get('x-vercel-ip-city')),
        device,
        browser,
        referrer: referrer || null,
      })
      .returning({ id: linkViews.id });

    if (!view) {
      return NextResponse.json({ viewId: null });
    }

    const res = NextResponse.json({ viewId: view.id });
    if (!existingSessionId) {
      res.cookies.set(VIEW_SESSION_COOKIE, sessionId, viewSessionCookieOptions());
    }
    return res;
  } catch (error) {
    log.error('Failed to record link view', { kind, id, error: serializeError(error) });
    return NextResponse.json({ viewId: null });
  }
}
