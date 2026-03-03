'use client';

import { Clock, Mail, Zap } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@repo/ui/switch';
import { trpc } from '@/lib/trpc';

const TRIGGER_LABELS: Record<string, string> = {
  proposal_completed: 'Proposal Completed',
  proposal_accepted: 'Proposal Accepted',
  proposal_shared: 'Proposal Shared',
  trip_ended: 'Trip Ended',
  trip_starting_soon: 'Trip Starting Soon',
};

const ACTION_ICONS: Record<string, typeof Mail> = {
  send_email: Mail,
};

interface WorkflowCardProps {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: { delayDays?: number } | null;
  actionType: string;
  status: string;
  creator: { id: string; name: string } | null;
}

export function WorkflowCard({
  id,
  name,
  description,
  triggerType,
  triggerConfig,
  actionType,
  status,
  creator,
}: WorkflowCardProps) {
  const utils = trpc.useUtils();
  const toggleMutation = trpc.workflows.toggleStatus.useMutation({
    onSuccess: () => {
      utils.workflows.list.invalidate();
    },
  });

  const ActionIcon = ACTION_ICONS[actionType] || Zap;
  const delayDays = (triggerConfig as { delayDays?: number })?.delayDays;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <Link href={`/workflows/${id}`} className="group min-w-0 flex-1">
          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
            {name}
          </h3>
          {description && (
            <p className="mt-1 text-sm text-stone-500">{description}</p>
          )}
        </Link>
        <Switch
          checked={status === 'active'}
          onCheckedChange={() => toggleMutation.mutate({ id })}
          disabled={toggleMutation.isPending}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
          <Zap className="h-3 w-3" />
          {TRIGGER_LABELS[triggerType] || triggerType}
        </span>
        {delayDays !== undefined && delayDays > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
            <Clock className="h-3 w-3" />
            +{delayDays}d delay
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <ActionIcon className="h-3 w-3" />
          Send Email
        </span>
        {creator && (
          <span className="ml-auto text-xs text-stone-400">
            by {creator.name}
          </span>
        )}
      </div>
    </div>
  );
}
