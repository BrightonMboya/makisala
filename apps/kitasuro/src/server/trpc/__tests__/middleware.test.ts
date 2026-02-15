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
