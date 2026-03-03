'use client';

import { use } from 'react';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/button';
import { trpc } from '@/lib/trpc';
import { useSession } from '@/components/session-context';
import { staleTimes } from '@/lib/query-keys';
import { WorkflowExecutions } from '../_components/workflow-executions';

const TRIGGER_LABELS: Record<string, string> = {
  proposal_completed: 'Proposal Completed',
  proposal_accepted: 'Proposal Accepted',
  proposal_shared: 'Proposal Shared',
  trip_ended: 'Trip Ended',
  trip_starting_soon: 'Trip Starting Soon',
};

export default function WorkflowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { session } = useSession();
  const utils = trpc.useUtils();

  const { data: workflow, isLoading } = trpc.workflows.getById.useQuery(
    { id },
    { staleTime: staleTimes.dashboardData, enabled: !!session?.user?.id },
  );

  const { data: isAdmin = false } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    enabled: !!session?.user?.id,
  });

  const deleteMutation = trpc.workflows.delete.useMutation({
    onSuccess: () => {
      utils.workflows.list.invalidate();
      router.push('/workflows');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-stone-50">
        <p className="text-stone-500">Workflow not found.</p>
        <Link href="/workflows" className="mt-2 text-sm text-green-700 hover:underline">
          Back to Workflows
        </Link>
      </div>
    );
  }

  const actionConfig = workflow.actionConfig as {
    emailSubject: string;
    emailBody: string;
    recipientType: string;
  };
  const triggerConfig = workflow.triggerConfig as { delayDays?: number } | null;

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <div className="flex items-center gap-3">
          <Link href="/workflows" className="text-stone-400 hover:text-stone-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="font-serif text-2xl font-bold text-stone-900">{workflow.name}</h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              workflow.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-stone-100 text-stone-600'
            }`}
          >
            {workflow.status === 'active' ? 'Active' : 'Disabled'}
          </span>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => {
                if (confirm('Delete this workflow? This cannot be undone.')) {
                  deleteMutation.mutate({ id });
                }
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Workflow details */}
        <div className="rounded-xl border border-stone-200 bg-white p-6">
          {workflow.description && (
            <p className="mb-4 text-sm text-stone-600">{workflow.description}</p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase">Trigger</p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                {TRIGGER_LABELS[workflow.triggerType] || workflow.triggerType}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase">Delay</p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                {triggerConfig?.delayDays ? `${triggerConfig.delayDays} days` : 'Immediate'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase">Action</p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                Send Email to {actionConfig.recipientType}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase">Created by</p>
              <p className="mt-1 text-sm font-medium text-stone-900">
                {(workflow as any).creator?.name || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-stone-100 pt-4">
            <p className="text-xs font-medium text-stone-400 uppercase">Email Subject</p>
            <p className="mt-1 text-sm text-stone-700">{actionConfig.emailSubject}</p>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-stone-400 uppercase">Email Body</p>
            <div className="mt-1 rounded-md bg-stone-50 p-3 text-sm text-stone-700 whitespace-pre-wrap">
              {actionConfig.emailBody}
            </div>
          </div>
        </div>

        {/* Execution history */}
        <div>
          <h3 className="mb-4 font-serif text-lg font-bold text-stone-900">Execution History</h3>
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <WorkflowExecutions workflowId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
