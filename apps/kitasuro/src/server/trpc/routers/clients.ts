import { z } from 'zod';
import { clients } from '@repo/db/schema';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, escapeLikeQuery } from '../init';

export const clientsRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          query: z.string().max(100).optional(),
          page: z.number().int().positive().default(1),
          limit: z.number().int().positive().max(100).default(10),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 10;
      const offset = (page - 1) * limit;

      const conditions = [eq(clients.organizationId, ctx.orgId)];

      const query = input?.query?.trim();
      if (query && query.length >= 2) {
        conditions.push(ilike(clients.name, `%${escapeLikeQuery(query)}%`));
      }

      const data = await ctx.db
        .select()
        .from(clients)
        .where(and(...conditions))
        .limit(limit + 1)
        .offset(offset)
        .orderBy(desc(clients.createdAt));

      const hasNextPage = data.length > limit;
      const clientsData = hasNextPage ? data.slice(0, limit) : data;

      return {
        clients: clientsData,
        pagination: { page, limit, hasNextPage },
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [client] = await ctx.db
        .select()
        .from(clients)
        .where(and(eq(clients.id, input.id), eq(clients.organizationId, ctx.orgId)))
        .limit(1);

      if (!client) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Client not found' });
      }
      return client;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        countryOfResidence: z.string().max(100).optional(),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [newClient] = await ctx.db
        .insert(clients)
        .values({
          organizationId: ctx.orgId,
          name: input.name,
          email: input.email || null,
          phone: input.phone || null,
          countryOfResidence: input.countryOfResidence || null,
          notes: input.notes || null,
        })
        .returning();

      if (!newClient) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create client' });
      }

      return { id: newClient.id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(255),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(50).optional(),
        countryOfResidence: z.string().max(100).optional(),
        notes: z.string().max(5000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      await ctx.db
        .update(clients)
        .set({
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          countryOfResidence: data.countryOfResidence || null,
          notes: data.notes || null,
          updatedAt: new Date(),
        })
        .where(and(eq(clients.id, id), eq(clients.organizationId, ctx.orgId)));

      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(clients)
        .where(and(eq(clients.id, input.id), eq(clients.organizationId, ctx.orgId)));

      return { success: true };
    }),
});
