import { z } from 'zod';
import { inclusionExclusionLibrary } from '@repo/db/schema';
import { and, desc, eq, ilike, sql } from 'drizzle-orm';
import { router, protectedProcedure, escapeLikeQuery } from '../init';

const kindSchema = z.enum(['inclusion', 'exclusion']);

// Global (cross-organization) catalog of inclusion/exclusion phrases typed on
// the pricing page, ranked by how often each phrase has been used so far.
export const inclusionExclusionsRouter = router({
  search: protectedProcedure
    .input(
      z.object({
        kind: kindSchema,
        query: z.string().default(''),
        limit: z.number().int().positive().max(50).default(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const trimmed = input.query.trim();
      const conditions = trimmed
        ? and(
            eq(inclusionExclusionLibrary.kind, input.kind),
            ilike(inclusionExclusionLibrary.text, `%${escapeLikeQuery(trimmed)}%`),
          )
        : eq(inclusionExclusionLibrary.kind, input.kind);

      return ctx.db
        .select({
          id: inclusionExclusionLibrary.id,
          text: inclusionExclusionLibrary.text,
        })
        .from(inclusionExclusionLibrary)
        .where(conditions)
        .orderBy(desc(inclusionExclusionLibrary.usageCount), inclusionExclusionLibrary.text)
        .limit(input.limit);
    }),

  // Records that a phrase was used on a tour, so it surfaces (and ranks
  // higher) as a suggestion next time. Called whenever an inclusion/exclusion
  // is added, regardless of whether it came from a suggestion or free typing.
  recordUsage: protectedProcedure
    .input(z.object({ kind: kindSchema, text: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const text = input.text.trim();
      if (!text) return { id: null };

      const [row] = await ctx.db
        .insert(inclusionExclusionLibrary)
        .values({ kind: input.kind, text })
        .onConflictDoUpdate({
          target: [inclusionExclusionLibrary.kind, inclusionExclusionLibrary.text],
          set: { usageCount: sql`${inclusionExclusionLibrary.usageCount} + 1` },
        })
        .returning({ id: inclusionExclusionLibrary.id });

      return { id: row?.id ?? null };
    }),
});
