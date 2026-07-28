import { NextResponse } from 'next/server';
import { z } from 'zod';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { linkViews } from '@repo/db/schema';
import { VIEW_SESSION_COOKIE } from '@/lib/tracking/session';

const bodySchema = z.object({
  viewId: z.string().uuid(),
  // Clamped to 6h so a stuck/backgrounded tab can't report nonsense durations.
  durationSeconds: z.number().int().min(0).max(60 * 60 * 6),
});

// navigator.sendBeacon only supports POST, so page-unload duration reports
// land here rather than as a PATCH on the view-creation route.
export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = JSON.parse(await req.text());
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const store = await cookies();
  const sessionId = store.get(VIEW_SESSION_COOKIE)?.value;
  if (!sessionId) {
    return NextResponse.json({ error: 'No session' }, { status: 400 });
  }

  // sessionId match keeps a visitor from patching someone else's view row.
  await db
    .update(linkViews)
    .set({ durationSeconds: parsed.data.durationSeconds })
    .where(and(eq(linkViews.id, parsed.data.viewId), eq(linkViews.sessionId, sessionId)));

  return NextResponse.json({ ok: true });
}
