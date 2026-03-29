import { describe, expect, test } from 'bun:test';
import { createCallerFactory } from '../../init';
import { appRouter } from '../../router';
import { createPublicContext } from '../helpers/mock-context';

const createCaller = createCallerFactory(appRouter);

describe('comments router', () => {
  describe('list', () => {
    test('returns formatted comments (public)', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.comments.findMany', [
        {
          id: 'c-1',
          posX: '10.5',
          posY: '20.3',
          width: '100',
          height: null,
          content: 'Great proposal!',
          userName: 'John',
          createdAt: '2024-01-01T00:00:00.000Z',
          status: 'open',
          replies: [
            {
              id: 'r-1',
              content: 'Thanks!',
              userName: 'Jane',
              createdAt: '2024-01-02T00:00:00.000Z',
            },
          ],
        },
      ]);

      const result = await caller.comments.list({ proposalId: 'prop-1' });
      expect(result).toHaveLength(1);
      expect(result[0].posX).toBe(10.5);
      expect(result[0].posY).toBe(20.3);
      expect(result[0].width).toBe(100);
      expect(result[0].height).toBeUndefined();
      expect(result[0].userName).toBe('John');
      expect(result[0].replies).toHaveLength(1);
      expect(result[0].replies[0].userName).toBe('Jane');
    });

    test('returns empty array when no comments', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.comments.findMany', []);

      const result = await caller.comments.list({ proposalId: 'prop-1' });
      expect(result).toEqual([]);
    });

    test('defaults userName to "Guest User"', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.comments.findMany', [
        {
          id: 'c-1',
          posX: '0',
          posY: '0',
          width: null,
          height: null,
          content: 'Anonymous comment',
          userName: null,
          createdAt: '2024-01-01T00:00:00.000Z',
          status: 'open',
          replies: [],
        },
      ]);

      const result = await caller.comments.list({ proposalId: 'prop-1' });
      expect(result[0].userName).toBe('Guest User');
    });
  });

  describe('create', () => {
    test('creates comment with position data', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      // Feature access check
      db._results.set('query.proposals.findFirst', { organizationId: 'org-1' });

      db._results.set('insert', [
        {
          id: 'new-c',
          proposalId: 'prop-1',
          userName: 'John',
          content: 'Nice!',
          posX: '10',
          posY: '20',
          createdAt: new Date(),
        },
      ]);

      const result = await caller.comments.create({
        proposalId: 'prop-1',
        authorName: 'John',
        content: 'Nice!',
        posX: 10,
        posY: 20,
      });
      expect(result.success).toBe(true);
      expect(result.comment).toBeDefined();
    });

    test('rejects empty content', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.comments.create({
          proposalId: 'prop-1',
          authorName: 'John',
          content: '',
          posX: 0,
          posY: 0,
        }),
      ).rejects.toThrow();
    });

    test('rejects empty author name', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.comments.create({
          proposalId: 'prop-1',
          authorName: '',
          content: 'Comment',
          posX: 0,
          posY: 0,
        }),
      ).rejects.toThrow();
    });

    test('accepts optional width and height', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('query.proposals.findFirst', { organizationId: 'org-1' });
      db._results.set('insert', [{ id: 'c-2', createdAt: new Date() }]);

      const result = await caller.comments.create({
        proposalId: 'prop-1',
        authorName: 'John',
        content: 'Comment with dimensions',
        posX: 10,
        posY: 20,
        width: 200,
        height: 100,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('resolve', () => {
    test('resolves a comment', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('update', { success: true });

      const result = await caller.comments.resolve({ commentId: 'c-1' });
      expect(result).toEqual({ success: true });
    });
  });

  describe('createReply', () => {
    test('creates a reply', async () => {
      const { ctx, db } = createPublicContext();
      const caller = createCaller(ctx);

      db._results.set('insert', [
        {
          id: 'reply-1',
          commentId: 'c-1',
          userName: 'Jane',
          content: 'I agree!',
          createdAt: new Date(),
        },
      ]);
      // Mock the comment lookup for notification
      db._results.set('query.comments.findFirst', {
        content: 'Original',
        userName: 'John',
        proposalId: 'prop-1',
        proposal: {
          id: 'prop-1',
          name: 'Proposal 1',
          tourTitle: 'Safari Trip',
          organization: { notificationEmail: 'notify@test.com' },
        },
      });

      const result = await caller.comments.createReply({
        commentId: 'c-1',
        authorName: 'Jane',
        content: 'I agree!',
      });
      expect(result.success).toBe(true);
      expect(result.reply).toBeDefined();
    });

    test('rejects empty reply content', async () => {
      const { ctx } = createPublicContext();
      const caller = createCaller(ctx);

      await expect(
        caller.comments.createReply({
          commentId: 'c-1',
          authorName: 'Jane',
          content: '',
        }),
      ).rejects.toThrow();
    });
  });
});
