import { db } from '@repo/db';
import { workflows, workflowExecutions } from '@repo/db/schema';
import { and, eq } from 'drizzle-orm';

type TriggerType =
  | 'proposal_completed'
  | 'proposal_accepted'
  | 'proposal_shared'
  | 'trip_ended'
  | 'trip_starting_soon';

/**
 * Schedule workflow executions for an event.
 * Called when a proposal changes status (accepted, completed, etc.)
 */
export async function scheduleWorkflowsForEvent(
  orgId: string,
  proposalId: string,
  triggerType: TriggerType,
) {
  // Find active workflows matching this trigger
  const matchingWorkflows = await db
    .select()
    .from(workflows)
    .where(
      and(
        eq(workflows.organizationId, orgId),
        eq(workflows.triggerType, triggerType),
        eq(workflows.status, 'active'),
      ),
    );

  if (matchingWorkflows.length === 0) return;

  const now = new Date();

  const executions = matchingWorkflows.map((workflow) => {
    const delayDays = (workflow.triggerConfig as { delayDays?: number })?.delayDays ?? 0;
    const scheduledFor = new Date(now);
    scheduledFor.setDate(scheduledFor.getDate() + delayDays);

    return {
      workflowId: workflow.id,
      proposalId,
      status: 'pending' as const,
      scheduledFor: scheduledFor.toISOString(),
    };
  });

  await db.insert(workflowExecutions).values(executions);
}
