import { z } from 'zod';
import { comments, commentReplies, proposals } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { router, publicProcedure } from '../init';
import { sendCommentNotificationEmail } from '@repo/resend';
import { checkFeatureAccess } from '@/lib/plans';

export const commentsRouter = router({
  list: publicProcedure
    .input(z.object({ proposalId: z.string() }))
    .query(async ({ ctx, input }) => {
      const commentsList = await ctx.db.query.comments.findMany({
        where: eq(comments.proposalId, input.proposalId),
        with: {
          replies: {
            orderBy: (replies, { asc }) => [asc(replies.createdAt)],
          },
        },
        orderBy: (comments, { desc }) => [desc(comments.createdAt)],
      });

      return commentsList.map((comment) => ({
        id: comment.id,
        posX: parseFloat(comment.posX),
        posY: parseFloat(comment.posY),
        width: comment.width ? parseFloat(comment.width) : undefined,
        height: comment.height ? parseFloat(comment.height) : undefined,
        content: comment.content,
        userName: comment.userName || 'Guest User',
        createdAt: new Date(comment.createdAt),
        status: comment.status,
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          userName: reply.userName || 'Guest User',
          createdAt: new Date(reply.createdAt),
        })),
      }));
    }),

  create: publicProcedure
    .input(
      z.object({
        proposalId: z.string(),
        authorName: z.string().min(1),
        content: z.string().min(1),
        posX: z.number(),
        posY: z.number(),
        width: z.number().optional(),
        height: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check feature access
      const proposal = await ctx.db.query.proposals.findFirst({
        where: eq(proposals.id, input.proposalId),
        columns: { organizationId: true },
      });
      if (proposal?.organizationId) {
        const access = await checkFeatureAccess(proposal.organizationId, 'comments');
        if (!access.allowed) {
          return { success: false as const, error: access.reason };
        }
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          proposalId: input.proposalId,
          userName: input.authorName,
          content: input.content,
          posX: input.posX.toString(),
          posY: input.posY.toString(),
          width: input.width?.toString(),
          height: input.height?.toString(),
        })
        .returning();

      // Send email notification (non-blocking)
      if (comment) {
        try {
          const proposalData = await ctx.db.query.proposals.findFirst({
            where: eq(proposals.id, input.proposalId),
            columns: { id: true, name: true, tourTitle: true },
            with: { organization: { columns: { notificationEmail: true } } },
          });

          if (proposalData?.organization?.notificationEmail) {
            await sendCommentNotificationEmail({
              proposalId: input.proposalId,
              clientName: input.authorName,
              proposalTitle: proposalData.tourTitle || proposalData.name,
              commentContent: input.content,
              commentAuthor: input.authorName,
              recipientEmail: proposalData.organization.notificationEmail,
              commentPosition: {
                posX: input.posX,
                posY: input.posY,
                width: input.width,
                height: input.height,
              },
            });
          }
        } catch (e) {
          console.error('Failed to send comment notification email:', e);
        }
      }

      return { success: true as const, comment };
    }),

  resolve: publicProcedure
    .input(z.object({ commentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(comments)
        .set({ status: 'resolved' })
        .where(eq(comments.id, input.commentId));
      return { success: true };
    }),

  createReply: publicProcedure
    .input(
      z.object({
        commentId: z.string(),
        authorName: z.string().min(1),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [reply] = await ctx.db
        .insert(commentReplies)
        .values({
          commentId: input.commentId,
          userName: input.authorName,
          content: input.content,
        })
        .returning();

      // Send email notification for reply (non-blocking)
      if (reply) {
        try {
          const comment = await ctx.db.query.comments.findFirst({
            where: eq(comments.id, input.commentId),
            columns: { content: true, userName: true, proposalId: true },
            with: {
              proposal: {
                columns: { id: true, name: true, tourTitle: true },
                with: { organization: { columns: { notificationEmail: true } } },
              },
            },
          });

          if (comment?.proposal?.organization?.notificationEmail) {
            await sendCommentNotificationEmail({
              proposalId: comment.proposal.id,
              clientName: input.authorName,
              proposalTitle: comment.proposal.tourTitle || comment.proposal.name,
              commentContent: input.content,
              commentAuthor: input.authorName,
              recipientEmail: comment.proposal.organization.notificationEmail,
              isReply: true,
              parentComment: {
                content: comment.content,
                author: comment.userName || 'Unknown',
              },
            });
          }
        } catch (e) {
          console.error('Failed to send reply notification email:', e);
        }
      }

      return { success: true, reply };
    }),
});
