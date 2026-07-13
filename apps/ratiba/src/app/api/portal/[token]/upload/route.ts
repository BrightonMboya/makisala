import { NextResponse } from 'next/server';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { and, eq } from 'drizzle-orm';
import { db } from '@repo/db';
import { portalTravelers } from '@repo/db/schema';
import { r2 } from '@/lib/storage';
import { env } from '@/lib/env';
import { encryptBytes, generateToken } from '@/lib/portal/crypto';
import {
  getPortalByToken,
  getPortalSessionEmail,
  isPortalExpired,
  logPortalEvent,
  requestMeta,
} from '@/lib/portal/session';
import { log } from '@/lib/logger';

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

/**
 * Detect the real file type from magic bytes. The declared `file.type` is
 * client-controlled, so we never trust it alone: a mismatch means the upload is
 * spoofed and we reject it. Only the four types we serve back are recognized.
 */
function sniffMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  // RIFF....WEBP
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 5 && buf.toString('ascii', 0, 5) === '%PDF-') {
    return 'application/pdf';
  }
  return null;
}

export async function POST(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const portal = await getPortalByToken(token);
  if (!portal || isPortalExpired(portal)) {
    return NextResponse.json({ ok: false, error: 'Portal not available' }, { status: 410 });
  }

  // Gate: must hold a valid verified session for this portal.
  const email = await getPortalSessionEmail(portal.id);
  if (!email) {
    return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file');
  const travelerId = String(form.get('travelerId') ?? '');
  if (!(file instanceof File) || !travelerId) {
    return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'File must be under 10MB.' }, { status: 400 });
  }

  const [traveler] = await db
    .select()
    .from(portalTravelers)
    .where(and(eq(portalTravelers.id, travelerId), eq(portalTravelers.portalId, portal.id)))
    .limit(1);
  if (!traveler) {
    return NextResponse.json({ ok: false, error: 'Traveler not found' }, { status: 404 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  // Authoritative type check: trust the file's actual signature, not the
  // client-declared MIME. A spoofed upload (e.g. HTML claiming image/png) is
  // rejected here rather than being stored and served back later.
  const detectedMime = sniffMime(bytes);
  if (!detectedMime || !ALLOWED.has(detectedMime)) {
    return NextResponse.json(
      { ok: false, error: 'Use a JPG, PNG, WebP or PDF.' },
      { status: 400 },
    );
  }

  try {
    const encrypted = encryptBytes(bytes);
    const key = `portal-scans/${portal.organizationId}/${travelerId}/${generateToken(8)}.enc`;

    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: encrypted,
        ContentType: 'application/octet-stream',
      }),
    );

    // Remove the previous scan if one existed.
    if (traveler.passportScanKey) {
      await r2
        .send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: traveler.passportScanKey }))
        .catch(() => undefined);
    }

    await db
      .update(portalTravelers)
      .set({
        passportScanKey: key,
        // Strip control chars / path separators from the client-supplied name so
        // it can't be abused when echoed into the download's Content-Disposition.
        passportScanName: file.name.replace(/[\r\n"\\/]/g, '').slice(0, 200) || 'passport',
        passportScanMime: detectedMime,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(portalTravelers.id, travelerId));

    await logPortalEvent(portal.id, 'scan_uploaded', { email, meta: requestMeta(req) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error('portal scan upload failed', {
      portalId: portal.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }
}
