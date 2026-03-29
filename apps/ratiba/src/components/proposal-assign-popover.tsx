'use client';

import { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverAnchor } from '@repo/ui/popover';
import { Checkbox } from '@repo/ui/checkbox';
import { toast } from '@repo/ui/toast';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';

interface ProposalAssignPopoverProps {
  proposalId: string;
  activeFilter: 'mine' | 'all';
  currentAssigneeIds?: string[];
}

export function ProposalAssignPopover({
  proposalId,
  activeFilter,
  currentAssigneeIds = [],
}: ProposalAssignPopoverProps) {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [optimisticIds, setOptimisticIds] = useState<Set<string> | null>(null);

  const { data: teamMembers = [], isLoading } = trpc.notes.getTeamMembers.useQuery(undefined, {
    staleTime: staleTimes.teamMembers,
    enabled: open,
  });

  const assignMutation = trpc.proposals.assign.useMutation({
    onMutate: ({ userId: memberId }) => {
      setOptimisticIds((prev) => {
        const next = new Set(prev ?? assignedIds);
        next.add(memberId);
        return next;
      });
    },
    onSuccess: (_result, { userId: memberId }) => {
      const member = teamMembers.find((m) => m.id === memberId);
      toast({ title: `Assigned to ${member?.name || 'team member'}` });
    },
    onError: (_err, { userId: memberId }) => {
      setOptimisticIds((prev) => {
        if (!prev) return prev;
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
      toast({ title: 'Failed to assign proposal', variant: 'destructive' });
    },
    onSettled: () => {
      setOptimisticIds(null);
      utils.proposals.listForDashboard.invalidate();
    },
  });

  const unassignMutation = trpc.proposals.unassign.useMutation({
    onMutate: ({ userId: memberId }) => {
      setOptimisticIds((prev) => {
        const next = new Set(prev ?? assignedIds);
        next.delete(memberId);
        return next;
      });
    },
    onSuccess: (_result, { userId: memberId }) => {
      const member = teamMembers.find((m) => m.id === memberId);
      toast({ title: `Unassigned ${member?.name || 'team member'}` });
    },
    onError: (_err, { userId: memberId }) => {
      setOptimisticIds((prev) => {
        const next = new Set(prev ?? assignedIds);
        next.add(memberId);
        return next;
      });
      toast({ title: 'Failed to unassign proposal', variant: 'destructive' });
    },
    onSettled: () => {
      setOptimisticIds(null);
      utils.proposals.listForDashboard.invalidate();
    },
  });

  const handleToggle = (memberId: string, isAssigned: boolean) => {
    if (isAssigned) {
      unassignMutation.mutate({ proposalId, userId: memberId });
    } else {
      assignMutation.mutate({ proposalId, userId: memberId });
    }
  };

  const assignedIds = new Set(currentAssigneeIds);
  const displayIds = optimisticIds ?? assignedIds;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          className="rounded-md p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }}
          title="Assign team members"
        >
          <UserPlus className="h-4 w-4" />
        </button>
      </PopoverAnchor>
      <PopoverContent
        align="end"
        className="w-64 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="border-b border-stone-200 px-3 py-2">
          <p className="text-sm font-medium text-stone-900">Assign to</p>
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
            </div>
          ) : (
            teamMembers.map((m) => {
              const isAssigned = displayIds.has(m.id);

              return (
                <button
                  key={m.id}
                  className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-stone-100"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleToggle(m.id, isAssigned);
                  }}
                >
                  <Checkbox checked={isAssigned} tabIndex={-1} className="pointer-events-none" />
                  <div className="flex items-center gap-2 overflow-hidden">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt=""
                        className="h-5 w-5 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-stone-200 text-[10px] font-medium text-stone-600">
                        {m.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                    <span className="truncate text-sm text-stone-700">
                      {m.name}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
