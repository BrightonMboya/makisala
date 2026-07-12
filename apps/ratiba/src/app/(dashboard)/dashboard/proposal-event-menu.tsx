'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { toast } from '@repo/ui/toast';
import { Check, Copy, MoreVertical, Pencil, Tag, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PROPOSAL_STATUSES, getStatusConfig, type ProposalStatus } from '@/lib/proposal-status';
import { DuplicateProposalDialog } from './duplicate-proposal-dialog';

export type ProposalEventData = {
  proposalId: string;
  status: ProposalStatus;
  // The tour's own title (without the client suffix), used to prefill the
  // duplicate dialog.
  title: string;
};

/**
 * Custom calendar event pill. Clicking the body opens the proposal's day-by-day
 * editor; the kebab exposes status / duplicate / edit / delete without leaving
 * the calendar. Mutations optimistically patch every cached `listForCalendar`
 * query so the change lands immediately, and invalidate the dashboard list too.
 */
export function ProposalEventMenu({
  title,
  color,
  backgroundColor,
  data,
}: {
  title: string;
  color?: string;
  backgroundColor?: string;
  data: ProposalEventData;
}) {
  const { proposalId, status, title: proposalTitle } = data;
  const router = useRouter();
  const utils = trpc.useUtils();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  // Keyed without inputs so we touch every cached window of each list.
  const calendarKey = getQueryKey(trpc.proposals.listForCalendar);
  const dashboardKey = getQueryKey(trpc.proposals.listForDashboard);

  const invalidateLists = () => {
    utils.proposals.listForCalendar.invalidate();
    utils.proposals.listForDashboard.invalidate();
  };

  const openEditor = () => router.push(`/itineraries/${proposalId}/day-by-day`);

  // Open a dialog only after the dropdown's dismiss layer has torn down.
  // Opening synchronously in the same click lets Radix treat that click as an
  // "interact outside" on the freshly mounted dialog and close it instantly,
  // so the modal never appears.
  const openAfterMenuCloses = (open: () => void) => {
    setTimeout(open, 0);
  };

  const updateStatus = trpc.proposals.updateStatus.useMutation({
    onMutate: async ({ status: newStatus }) => {
      await queryClient.cancelQueries({ queryKey: calendarKey });
      const previous = queryClient.getQueriesData({ queryKey: calendarKey });
      queryClient.setQueriesData({ queryKey: calendarKey }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => (t.id === proposalId ? { ...t, status: newStatus } : t));
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value);
      }
      toast({ title: 'Failed to update status', variant: 'destructive' });
    },
    onSuccess: (_data, { status: newStatus }) => {
      toast({ title: `Status updated to ${getStatusConfig(newStatus).label}` });
    },
    onSettled: invalidateLists,
  });

  const remove = trpc.proposals.delete.useMutation({
    onMutate: async () => {
      setConfirmOpen(false);
      await queryClient.cancelQueries({ queryKey: calendarKey });
      const previous = queryClient.getQueriesData({ queryKey: calendarKey });
      queryClient.setQueriesData({ queryKey: calendarKey }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.filter((t: any) => t.id !== proposalId);
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      for (const [key, value] of context?.previous ?? []) {
        queryClient.setQueryData(key, value);
      }
      toast({ title: 'Failed to delete proposal', variant: 'destructive' });
    },
    onSuccess: () => {
      toast({ title: 'Proposal deleted' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKey });
      queryClient.invalidateQueries({ queryKey: calendarKey });
    },
  });

  return (
    <>
      {/* Click navigation is handled by the calendar's `onEventClick`; this
          element only paints the pill and hosts the actions menu. */}
      <div
        className="group/event flex h-full w-full cursor-pointer items-center gap-1 overflow-hidden rounded-md px-1.5 text-xs font-medium"
        style={{ color, backgroundColor }}
      >
        <span className="min-w-0 flex-1 truncate">{title}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Proposal actions"
              // Stop both events from reaching the calendar's event wrapper so
              // opening the menu never also triggers navigation, whichever event
              // the library listens on.
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="grid h-5 w-5 shrink-0 place-items-center rounded opacity-0 transition-opacity hover:bg-black/10 focus:opacity-100 group-hover/event:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => e.stopPropagation()}
            className="w-44"
          >
            <DropdownMenuItem onClick={openEditor} className="gap-2">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Tag className="h-3.5 w-3.5" />
                Change status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PROPOSAL_STATUSES.map((s) => {
                  const cfg = getStatusConfig(s);
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => {
                        if (s !== status) updateStatus.mutate({ proposalId, status: s });
                      }}
                      className="gap-2"
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span className="flex-1">{cfg.label}</span>
                      {s === status && <Check className="h-3.5 w-3.5 text-stone-500" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuItem
              onSelect={() => openAfterMenuCloses(() => setDuplicateOpen(true))}
              className="gap-2"
            >
              <Copy className="h-3.5 w-3.5" />
              Duplicate
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => openAfterMenuCloses(() => setConfirmOpen(true))}
              className="gap-2 text-red-600 focus:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DuplicateProposalDialog
        proposalId={proposalId}
        defaultTitle={proposalTitle}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the proposal along with its itinerary and any
              associated invoices. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate({ proposalId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
