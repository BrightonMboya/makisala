/**
 * Global preload for all tRPC tests.
 * Mocks external modules so router imports don't fail.
 */
import { mock } from 'bun:test';
import * as realDb from '@repo/db';
import * as realResend from '@repo/resend';

// ── next/headers ──
mock.module('next/headers', () => ({
  headers: () => Promise.resolve(new Headers()),
  cookies: () => Promise.resolve({ get: () => undefined, set: () => {} }),
}));

// ── @/lib/env ──
mock.module('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_SERVICE_KEY: 'test-key',
    R2_ACCESS_KEY_ID: 'test',
    R2_SECRET_ACCESS_KEY: 'test',
    R2_ACCOUNT_ID: 'test',
    R2_BUCKET_NAME: 'test-bucket',
    R2_PUBLIC_URL: 'https://r2.test.com',
    RESEND_FROM_EMAIL: 'noreply@test.com',
    PORTAL_ENCRYPTION_KEY: 'test-portal-encryption-key-32bytes!!',
    GOOGLE_CLIENT_ID: 'test',
    GOOGLE_CLIENT_SECRET: 'test',
    POLAR_ACCESS_TOKEN: 'test',
    POLAR_PRODUCT_ID: 'test',
    POLAR_STARTER_PRODUCT_ID: 'test',
    POLAR_BUSINESS_PRODUCT_ID: 'test',
    POLAR_WEBHOOK_SECRET: 'test',
    POLAR_SERVER_MODE: 'sandbox',
  },
}));

// ── @/lib/auth ──
mock.module('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: () => Promise.resolve(null),
      createInvitation: () => Promise.resolve({ id: 'inv-1' }),
      cancelInvitation: () => Promise.resolve(),
      removeMember: () => Promise.resolve(),
      updateMemberRole: () => Promise.resolve(),
      acceptInvitation: () => Promise.resolve(),
      setActiveOrganization: () => Promise.resolve(),
    },
  },
}));

// ── @/lib/storage ──
mock.module('@/lib/storage', () => ({
  uploadToStorage: () =>
    Promise.resolve({ bucket: 'test-bucket', key: 'test-key', publicUrl: 'https://r2.test.com/test-key' }),
  uploadPdfToStorage: () =>
    Promise.resolve({ bucket: 'test-bucket', key: 'test-key.pdf', publicUrl: 'https://r2.test.com/test-key.pdf' }),
  putPdfObject: () => Promise.resolve(),
  getPdfObject: () => Promise.resolve(Buffer.from('pdf')),
  getSignedUploadUrl: () => Promise.resolve('https://r2.test.com/signed-upload'),
  getSignedDownloadUrl: () => Promise.resolve('https://r2.test.com/signed-download'),
  deleteFromStorage: () => Promise.resolve(),
  listStorageFolders: () => Promise.resolve([]),
  listStorageImages: () => Promise.resolve([]),
  getPublicUrl: (bucket: string, key: string) => `https://r2.test.com/${key}`,
  ALLOWED_UPLOAD_CONTENT_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  r2: {},
}));

// ── @/lib/image-utils ──
mock.module('@/lib/image-utils', () => ({
  compressImage: () =>
    Promise.resolve({
      buffer: Buffer.from('compressed'),
      contentType: 'image/webp',
      extension: '.webp',
    }),
  replaceExtension: (filename: string, ext: string) => {
    const dotIndex = filename.lastIndexOf('.');
    return dotIndex >= 0 ? filename.slice(0, dotIndex) + ext : filename + ext;
  },
}));

// ── @/lib/plans ──
mock.module('@/lib/plans', () => ({
  checkFeatureAccess: () => Promise.resolve({ allowed: true }),
  getOrgPlan: () =>
    Promise.resolve({
      tier: 'pro',
      effectiveTier: 'pro',
      isTrialing: false,
      trialEndsAt: null,
      trialDaysRemaining: null,
      limits: {},
    }),
  PLAN_CONFIG: {},
  ALLOWED_THEMES_BY_TIER: {
    free: ['minimalistic'],
    starter: ['minimalistic', 'modern'],
    pro: ['minimalistic', 'modern', 'classic', 'luxury'],
    business: ['minimalistic', 'modern', 'classic', 'luxury'],
  },
  TIER_ORDER: ['free', 'starter', 'pro', 'business'],
}));

// ── @repo/resend ──
// Keep the real module but stub every send* so no test hits the network.
// Deriving stubs from the real exports covers newly added send* automatically.
mock.module('@repo/resend', () => {
  const stubbed: Record<string, unknown> = { ...realResend };
  for (const key of Object.keys(realResend)) {
    if (key.startsWith('send')) {
      stubbed[key] = () => Promise.resolve({ success: true });
    }
  }
  stubbed.resend = {};
  return stubbed;
});

// Keep every real export and override only `db`, so createContext never touches
// a real connection. Tests inject their own db via ctx.db.
mock.module('@repo/db', () => ({
  ...realDb,
  db: new Proxy(
    {},
    {
      get() {
        return () => new Proxy({}, { get() { return () => ({}); } });
      },
    },
  ),
}));
