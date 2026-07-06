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

    return new NextResponse(new Uint8Array(decrypted), {
      status: 200,
      headers: {
        'Content-Type': traveler.passportScanMime ?? 'application/octet-stream',
        'Content-Disposition': `inline; filename="${(traveler.passportScanName ?? 'passport').replace(/"/g, '')}"`,
        'Cache-Control': 'private, no-store',
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
