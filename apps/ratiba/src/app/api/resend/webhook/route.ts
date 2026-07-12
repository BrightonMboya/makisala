import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { db, applyResendWebhookEvent } from '@repo/db';
import { env as resendEnv, verifyResendWebhook } from '@repo/resend';
import { serializeError } from '@/lib/logger';

// Signature verification uses node crypto; keep this off the edge runtime.
export const runtime = 'nodejs';

/**
 * Receives Resend delivery events (sent/delivered/opened/clicked/bounced/etc)
 * and stamps them onto the matching email_messages row. Events for emails we do
 * not track (internal notifications) simply no-op.
 */
export const POST = withAxiom(async (request: AxiomRequest) => {
  // Raw body is required for signature verification.
  const payload = await request.text();

  const secret = resendEnv.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const valid = verifyResendWebhook({
      payload,
      headers: {
        'svix-id': request.headers.get('svix-id'),
        'svix-timestamp': request.headers.get('svix-timestamp'),
        'svix-signature': request.headers.get('svix-signature'),
      },
      secret,
    });
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let event: { type?: string; created_at?: string; data?: { email_id?: string } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event.type;
  const emailId = event.data?.email_id;
  if (typeof type !== 'string' || typeof emailId !== 'string') {
    // Ack malformed/unsupported shapes so Resend doesn't retry forever.
    return NextResponse.json({ received: true });
  }

  try {
    await applyResendWebhookEvent(db, {
      type,
      emailId,
      occurredAt: event.created_at ?? null,
    });
  } catch (error) {
    request.log.error('Failed to apply Resend webhook event', {
      type,
      emailId,
      error: serializeError(error),
    });
    // 500 tells Resend to retry, which is what we want on a transient DB error.
    return NextResponse.json({ error: 'Failed to process event' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
});
