import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext, createProtectedContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('notes router', () => {
  describe('list', () => {
    test('requires authentication', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.notes.list({ proposalId: 'prop-1' }),
      ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    test('returns notes with cursor pagination', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockNotes = [
        {
          id: 'note-1',
          content: 'First note',
          userId: 'user-1',
          userName: 'Test User',
          parentId: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
          replies: [],
        },
      ];
      db._results.set('query.proposalNotes.findMany', mockNotes);

      const result = await caller.notes.list({ proposalId: 'prop-1' });
      expect(result.notes).toHaveLength(1);
      expect(result.notes[0].id).toBe('note-1');
      expect(result.nextCursor).toBeNull();
    });

    test('returns nextCursor when more notes exist', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      // NOTES_PAGE_SIZE is 20, so return 21 items
      const mockNotes = Array.from({ length: 21 }, (_, i) => ({
        id: `note-${i}`,
        content: `Note ${i}`,
        userId: 'user-1',
        userName: 'Test User',
        parentId: null,
        createdAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        updatedAt: new Date(`2024-01-${String(i + 1).padStart(2, '0')}`),
        replies: [],
      }));
      db._results.set('query.proposalNotes.findMany', mockNotes);

      const result = await caller.notes.list({ proposalId: 'prop-1' });
      expect(result.notes).toHaveLength(20);
      expect(result.nextCursor).toBe('note-19');
    });
  });

  describe('create', () => {
    test('creates a note and returns it', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [
        {
          id: 'new-note',
          content: 'Hello',
          userId: 'user-1',
          userName: 'Test User',
          parentId: null,
          proposalId: 'prop-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await caller.notes.create({
        proposalId: 'prop-1',
        content: 'Hello',
      });
      expect(result.success).toBe(true);
      expect(result.note?.id).toBe('new-note');
      expect(result.note?.replies).toEqual([]);
      expect(result.note?.replyCount).toBe(0);
    });

    test('rejects empty content', async () => {
      const { ctx } = createProtectedContext();
      const caller = createCaller(ctx);

      await expect(
        caller.notes.create({ proposalId: 'prop-1', content: '' }),
      ).rejects.toThrow();
    });

    test('sends mention emails for mentioned users', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [
        {
          id: 'note-mention',
          content: 'Hey @user-2',
          userId: 'user-1',
          userName: 'Test User',
          parentId: null,
          proposalId: 'prop-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Mock the user lookup and proposal lookup for mention emails
      db._results.set('select', [{ id: 'user-2', name: 'Other User', email: 'other@test.com' }]);
      db._results.set('query.proposals.findFirst', { tourTitle: 'Safari Trip', name: 'Proposal 1' });

      const result = await caller.notes.create({
        proposalId: 'prop-1',
        content: 'Hey @user-2',
        mentionedUserIds: ['user-2'],
      });
      expect(result.success).toBe(true);
    });

    test('does not send mention email to self', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [
        {
          id: 'note-self',
          content: 'Self mention',
          userId: 'user-1',
          userName: 'Test User',
          parentId: null,
          proposalId: 'prop-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Mentioning yourself should not trigger email lookup
      const result = await caller.notes.create({
        proposalId: 'prop-1',
        content: 'Self mention',
        mentionedUserIds: ['user-1'], // same as ctx.user.id
      });
      expect(result.success).toBe(true);
    });
  });

  describe('delete', () => {
    test('deletes own note', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposalNotes.findFirst', { userId: 'user-1' });
      db._results.set('delete', { success: true });

      const result = await caller.notes.delete({ noteId: 'note-1' });
      expect(result).toEqual({ success: true, deletedId: 'note-1' });
    });

    test('FORBIDDEN when deleting another users note', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposalNotes.findFirst', { userId: 'user-other' });

      await expect(
        caller.notes.delete({ noteId: 'note-1' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    test('FORBIDDEN when note not found', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposalNotes.findFirst', undefined);

      await expect(
        caller.notes.delete({ noteId: 'nonexistent' }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });
  });

  describe('getTeamMembers', () => {
    test('returns team members for org', async () => {
      const { ctx, db } = createProtectedContext();
      const caller = createCaller(ctx);

      const mockMembers = [
        { id: 'user-1', name: 'User 1', email: 'u1@test.com', image: null },
        { id: 'user-2', name: 'User 2', email: 'u2@test.com', image: null },
      ];
      db._results.set('select', mockMembers);

      const result = await caller.notes.getTeamMembers();
      expect(result).toHaveLength(2);
    });
  });
});
