import { createHmac, timingSafeEqual } from 'node:crypto';

export interface VerifyResendWebhookInput {
  /** Raw, unparsed request body. */
  payload: string;
  headers: {
    'svix-id'?: string | null;
    'svix-timestamp'?: string | null;
    'svix-signature'?: string | null;
  };
  /** The Svix signing secret (whsec_...). */
  secret: string;
  /** Max allowed clock skew in seconds; defaults to 5 minutes. */
  toleranceSeconds?: number;
}

/**
 * Verifies a Resend webhook signature. Resend signs webhooks with Svix, so the
 * scheme is: signedContent = `${svix-id}.${svix-timestamp}.${body}`, signature =
 * base64(HMAC-SHA256(secretBytes, signedContent)), where secretBytes is the
 * base64-decoded portion of the secret after the `whsec_` prefix. The
 * svix-signature header is a space-delimited list of `v1,<sig>` entries.
 */
export function verifyResendWebhook(input: VerifyResendWebhookInput): boolean {
  const id = input.headers['svix-id'];
  const timestamp = input.headers['svix-timestamp'];
  const signatureHeader = input.headers['svix-signature'];
  if (!id || !timestamp || !signatureHeader) return false;

  // Reject stale timestamps to blunt replay attacks.
  const tolerance = input.toleranceSeconds ?? 5 * 60;
  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > tolerance) return false;

  const secretBytes = Buffer.from(input.secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${id}.${timestamp}.${input.payload}`;
  const expected = createHmac('sha256', secretBytes).update(signedContent).digest('base64');
  const expectedBuf = Buffer.from(expected);

  // Header can carry multiple space-delimited "v1,<sig>" versions; accept any match.
  return signatureHeader.split(' ').some((entry) => {
    const sig = entry.includes(',') ? entry.split(',')[1] : entry;
    if (!sig) return false;
    const sigBuf = Buffer.from(sig);
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
}
