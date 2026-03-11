'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PROPOSAL_STATUSES, getStatusConfig } from '@/lib/proposal-status';
import type { RequestItem } from '@/types/dashboard';

interface ProposalStatusDropdownProps {
  proposalId: string;
  status: RequestItem['status'];
  activeFilter: 'mine' | 'all';
}

export function ProposalStatusDropdown({
  proposalId,
  status,
  activeFilter,
}: ProposalStatusDropdownProps) {
  const utils = trpc.useUtils();
  const cfg = getStatusConfig(status);

  const { mutate: updateStatus } = trpc.proposals.updateStatus.useMutation({
    onSettled: () => {
      utils.proposals.listForDashboard.invalidate();
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text} cursor-pointer hover:opacity-80 transition-opacity`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {cfg.label}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {PROPOSAL_STATUSES.map((s) => {
          const sCfg = getStatusConfig(s);
          return (
            <DropdownMenuItem
              key={s}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (s !== status) {
                  updateStatus({ proposalId, status: s });
                }
              }}
              className="flex items-center gap-2"
            >
              <span className={`inline-block h-2 w-2 rounded-full ${sCfg.dot}`} />
              <span className="flex-1">{sCfg.label}</span>
              {s === status && <Check className="h-3.5 w-3.5 text-stone-500" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
