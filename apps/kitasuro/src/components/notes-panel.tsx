'use client';

import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/sheet';
import { Loader2, MessageSquareText, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import {
  createProposalNote,
  deleteProposalNote,
  getProposalNotes,
} from '@/app/itineraries/actions';
import { toast } from '@repo/ui/toast';
import { formatDistanceToNow } from 'date-fns';

interface NotesPanelProps {
  proposalId: string;
  /** Compact mode for dashboard cards - just shows icon */
  compact?: boolean;
}

export function NotesPanel({ proposalId, compact = false }: NotesPanelProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: queryKeys.notes(proposalId),
    queryFn: () => getProposalNotes(proposalId),
    staleTime: staleTimes.notes,
    enabled: isOpen,
  });

  // Create note mutation
  const createMutation = useMutation({
    mutationFn: (content: string) => createProposalNote({ proposalId, content }),
    onSuccess: (result) => {
      if (result.success) {
        setNewNote('');
        queryClient.invalidateQueries({ queryKey: queryKeys.notes(proposalId) });
        toast({
          title: 'Note added',
          description: 'Your note has been saved.',
        });
      } else {
        toast({
          title: 'Failed to add note',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    },
    onError: (err) => {
      console.error('Error creating note:', err);
      toast({
        title: 'Failed to add note',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProposalNote,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notes(proposalId) });
        toast({
          title: 'Note deleted',
          description: 'The note has been removed.',
        });
      } else {
        toast({
          title: 'Failed to delete note',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    },
    onError: (err) => {
      console.error('Error deleting note:', err);
      toast({
        title: 'Failed to delete note',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createMutation.mutate(newNote.trim());
  };

  const triggerButton = (
    <Button
      variant="ghost"
      size={compact ? 'sm' : 'default'}
      className={
        compact
          ? 'h-8 gap-1.5 px-2 text-stone-500 hover:bg-green-50 hover:text-green-700'
          : 'gap-2 text-stone-600 hover:bg-stone-50 hover:text-stone-900'
      }
    >
      <MessageSquareText className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {!compact && <span className="hidden font-medium sm:inline">Notes</span>}
      {!compact && notes.length > 0 && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
          {notes.length}
        </span>
      )}
    </Button>
  );

  const sheet = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent className="flex w-[400px] flex-col sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif">
            <MessageSquareText className="h-5 w-5 text-green-600" />
            Team Notes
          </SheetTitle>
          <SheetDescription>
            Internal notes visible only to your team. Use these to track important details like
            payments, special requests, or coordination info.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden pt-4">
          {/* Add new note */}
          <div className="space-y-3">
            <Textarea
              placeholder="Add a note... (e.g., 'Park fees paid for Day 1-3', 'Client prefers vegetarian meals')"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] resize-none"
            />
            <Button
              type="button"
              size="sm"
              disabled={!newNote.trim() || createMutation.isPending}
              className="w-full gap-2 bg-green-700 hover:bg-green-800"
              onClick={handleAddNote}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>

          {/* Notes list */}
          <div className="flex-1 space-y-3 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              </div>
            ) : notes.length === 0 ? (
              <div className="py-8 text-center">
                <MessageSquareText className="mx-auto h-10 w-10 text-stone-300" />
                <p className="mt-2 text-sm text-stone-500">No notes yet</p>
                <p className="text-xs text-stone-400">Add your first note above</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="group rounded-lg border border-stone-200 bg-stone-50 p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                        {note.userName[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-stone-700">{note.userName}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => deleteMutation.mutate(note.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-stone-600">{note.content}</p>
                  <p className="mt-2 text-xs text-stone-400">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  // Wrap in a click-stopping container for compact mode (used inside Link cards on dashboard)
  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {sheet}
      </div>
    );
  }

  return sheet;
}
