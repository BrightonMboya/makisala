import { z } from 'zod';
import { member, proposalNotes, proposals, user } from '@repo/db/schema';
import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from '../init';
import { sendNoteMentionEmail } from '@repo/resend';

const NOTES_PAGE_SIZE = 20;

function transformNote(note: any): any {
  return {
    id: note.id,
    content: note.content,
    userName: note.userName || 'Unknown User',
    userId: note.userId,
    parentId: note.parentId ?? null,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
    replies: (note.replies || []).map(transformNote),
    replyCount: countReplies(note),
  };
}

function countReplies(note: any): number {
  if (!note.replies || note.replies.length === 0) return 0;
  return note.replies.reduce((count: number, reply: any) => count + 1 + countReplies(reply), 0);
}

export const notesRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const whereConditions = [
        eq(proposalNotes.proposalId, input.proposalId),
        isNull(proposalNotes.parentId),
      ];

      if (input.cursor) {
        const cursorNote = await ctx.db.query.proposalNotes.findFirst({
          where: eq(proposalNotes.id, input.cursor),
          columns: { createdAt: true },
        });
        if (cursorNote) {
          whereConditions.push(lt(proposalNotes.createdAt, cursorNote.createdAt));
        }
      }

      const notesList = await ctx.db.query.proposalNotes.findMany({
        where: and(...whereConditions),
        orderBy: (notes, { desc }) => [desc(notes.createdAt)],
        limit: NOTES_PAGE_SIZE + 1,
        with: {
          replies: {
            orderBy: (replies, { asc }) => [asc(replies.createdAt)],
            with: {
              replies: {
                orderBy: (r, { asc }) => [asc(r.createdAt)],
              },
            },
          },
        },
      });

      const hasMore = notesList.length > NOTES_PAGE_SIZE;
      const notesToReturn = hasMore ? notesList.slice(0, NOTES_PAGE_SIZE) : notesList;
      const nextCursor = hasMore ? notesToReturn[notesToReturn.length - 1]?.id : null;

      return {
        notes: notesToReturn.map(transformNote),
        nextCursor,
      };
    }),

  create: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        content: z.string().min(1),
        parentId: z.string().optional(),
        mentionedUserIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [note] = await ctx.db
        .insert(proposalNotes)
        .values({
          proposalId: input.proposalId,
          parentId: input.parentId || null,
          userId: ctx.user.id,
          userName: ctx.user.name || 'Unknown User',
          content: input.content,
        })
        .returning();

      // Send mention notifications (non-blocking)
      if (input.mentionedUserIds && input.mentionedUserIds.length > 0 && note) {
        const usersToNotify = input.mentionedUserIds.filter((id) => id !== ctx.user.id);

        if (usersToNotify.length > 0) {
          const [mentionedUsers, proposal] = await Promise.all([
            ctx.db
              .select({ id: user.id, name: user.name, email: user.email })
              .from(user)
              .where(inArray(user.id, usersToNotify)),
            ctx.db.query.proposals.findFirst({
              where: eq(proposals.id, input.proposalId),
              columns: { tourTitle: true, name: true },
            }),
          ]);

          const proposalTitle = proposal?.tourTitle || proposal?.name || 'Untitled Proposal';

          for (const mentionedUser of mentionedUsers) {
            sendNoteMentionEmail({
              recipientEmail: mentionedUser.email,
              recipientName: mentionedUser.name,
              mentionerName: ctx.user.name || 'A team member',
              noteContent: input.content,
              proposalTitle,
              proposalId: input.proposalId,
            }).catch((err) => {
              console.error('Failed to send mention email:', err);
            });
          }
        }
      }

      return {
        success: true,
        note: note
          ? { ...note, replies: [], replyCount: 0 }
          : undefined,
      };
    }),

  delete: protectedProcedure
    .input(z.object({ noteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const note = await ctx.db.query.proposalNotes.findFirst({
        where: eq(proposalNotes.id, input.noteId),
        columns: { userId: true },
      });

      if (!note || note.userId !== ctx.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own notes',
        });
      }

      await ctx.db.delete(proposalNotes).where(eq(proposalNotes.id, input.noteId));

      return { success: true, deletedId: input.noteId };
    }),

  getTeamMembers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(eq(member.organizationId, ctx.orgId))
      .limit(100);
  }),
});
