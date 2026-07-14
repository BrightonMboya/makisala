'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { Copy, MoreVertical, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { DuplicateProposalDialog } from '../../dashboard/duplicate-proposal-dialog';

/**
 * Per-proposal actions on the client deal page: Duplicate and Delete. Status is
 * changed via the row's status pill (ProposalStatusDropdown), and Edit / Open
 * have their own buttons, so this kebab only holds the two extras.
 */
export function ProposalRowMenu({
  proposalId,
  tourTitle,
}: {
  proposalId: string;
  tourTitle: string;
}) {
  const utils = trpc.useUtils();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);

  const remove = trpc.proposals.delete.useMutation({
    onSuccess: () => {
      toast({ title: 'Proposal deleted' });
    },
    onError: () => {
      toast({ title: 'Failed to delete proposal', variant: 'destructive' });
    },
    onSettled: () => {
      // Refresh the deal page and every list that could show this proposal.
      utils.proposals.listForClient.invalidate();
      utils.proposals.listClientsForDashboard.invalidate();
      utils.proposals.listForDashboard.invalidate();
      utils.proposals.listForCalendar.invalidate();
    },
  });

  // Open a dialog only after the dropdown's dismiss layer has torn down, or Radix
  // treats the same click as an "interact outside" and closes it instantly.
  const openAfterMenuCloses = (open: () => void) => setTimeout(open, 0);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Proposal actions"
            className="grid h-8 w-8 place-items-center rounded-md border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-700"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
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

      <DuplicateProposalDialog
        proposalId={proposalId}
        defaultTitle={tourTitle}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
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
