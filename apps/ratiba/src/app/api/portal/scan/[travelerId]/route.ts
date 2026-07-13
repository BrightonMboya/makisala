import { NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { and, eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalTravelers, member } from '@repo/db/schema';
import { auth } from '@/lib/auth';
import { r2 } from '@/lib/storage';
import { env } from '@/lib/env';
import { decryptBytes } from '@/lib/portal/crypto';
import { log } from '@/lib/logger';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

// Operator-only: streams a decrypted passport scan. Auth is the operator's
// session; the traveler's org must be one the operator belongs to.
export async function GET(req: Request, ctx: { params: Promise<{ travelerId: string }> }) {
  const { travelerId } = await ctx.params;

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [traveler] = await db
    .select()
    .from(portalTravelers)
    .where(eq(portalTravelers.id, travelerId))
    .limit(1);
  if (!traveler || !traveler.passportScanKey) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const [membership] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(eq(member.userId, session.user.id), eq(member.organizationId, traveler.organizationId)),
    )
    .limit(1);
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: traveler.passportScanKey }),
    );
    const encrypted = Buffer.from(await obj.Body!.transformToByteArray());
    const decrypted = decryptBytes(encrypted);

    // Only serve back a known-safe content type; anything unexpected is forced to
    // a download rather than rendered inline. nosniff stops the browser from
    // re-interpreting the bytes as something executable (e.g. HTML).
    const mime =
      traveler.passportScanMime && ALLOWED_MIME.has(traveler.passportScanMime)
        ? traveler.passportScanMime
        : 'application/octet-stream';
    const filename = (traveler.passportScanName ?? 'passport').replace(/[\r\n"\\/]/g, '');
    const disposition = mime === 'application/octet-stream' ? 'attachment' : 'inline';

    return new NextResponse(new Uint8Array(decrypted), {
      status: 200,
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `${disposition}; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        'Referrer-Policy': 'no-referrer',
      },
    });
  } catch (error) {
    log.error('portal scan download failed', {
      travelerId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: 'Failed to load scan' }, { status: 500 });
  }
}
