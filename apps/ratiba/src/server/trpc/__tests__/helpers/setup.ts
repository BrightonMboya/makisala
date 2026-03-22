/**
 * Global preload for all tRPC tests.
 * Mocks external modules so router imports don't fail.
 */
import { mock } from 'bun:test';

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
  deleteFromStorage: () => Promise.resolve(),
  listStorageFolders: () => Promise.resolve([]),
  listStorageImages: () => Promise.resolve([]),
  getPublicUrl: (bucket: string, key: string) => `https://r2.test.com/${key}`,
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
mock.module('@repo/resend', () => ({
  sendCommentNotificationEmail: () => Promise.resolve({ success: true }),
  sendProposalShareEmail: () => Promise.resolve({ success: true }),
  sendProposalAcceptanceEmail: () => Promise.resolve({ success: true }),
  sendTeamInvitationEmail: () => Promise.resolve({ success: true }),
  sendEmailVerificationEmail: () => Promise.resolve({ success: true }),
  sendNoteMentionEmail: () => Promise.resolve({ success: true }),
}));

// ── @repo/db ── (only the db export used by init.ts)
mock.module('@repo/db', () => {
  // Provide a minimal db stub for createContext; tests inject their own mock via ctx.db
  return {
    db: new Proxy({}, {
      get() {
        return () => new Proxy({}, { get() { return () => ({}); } });
      },
    }),
    // Re-export schema tables as empty stubs — the real schema tables
    // are imported from @repo/db/schema which doesn't need mocking
    // (they're just column definitions, not runtime dependencies)
  };
});
