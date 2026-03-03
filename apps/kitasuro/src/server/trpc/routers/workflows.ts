import { z } from 'zod';
import { workflows, workflowExecutions } from '@repo/db/schema';
import { and, desc, eq, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, adminProcedure } from '../init';

const actionConfigSchema = z.object({
  emailSubject: z.string().min(1).max(200),
  emailBody: z.string().min(1).max(5000),
  recipientType: z.enum(['client', 'team']),
});

const triggerConfigSchema = z.object({
  delayDays: z.number().int().min(0).max(365).optional(),
});

export const workflowsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.workflows.findMany({
      where: eq(workflows.organizationId, ctx.orgId),
      orderBy: desc(workflows.updatedAt),
      with: {
        creator: { columns: { id: true, name: true } },
      },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.query.workflows.findFirst({
        where: and(
          eq(workflows.id, input.id),
          eq(workflows.organizationId, ctx.orgId),
        ),
        with: {
          creator: { columns: { id: true, name: true } },
          executions: {
            orderBy: desc(workflowExecutions.createdAt),
            limit: 20,
            with: {
              proposal: { columns: { id: true, name: true, tourTitle: true } },
            },
          },
        },
      });

      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      return workflow;
    }),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        triggerType: z.enum([
          'proposal_completed',
          'proposal_accepted',
          'proposal_shared',
          'trip_ended',
          'trip_starting_soon',
        ]),
        triggerConfig: triggerConfigSchema.optional(),
        actionType: z.enum(['send_email']),
        actionConfig: actionConfigSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [workflow] = await ctx.db
        .insert(workflows)
        .values({
          organizationId: ctx.orgId,
          name: input.name,
          description: input.description,
          triggerType: input.triggerType,
          triggerConfig: input.triggerConfig ?? {},
          actionType: input.actionType,
          actionConfig: input.actionConfig,
          createdBy: ctx.user.id,
        })
        .returning();

      return workflow;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).optional(),
        triggerType: z
          .enum([
            'proposal_completed',
            'proposal_accepted',
            'proposal_shared',
            'trip_ended',
            'trip_starting_soon',
          ])
          .optional(),
        triggerConfig: triggerConfigSchema.optional(),
        actionType: z.enum(['send_email']).optional(),
        actionConfig: actionConfigSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const existing = await ctx.db.query.workflows.findFirst({
        where: and(eq(workflows.id, id), eq(workflows.organizationId, ctx.orgId)),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      const [updated] = await ctx.db
        .update(workflows)
        .set({ ...updates, updatedAt: new Date().toISOString() })
        .where(eq(workflows.id, id))
        .returning();

      return updated;
    }),

  toggleStatus: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.workflows.findFirst({
        where: and(eq(workflows.id, input.id), eq(workflows.organizationId, ctx.orgId)),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      const newStatus = existing.status === 'active' ? 'disabled' : 'active';

      const [updated] = await ctx.db
        .update(workflows)
        .set({ status: newStatus, updatedAt: new Date().toISOString() })
        .where(eq(workflows.id, input.id))
        .returning();

      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.workflows.findFirst({
        where: and(eq(workflows.id, input.id), eq(workflows.organizationId, ctx.orgId)),
      });

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
      }

      await ctx.db.delete(workflows).where(eq(workflows.id, input.id));
      return { success: true };
    }),

  listExecutions: protectedProcedure
    .input(
      z.object({
        workflowId: z.string().uuid().optional(),
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.workflowId) {
        // Verify workflow belongs to org
        const workflow = await ctx.db.query.workflows.findFirst({
          where: and(
            eq(workflows.id, input.workflowId),
            eq(workflows.organizationId, ctx.orgId),
          ),
        });
        if (!workflow) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
        }
        conditions.push(eq(workflowExecutions.workflowId, input.workflowId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const countResult = await ctx.db
        .select({ total: sql<number>`count(*)::int` })
        .from(workflowExecutions)
        .where(whereClause);
      const total = countResult[0]?.total ?? 0;

      const offset = (input.page - 1) * input.pageSize;
      const items = await ctx.db.query.workflowExecutions.findMany({
        where: whereClause,
        orderBy: desc(workflowExecutions.createdAt),
        limit: input.pageSize,
        offset,
        with: {
          workflow: { columns: { id: true, name: true } },
          proposal: { columns: { id: true, name: true, tourTitle: true } },
        },
      });

      return { items, total, page: input.page, pageSize: input.pageSize };
    }),
});
