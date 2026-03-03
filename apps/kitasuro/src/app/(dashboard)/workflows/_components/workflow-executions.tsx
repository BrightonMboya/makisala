'use client';

import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Pagination } from '../../dashboard/_components/pagination';
import { useState } from 'react';

const STATUS_CONFIG = {
  pending: { icon: Clock, className: 'text-stone-500', label: 'Pending' },
  running: { icon: Loader2, className: 'text-blue-500 animate-spin', label: 'Running' },
  completed: { icon: CheckCircle2, className: 'text-green-600', label: 'Completed' },
  failed: { icon: XCircle, className: 'text-red-600', label: 'Failed' },
} as const;

interface WorkflowExecutionsProps {
  workflowId?: string;
}

export function WorkflowExecutions({ workflowId }: WorkflowExecutionsProps) {
  const [page, setPage] = useState(1);

  const { data, isLoading } = trpc.workflows.listExecutions.useQuery({
    workflowId,
    page,
    pageSize: 20,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-stone-400">No executions yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs font-medium text-stone-500 uppercase">
              <th className="pb-2 pr-4">Status</th>
              <th className="pb-2 pr-4">Workflow</th>
              <th className="pb-2 pr-4">Proposal</th>
              <th className="pb-2 pr-4">Scheduled</th>
              <th className="pb-2">Executed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {data.items.map((exec: any) => {
              const config = STATUS_CONFIG[exec.status as keyof typeof STATUS_CONFIG];
              const Icon = config.icon;
              return (
                <tr key={exec.id}>
                  <td className="py-2.5 pr-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.className}`}>
                      <Icon className="h-3.5 w-3.5" />
                      {config.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-stone-700">
                    {exec.workflow?.name || '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-stone-700">
                    {exec.proposal?.tourTitle || exec.proposal?.name || '—'}
                  </td>
                  <td className="py-2.5 pr-4 text-stone-500">
                    {exec.scheduledFor
                      ? new Date(exec.scheduledFor).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="py-2.5 text-stone-500">
                    {exec.executedAt
                      ? new Date(exec.executedAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={data.page}
        pageSize={data.pageSize}
        total={Number(data.total)}
        onPageChange={setPage}
      />
    </div>
  );
}
