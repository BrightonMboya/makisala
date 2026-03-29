'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import { trpc } from '@/lib/trpc';
import { toast } from '@repo/ui/toast';
import { PROPOSAL_STATUSES, getStatusConfig } from '@/lib/proposal-status';
import type { RequestItem } from '@/types/dashboard';

interface ProposalStatusDropdownProps {
  proposalId: string;
  status: RequestItem['status'];
}

export function ProposalStatusDropdown({
  proposalId,
  status,
}: ProposalStatusDropdownProps) {
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const cfg = getStatusConfig(status);

  // Key without input params — matches all cached listForDashboard queries
  const dashboardQueryKey = getQueryKey(trpc.proposals.listForDashboard);

  const { mutate: updateStatus } = trpc.proposals.updateStatus.useMutation({
    onMutate: async ({ status: newStatus }) => {
      setOpen(false);

      await queryClient.cancelQueries({ queryKey: dashboardQueryKey });

      // Snapshot all cached queries for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: dashboardQueryKey });

      // Optimistically update every cached listForDashboard query
      queryClient.setQueriesData({ queryKey: dashboardQueryKey }, (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.id === proposalId ? { ...item, status: newStatus } : item,
          ),
        };
      });

      return { previousQueries };
    },
    onSuccess: (_data, { status: newStatus }) => {
      const newCfg = getStatusConfig(newStatus);
      toast({ title: `Status updated to ${newCfg.label}` });
    },
    onError: (_err, _variables, context) => {
      // Rollback all queries to their previous data
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({
        title: 'Failed to update status',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      utils.proposals.listForDashboard.invalidate();
    },
  });

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
