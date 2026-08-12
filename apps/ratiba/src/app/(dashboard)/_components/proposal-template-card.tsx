'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
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
import { Calendar, Eye, MapPin, MoreVertical, Pencil, Send, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { capitalize } from '@/lib/utils';
import { DuplicateProposalDialog } from '../dashboard/duplicate-proposal-dialog';

interface ProposalTemplateCardProps {
  template: {
    id: string;
    name: string;
    tourTitle: string | null;
    heroImage: string | null;
    countries: string[];
    numberOfDays: number;
  };
}

export default function ProposalTemplateCard({ template }: ProposalTemplateCardProps) {
  const [imgError, setImgError] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const utils = trpc.useUtils();

  const remove = trpc.proposals.delete.useMutation({
    onSuccess: () => toast({ title: 'Template deleted' }),
    onError: () => toast({ title: 'Failed to delete template', variant: 'destructive' }),
    onSettled: () => utils.proposals.listTemplates.invalidate(),
  });

  // Open a dialog only after the dropdown's dismiss layer has torn down, or Radix
  // treats the same click as an "interact outside" and closes it instantly.
  const openAfterMenuCloses = (open: () => void) => setTimeout(open, 0);

  const title = template.tourTitle || template.name;

  return (
    <>
      <Card className="group border-stone-200 bg-white transition-all duration-300 hover:border-green-600/30 hover:shadow-lg">
        <CardHeader className="p-0">
          <div className="relative overflow-hidden rounded-t-lg h-48">
            <Image
              src={imgError ? '/placeholder.svg' : (template.heroImage || '/placeholder.svg')}
              alt={title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgError(true)}
            />
            <div className="absolute top-3 right-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Template actions"
                    className="grid h-8 w-8 place-items-center rounded-md bg-white/90 text-stone-600 shadow-sm transition-colors hover:bg-white hover:text-stone-900"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem asChild className="gap-2">
                    <Link href={`/itineraries/${template.id}/preview`}>
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </Link>
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
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800 mb-2">
            {title}
          </h3>

          <div className="text-stone-500 mb-3 flex items-center gap-4 text-sm">
            {template.countries.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{template.countries.map(capitalize).join(' & ')}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{template.numberOfDays} days</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 gap-2">
          <Button
            asChild
            variant="outline"
            className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50"
          >
            <Link href={`/itineraries/${template.id}/day-by-day`}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button
            className="flex-1 bg-green-700 hover:bg-green-800 text-white"
            onClick={() => setSendOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Send to client
          </Button>
        </CardFooter>
      </Card>

      <DuplicateProposalDialog
        proposalId={template.id}
        defaultTitle={title}
        open={sendOpen}
        onOpenChange={setSendOpen}
        dialogTitle="Send to client"
        submitLabel="Create proposal"
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this template?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the template and its itinerary. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => remove.mutate({ proposalId: template.id })}
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
