import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { and, eq } from 'drizzle-orm';
import { db, member } from '@repo/db';
import { proposals } from '@repo/db/schema';
import { r2 } from '@/lib/storage';
import { env } from '@/lib/env';
import { auth } from '@/lib/auth';
import { log } from '@/lib/logger';

// Per-file cap. Resend's total message ceiling is ~40MB; the proposal PDF and
// any other attachments share that budget, so keep a single file well under it.
const MAX_BYTES = 15 * 1024 * 1024;

// Attachment types an operator realistically sends a client: the proposal PDF,
// scanned forms, photos, and Office documents (invoices, vouchers). The value is
// the Content-Type we store and hand to Resend.
const ALLOWED: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

/**
 * Validate the file's actual signature against its extension. The client-declared
 * MIME is never trusted: a spoofed upload (e.g. a script renamed to .pdf) is
 * rejected here rather than stored and later served/attached.
 *
 * Returns the extension when the magic bytes match a type we accept, else null.
 * Office files are all ZIP containers (PK\x03\x04), so we can't tell docx from
 * xlsx by bytes alone; for those we trust the extension once the ZIP header is
 * confirmed.
 */
function verifiedExtension(buf: Buffer, ext: string): string | null {
  if (!(ext in ALLOWED)) return null;

  const startsWith = (...bytes: number[]) =>
    buf.length >= bytes.length && bytes.every((b, i) => buf[i] === b);
  const ascii = (start: number, end: number) => buf.toString('ascii', start, end);

  switch (ext) {
    case 'pdf':
      return ascii(0, 5) === '%PDF-' ? ext : null;
    case 'jpg':
    case 'jpeg':
      return startsWith(0xff, 0xd8, 0xff) ? ext : null;
    case 'png':
      return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) ? ext : null;
    case 'webp':
      return buf.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP' ? ext : null;
    case 'gif':
      return ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a' ? ext : null;
    case 'docx':
    case 'xlsx':
    case 'pptx':
      // ZIP local file header. Extension disambiguates the OOXML subtype.
      return startsWith(0x50, 0x4b, 0x03, 0x04) ? ext : null;
    default:
      return null;
  }
}

async function getOrganizationId(
  session: Awaited<ReturnType<typeof auth.api.getSession>>,
): Promise<string | null> {
  if (!session?.user?.id) return null;
  if (session.session?.activeOrganizationId) {
    return session.session.activeOrganizationId as string;
  }
  const [membership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);
  return membership?.organizationId ?? null;
}

// Confirm the caller owns the proposal (via their org). Returns the org id so
// uploaded keys stay namespaced to it. Null means unauthorized / not found.
async function authorizeProposal(
  req: Request,
  proposalId: string,
): Promise<string | null> {
  const session = await auth.api.getSession({ headers: req.headers });
  const orgId = await getOrganizationId(session);
  if (!orgId) return null;

  const proposal = await db.query.proposals.findFirst({
    where: and(eq(proposals.id, proposalId), eq(proposals.organizationId, orgId)),
    columns: { id: true },
  });
  return proposal ? orgId : null;
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: proposalId } = await ctx.params;
  const orgId = await authorizeProposal(req, proposalId);
  if (!orgId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: 'Missing file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'File must be under 15MB.' },
      { status: 400 },
    );
  }

  const ext = (file.name.split('.').pop() || '').toLowerCase();
  const bytes = Buffer.from(await file.arrayBuffer());
  const verified = verifiedExtension(bytes, ext);
  if (!verified) {
    return NextResponse.json(
      { ok: false, error: 'Use a PDF, image, or Office document (docx/xlsx/pptx).' },
      { status: 400 },
    );
  }

  const contentType = ALLOWED[verified]!;
  // Strip control chars / path separators from the client-supplied name so it is
  // safe to echo into Content-Disposition when Resend attaches it.
  const safeName = file.name.replace(/[\r\n"\\/]/g, '').slice(0, 200) || `attachment.${verified}`;
  const key = `proposal-attachments/${orgId}/${proposalId}/${randomUUID()}-${safeName}`;

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: key,
        Body: bytes,
        ContentType: contentType,
      }),
    );
  } catch (error) {
    log.error('proposal attachment upload failed', {
      proposalId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Upload failed' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    attachment: { key, filename: safeName, size: file.size, contentType },
  });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: proposalId } = await ctx.params;
  const orgId = await authorizeProposal(req, proposalId);
  if (!orgId) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { key } = (await req.json().catch(() => ({}))) as { key?: string };
  // Only allow deleting objects inside this proposal's own namespace, so a caller
  // can't delete another proposal's or org's files by passing an arbitrary key.
  const prefix = `proposal-attachments/${orgId}/${proposalId}/`;
  if (!key || !key.startsWith(prefix)) {
    return NextResponse.json({ ok: false, error: 'Invalid key' }, { status: 400 });
  }

  try {
    await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  } catch (error) {
    log.error('proposal attachment delete failed', {
      proposalId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ ok: false, error: 'Delete failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
