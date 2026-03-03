'use client';

import type { ProposalStatus } from '@/types/dashboard';

const STATUS_CONFIG: Record<ProposalStatus, { label: string; bg: string; text: string; activeBg: string }> = {
  draft: { label: 'Draft', bg: 'bg-stone-100', text: 'text-stone-700', activeBg: 'bg-stone-200 ring-2 ring-stone-400' },
  shared: { label: 'Shared', bg: 'bg-blue-50', text: 'text-blue-700', activeBg: 'bg-blue-100 ring-2 ring-blue-400' },
  accepted: { label: 'Accepted', bg: 'bg-green-50', text: 'text-green-700', activeBg: 'bg-green-100 ring-2 ring-green-400' },
  completed: { label: 'Completed', bg: 'bg-purple-50', text: 'text-purple-700', activeBg: 'bg-purple-100 ring-2 ring-purple-400' },
};

interface StatusFilterPillsProps {
  counts: Record<ProposalStatus | 'total', number>;
  activeStatuses: ProposalStatus[];
  onToggle: (status: ProposalStatus) => void;
}

export function StatusFilterPills({ counts, activeStatuses, onToggle }: StatusFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {(Object.entries(STATUS_CONFIG) as [ProposalStatus, typeof STATUS_CONFIG[ProposalStatus]][]).map(
        ([status, config]) => {
          const isActive = activeStatuses.includes(status);
          return (
            <button
              key={status}
              onClick={() => onToggle(status)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${config.text} ${isActive ? config.activeBg : config.bg} hover:opacity-80`}
            >
              {config.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${isActive ? 'bg-white/60' : 'bg-black/5'}`}>
                {counts[status]}
              </span>
            </button>
          );
        },
      )}
      <span className="flex items-center text-sm text-stone-400">
        {counts.total} total
      </span>
    </div>
  );
}
