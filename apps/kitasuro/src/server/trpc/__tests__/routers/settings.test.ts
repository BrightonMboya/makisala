import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext, createAdminContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('settings router', () => {
  describe('getOrg', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(caller.settings.getOrg()).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    test('returns org data', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockOrg = { id: 'org-1', name: 'Safari Co', logoUrl: null };
      db._results.set('select', [mockOrg]);

      const result = await caller.settings.getOrg();
      expect(result).toEqual(mockOrg);
    });

    test('returns null when org not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.settings.getOrg();
      expect(result).toBeNull();
    });
  });

  describe('updateOrg', () => {
    test('requires admin role', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ role: 'member' }]);

      await expect(
        caller.settings.updateOrg({ name: 'New Name' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    test('updates org successfully', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.settings.updateOrg({ name: 'Updated Co' });
      expect(result).toEqual({ success: true });
    });

    test('validates email format', async () => {
      const { ctx } = createAdminContext();
      const caller = createCaller(ctx);

      await expect(
        caller.settings.updateOrg({ notificationEmail: 'not-an-email' }),
      ).rejects.toThrow();
    });
  });

  describe('uploadLogo', () => {
    test('uploads and returns URL', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.settings.uploadLogo({
        base64Data: Buffer.from('fake-image').toString('base64'),
      });
      expect(result.success).toBe(true);
      expect(result.url).toContain('https://r2.test.com');
    });
  });

  describe('getTeam', () => {
    test('returns team members', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockMembers = [
        { id: 'm-1', memberId: 'm-1', userId: 'user-1', name: 'User 1', email: 'u1@test.com', role: 'admin', image: null, createdAt: new Date() },
      ];
      db._results.set('select', mockMembers);

      const result = await caller.settings.getTeam();
      expect(result).toHaveLength(1);
    });
  });

  describe('getPendingInvitations', () => {
    test('returns invitations with inviter names', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [
        { id: 'inv-1', email: 'new@test.com', role: 'member', expiresAt: new Date(), createdAt: new Date(), inviterId: 'user-1' },
      ]);

      const result = await caller.settings.getPendingInvitations();
      expect(result).toHaveLength(1);
      expect(result[0].inviter).toBeDefined();
    });
  });

  describe('inviteMember', () => {
    test('requires admin', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ role: 'member' }]);

      await expect(
        caller.settings.inviteMember({ email: 'new@test.com', role: 'member' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    test('creates invitation', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      const result = await caller.settings.inviteMember({
        email: 'new@test.com',
        role: 'member',
      });
      expect(result.success).toBe(true);
    });

    test('validates email', async () => {
      const { ctx } = createAdminContext();
      const caller = createCaller(ctx);

      await expect(
        caller.settings.inviteMember({ email: 'bad', role: 'member' }),
      ).rejects.toThrow();
    });

    test('validates role', async () => {
      const { ctx } = createAdminContext();
      const caller = createCaller(ctx);

      await expect(
        caller.settings.inviteMember({ email: 'new@test.com', role: 'superadmin' as any }),
      ).rejects.toThrow();
    });
  });

  describe('revokeInvitation', () => {
    test('revokes invitation', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      const result = await caller.settings.revokeInvitation({ invitationId: 'inv-1' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('removeMember', () => {
    test('prevents removing yourself', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      // After admin check, the member lookup returns the current user
      db._results.set('select', [{ userId: 'user-1' }]);

      await expect(
        caller.settings.removeMember({ memberId: 'm-1' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'You cannot remove yourself from the team' });
    });

    test('removes another member', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      // After admin check, the member lookup returns a different user
      db._results.set('select', [{ userId: 'user-other' }]);

      const result = await caller.settings.removeMember({ memberId: 'm-2' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('updateRole', () => {
    test('updates member role', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      // Transaction: member lookup returns other user
      db._results.set('tx.select', [{ userId: 'user-other' }]);

      const result = await caller.settings.updateRole({ memberId: 'm-2', role: 'admin' });
      expect(result).toEqual({ success: true });
    });

    test('prevents last admin from self-demotion', async () => {
      const { ctx, db } = createAdminContext();
      const caller = createCaller(ctx);

      // Transaction: member lookup returns current user, admin count returns 1
      db._results.set('tx.select', [{ userId: 'user-1' }]);

      await expect(
        caller.settings.updateRole({ memberId: 'm-1', role: 'member' }),
      ).rejects.toMatchObject({ code: 'BAD_REQUEST', message: 'Cannot demote: You are the only admin' });
    });
  });

  describe('getCurrentUser', () => {
    test('returns current user', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockUser = { id: 'user-1', name: 'Test User', email: 'test@test.com' };
      db._results.set('select', [mockUser]);

      const result = await caller.settings.getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateProfile', () => {
    test('updates profile name', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.settings.updateProfile({ name: 'New Name' });
      expect(result).toEqual({ success: true });
    });

    test('rejects name over 255 chars', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.settings.updateProfile({ name: 'x'.repeat(256) }),
      ).rejects.toThrow();
    });
  });

  describe('uploadAvatar', () => {
    test('uploads avatar and returns URL', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.settings.uploadAvatar({
        base64Data: Buffer.from('fake-image').toString('base64'),
      });
      expect(result.success).toBe(true);
      expect(result.url).toContain('https://r2.test.com');
    });
  });

  describe('checkAdmin', () => {
    test('returns true for admin', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ role: 'admin' }]);

      const result = await caller.settings.checkAdmin();
      expect(result).toBe(true);
    });

    test('returns false for non-admin', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ role: 'member' }]);

      const result = await caller.settings.checkAdmin();
      expect(result).toBe(false);
    });
  });

  describe('getInvitationStatus', () => {
    test('returns invitation status (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ status: 'pending' }]);

      const result = await caller.settings.getInvitationStatus({ invitationId: 'inv-1' });
      expect(result).toBe('pending');
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.settings.getInvitationStatus({ invitationId: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('getInvitationByToken', () => {
    test('returns invitation with org and inviter (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const futureDate = new Date(Date.now() + 86400000);
      db._results.set('select', [
        {
          id: 'inv-1',
          email: 'new@test.com',
          organizationId: 'org-1',
          inviterId: 'user-1',
          expiresAt: futureDate,
          status: 'pending',
        },
      ]);

      const result = await caller.settings.getInvitationByToken({ invitationId: 'inv-1' });
      expect(result).toBeDefined();
    });

    test('returns null for expired invitation', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      const pastDate = new Date(Date.now() - 86400000);
      db._results.set('select', [
        {
          id: 'inv-1',
          email: 'new@test.com',
          organizationId: 'org-1',
          expiresAt: pastDate,
          status: 'pending',
        },
      ]);
      db._results.set('update', { success: true });

      const result = await caller.settings.getInvitationByToken({ invitationId: 'inv-1' });
      expect(result).toBeNull();
    });

    test('returns null when not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      const result = await caller.settings.getInvitationByToken({ invitationId: 'nonexistent' });
      expect(result).toBeNull();
    });
  });

  describe('acceptInvitation', () => {
    test('accepts invitation (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', [{ organizationId: 'org-1' }]);

      const result = await caller.settings.acceptInvitation({ invitationId: 'inv-1' });
      expect(result).toEqual({ success: true });
    });

    test('throws NOT_FOUND when invitation not found', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('select', []);

      await expect(
        caller.settings.acceptInvitation({ invitationId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    });
  });
});
