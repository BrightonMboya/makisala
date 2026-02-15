import type { db as _dbType } from '@repo/db';
import { createMockDb, type MockDb } from './mock-db';

type Db = typeof _dbType;

const DEFAULT_USER = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@example.com',
  image: null,
  emailVerified: true,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-01-01T00:00:00.000Z'),
};

const DEFAULT_ORG_ID = 'org-1';

/**
 * Create a public (unauthenticated) context.
 * Used for publicProcedure tests.
 */
export function createPublicContext() {
  const db = createMockDb();
  return {
    ctx: { session: null, db: db as unknown as Db },
    db,
  };
}

/**
 * Create a protected (authenticated) context.
 * Sets activeOrganizationId so the middleware skips the DB lookup for orgId.
 */
export function createProtectedContext(opts?: {
  user?: Partial<typeof DEFAULT_USER>;
  orgId?: string;
}) {
  const db = createMockDb();
  const user = { ...DEFAULT_USER, ...opts?.user };
  const orgId = opts?.orgId ?? DEFAULT_ORG_ID;

  return {
    ctx: {
      session: {
        user,
        session: { activeOrganizationId: orgId },
      },
      db: db as unknown as Db,
      user,
      orgId,
    },
    db,
  };
}

/**
 * Create an admin context.
 * Same as protected, but pre-configures the DB to return admin role
 * for the adminProcedure middleware check.
 */
export function createAdminContext(opts?: {
  user?: Partial<typeof DEFAULT_USER>;
  orgId?: string;
}) {
  const { ctx, db } = createProtectedContext(opts);

  // Queue the admin role result for the first select call (admin middleware check).
  // Subsequent select calls will fall through to whatever the test sets via _results.
  db._resultsQueue.set('select', [[{ role: 'admin' }]]);

  return { ctx, db };
}

export type { MockDb };
