import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../init';
import { appRouter } from '../router';
import { escapeLikeQuery } from '../init';
import { createPublicContext, createProtectedContext, createAdminContext } from './helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('escapeLikeQuery', () => {
  test('escapes percent sign', () => {
    expect(escapeLikeQuery('50%')).toBe('50\\%');
  });

  test('escapes underscore', () => {
    expect(escapeLikeQuery('hello_world')).toBe('hello\\_world');
  });

  test('escapes backslash', () => {
    expect(escapeLikeQuery('path\\to')).toBe('path\\\\to');
  });

  test('returns plain text unchanged', () => {
    expect(escapeLikeQuery('hello world')).toBe('hello world');
  });

  test('escapes multiple special characters', () => {
    expect(escapeLikeQuery('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});

describe('search endpoints escape special characters', () => {
  test('clients.list escapes percent in query', async () => {
    const { ctx, db } = createProtectedContext();
    const caller = createCaller(ctx);

    db._results.set('select', []);

    await caller.clients.list({ query: '50%' });

    // Find the where call to verify the escaped value reached the DB
    const whereCall = db._calls.find((c) => c.method === 'select.where');
    expect(whereCall).toBeDefined();
    // Bun.inspect escapes backslashes in its output, so a literal `\%` appears as `\\%`
    const whereArgs = Bun.inspect(whereCall!.args);
    expect(whereArgs).toContain('50\\\\%');
  });

  test('clients.list escapes underscore in query', async () => {
    const { ctx, db } = createProtectedContext();
    const caller = createCaller(ctx);

    db._results.set('select', []);

    await caller.clients.list({ query: 'hello_world' });

    const whereCall = db._calls.find((c) => c.method === 'select.where');
    expect(whereCall).toBeDefined();
    const whereArgs = Bun.inspect(whereCall!.args);
    expect(whereArgs).toContain('hello\\\\_world');
  });

  test('clients.list does not apply search filter for short queries', async () => {
    const { ctx, db } = createProtectedContext();
    const caller = createCaller(ctx);

    db._results.set('select', []);

    // Single character should be ignored (minimum 2 chars for search)
    await caller.clients.list({ query: '%' });

    const whereCall = db._calls.find((c) => c.method === 'select.where');
    expect(whereCall).toBeDefined();
    // Should only have the organizationId condition, no ilike pattern
    const whereArgs = Bun.inspect(whereCall!.args);
    expect(whereArgs).not.toContain('ilike');
  });
});

describe('auth middleware', () => {
  test('UNAUTHORIZED when no session', async () => {
    const { ctx } = createPublicContext();
    const caller = createCaller(ctx);

    await expect(caller.clients.list()).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
    });
  });

  test('protected procedure succeeds with valid session + activeOrganizationId', async () => {
    const { ctx, db } = createProtectedContext();
    const caller = createCaller(ctx);

    db._results.set('select', []);
    const result = await caller.clients.list();
    expect(result).toBeDefined();
    expect(result.clients).toBeDefined();
  });

  test('admin procedure FORBIDDEN for non-admin', async () => {
    const { ctx, db } = createProtectedContext();
    const caller = createCaller(ctx);

    // Admin middleware will query for role — return 'member'
    db._results.set('select', [{ role: 'member' }]);

    await expect(
      caller.settings.updateOrg({ name: 'New Name' }),
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('admin procedure succeeds for admin user', async () => {
    const { ctx, db } = createAdminContext();
    const caller = createCaller(ctx);

    // After admin check passes (pre-configured), the updateOrg select returns admin,
    // then the update operation runs
    db._results.set('update', { success: true });

    const result = await caller.settings.updateOrg({ name: 'New Name' });
    expect(result).toEqual({ success: true });
  });
});
