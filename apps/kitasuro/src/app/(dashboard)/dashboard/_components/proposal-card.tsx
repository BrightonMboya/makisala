'use client';

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AssignedUser, ProposalStatus } from '@/types/dashboard';
import { NotesPanel } from '@/components/notes-panel';
import { ProposalAssignPopover } from '@/components/proposal-assign-popover';

const STATUS_BADGE: Record<ProposalStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-stone-100 text-stone-800' },
  shared: { label: 'Shared', className: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800' },
  completed: { label: 'Completed', className: 'bg-purple-100 text-purple-800' },
};

interface ProposalCardProps {
  id: string;
  client: string;
  title: string;
  status: ProposalStatus;
  startDate: string;
  received: string;
  dayCount: number;
  assignees: AssignedUser[];
  isAdmin: boolean;
  activeFilter: 'mine' | 'all';
}

export function ProposalCard({
  id,
  client,
  title,
  status,
  startDate,
  received,
  dayCount,
  assignees,
  isAdmin,
  activeFilter,
}: ProposalCardProps) {
  const router = useRouter();
  const badge = STATUS_BADGE[status];

  return (
    <Link
      href={`/proposal/${id}`}
      className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
              {client}
            </h3>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>
          <p className="mt-1 text-sm text-stone-600">{title}</p>
        </div>
        <div className="flex items-start gap-3">
          {assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 3).map((assignee) =>
                assignee.image ? (
                  <img
                    key={assignee.id}
                    src={assignee.image}
                    alt={assignee.name}
                    title={assignee.name}
                    className="h-6 w-6 rounded-full border-2 border-white object-cover"
                  />
                ) : (
                  <span
                    key={assignee.id}
                    title={assignee.name}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-200 text-[10px] font-medium text-stone-600"
                  >
                    {assignee.name?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                ),
              )}
              {assignees.length > 3 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-[10px] font-medium text-stone-500">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="text-right text-sm text-stone-500">
            <div className="flex items-center justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Starts {startDate}
            </div>
            <div className="mt-1">
              {dayCount > 0 ? `${dayCount} days` : ''}{dayCount > 0 ? ' · ' : ''}Created {received}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3 border-t border-stone-100 pt-3">
        <NotesPanel proposalId={id} compact />
        {isAdmin && (
          <ProposalAssignPopover proposalId={id} activeFilter={activeFilter} />
        )}
        <button
          className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(`/itineraries/${id}/day-by-day`);
          }}
        >
          Edit Proposal
        </button>
      </div>
    </Link>
  );
}
