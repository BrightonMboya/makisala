import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';
import { env } from '@/lib/env';

// AES-256-GCM at-rest encryption for client-portal PII (passport numbers, DOB,
// health notes) and passport scan bytes. The operator reads this data, so we use
// reversible symmetric encryption with a server-held key rather than hashing.
// Threat covered: a leaked DB dump or leaked R2 object yields ciphertext, not
// plaintext passports. Key lives only in the server env (PORTAL_ENCRYPTION_KEY).

const FIELD_PREFIX = 'enc:v1:';

function deriveKey(raw: string): Buffer {
  // Accept a base64 or hex 32-byte key directly; otherwise derive a stable
  // 32-byte key by hashing whatever was provided. Hashing lets a longer
  // passphrase work while still yielding a valid AES-256 key.
  const tryDecode = (encoding: 'base64' | 'hex') => {
    try {
      const buf = Buffer.from(raw, encoding);
      return buf.length === 32 ? buf : null;
    } catch {
      return null;
    }
  };
  return tryDecode('base64') ?? tryDecode('hex') ?? createHash('sha256').update(raw).digest();
}

const KEY = deriveKey(env.PORTAL_ENCRYPTION_KEY);

/** Encrypt a string field. Empty/nullish passes through as null. Idempotent-safe. */
export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null) return null;
  if (plain === '') return null;
  if (plain.startsWith(FIELD_PREFIX)) return plain; // already encrypted
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return FIELD_PREFIX + Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

/** Decrypt a field. Legacy plaintext (no prefix) is returned unchanged. */
export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith(FIELD_PREFIX)) return value; // legacy / unencrypted
  try {
    const raw = Buffer.from(value.slice(FIELD_PREFIX.length), 'base64');
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const ciphertext = raw.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

/** Encrypt arbitrary bytes (passport scans). Returns iv|tag|ciphertext. */
export function encryptBytes(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]);
}

export function decryptBytes(blob: Buffer): Buffer {
  const iv = blob.subarray(0, 12);
  const tag = blob.subarray(12, 28);
  const ciphertext = blob.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** SHA-256 hex. Used to store one-time codes / session tokens without plaintext. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Constant-time compare of two hex digests. */
export function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

/** URL-safe opaque token (session tokens, magic-link tokens). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** 6-digit numeric one-time code, zero-padded, cryptographically random. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

/** Mask an email for display: jane.doe@gmail.com -> j••••e@gmail.com */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '•••';
  const first = local[0] ?? '';
  const last = local.length > 1 ? local[local.length - 1] : '';
  return `${first}${'•'.repeat(Math.max(1, local.length - 2))}${last}@${domain}`;
}
