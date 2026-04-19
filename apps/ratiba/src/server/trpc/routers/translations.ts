import { z } from 'zod';
import { proposals, proposalTranslations } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, publicProcedure } from '../init';
import {
  translateProposalContent,
  extractTranslatableContent,
} from '@/lib/translation';

export const translationsRouter = router({
  /** Translate a proposal into a target language and store the result */
  translate: protectedProcedure
    .input(
      z.object({
        proposalId: z.string(),
        language: z.string().min(2).max(10),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify proposal belongs to the org
      const proposal = await ctx.db.query.proposals.findFirst({
        where: and(
          eq(proposals.id, input.proposalId),
          eq(proposals.organizationId, ctx.orgId),
        ),
        with: {
          days: {
            with: {
              activities: {
                columns: { name: true, description: true, location: true },
              },
              accommodations: {
                with: {
                  accommodation: {
                    columns: { id: true, name: true, overview: true, description: true },
                  },
                },
              },
              transportation: {
                columns: { id: true, notes: true },
              },
            },
            orderBy: (days, { asc }) => [asc(days.dayNumber)],
          },
        },
      });

      if (!proposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Proposal not found' });
      }

      // Extract translatable fields
      const content = extractTranslatableContent(proposal);

      // Call translation API
      const translated = await translateProposalContent(content, input.language);

      // Upsert translation record
      const existing = await ctx.db.query.proposalTranslations.findFirst({
        where: and(
          eq(proposalTranslations.proposalId, input.proposalId),
          eq(proposalTranslations.language, input.language),
        ),
      });

      if (existing) {
        await ctx.db
          .update(proposalTranslations)
          .set({
            content: translated as unknown as Record<string, unknown>,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(proposalTranslations.id, existing.id));
      } else {
        await ctx.db.insert(proposalTranslations).values({
          proposalId: input.proposalId,
          language: input.language,
          content: translated as unknown as Record<string, unknown>,
        });
      }

      // Update the proposal's target language
      await ctx.db
        .update(proposals)
        .set({ language: input.language })
        .where(eq(proposals.id, input.proposalId));

      return { success: true };
    }),

  /** Set proposal language back to English (removes translation preference) */
  resetLanguage: protectedProcedure
    .input(z.object({ proposalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(proposals)
        .set({ language: 'en' })
        .where(
          and(
            eq(proposals.id, input.proposalId),
            eq(proposals.organizationId, ctx.orgId),
          ),
        );
      return { success: true };
    }),

  /** Get translation for a proposal (public, used by client view) */
  getTranslation: publicProcedure
    .input(
      z.object({
        proposalId: z.string(),
        language: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (input.language === 'en') return null;

      const translation = await ctx.db.query.proposalTranslations.findFirst({
        where: and(
          eq(proposalTranslations.proposalId, input.proposalId),
          eq(proposalTranslations.language, input.language),
        ),
      });

      return translation?.content ?? null;
    }),
});
