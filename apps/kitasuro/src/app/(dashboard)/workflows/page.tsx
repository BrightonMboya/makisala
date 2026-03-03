'use client';

import { Zap } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useSession } from '@/components/session-context';
import { staleTimes } from '@/lib/query-keys';
import { WorkflowCard } from './_components/workflow-card';
import { CreateWorkflowDialog } from './_components/create-workflow-dialog';

export default function WorkflowsPage() {
  const { session } = useSession();

  const { data: workflows = [], isLoading } = trpc.workflows.list.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    enabled: !!session?.user?.id,
  });

  const { data: isAdmin = false } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    enabled: !!session?.user?.id,
  });

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Workflows</h2>
        {isAdmin && <CreateWorkflowDialog />}
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          </div>
        ) : workflows.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <Zap className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No workflows yet</h3>
            <p className="mt-1 text-stone-500">
              {isAdmin
                ? 'Create your first workflow to automate post-trip actions.'
                : 'Ask an admin to set up automated workflows.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((w: any) => (
              <WorkflowCard
                key={w.id}
                id={w.id}
                name={w.name}
                description={w.description}
                triggerType={w.triggerType}
                triggerConfig={w.triggerConfig}
                actionType={w.actionType}
                status={w.status}
                creator={w.creator}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
