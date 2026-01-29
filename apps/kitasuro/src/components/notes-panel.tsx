'use client';

import { Button } from '@repo/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/ui/sheet';
import { ChevronDown, ChevronUp, Loader2, MessageSquareText, Plus, Reply, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, staleTimes } from '@/lib/query-keys';
import {
  createProposalNote,
  deleteProposalNote,
  getProposalNotes,
  getTeamMembersForMention,
} from '@/app/itineraries/actions';
import { toast } from '@repo/ui/toast';
import { formatDistanceToNow } from 'date-fns';
import { MentionTextarea, type TeamMember } from './mention-textarea';
import { HighlightedText } from './highlighted-text';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

interface NotesPanelProps {
  proposalId: string;
  /** Compact mode for dashboard cards - just shows icon */
  compact?: boolean;
}

interface Note {
  id: string;
  content: string;
  userName: string;
  userId: string | null;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  replies: Note[];
  replyCount: number;
}

export function NotesPanel({ proposalId, compact = false }: NotesPanelProps) {
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyMentionedUserIds, setReplyMentionedUserIds] = useState<string[]>([]);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const { data: session } = authClient.useSession();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch notes with infinite scroll
  const {
    data: notesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: queryKeys.notes(proposalId),
    queryFn: ({ pageParam }) => getProposalNotes(proposalId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: staleTimes.notes,
    enabled: isOpen,
  });

  // Flatten paginated notes
  const notes = notesData?.pages.flatMap((page) => page.notes) ?? [];

  // Fetch team members for @mention
  const { data: teamMembers = [], isLoading: isLoadingMembers } = useQuery<TeamMember[]>({
    queryKey: ['team-members'],
    queryFn: () => getTeamMembersForMention(),
    staleTime: 5 * 60 * 1000,
    enabled: isOpen,
  });

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Create note mutation with optimistic updates
  const createMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string; mentionedUserIds: string[] }) =>
      createProposalNote({
        proposalId,
        content: data.content,
        parentId: data.parentId,
        mentionedUserIds: data.mentionedUserIds,
      }),
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes(proposalId) });

      const previousData = queryClient.getQueryData(queryKeys.notes(proposalId));

      const optimisticNote: Note = {
        id: `temp-${Date.now()}`,
        content: newData.content,
        userName: session?.user?.name || 'You',
        userId: session?.user?.id || null,
        parentId: newData.parentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        replies: [],
        replyCount: 0,
      };

      // Update cache
      queryClient.setQueryData(queryKeys.notes(proposalId), (old: any) => {
        if (!old?.pages) return old;

        if (newData.parentId) {
          // Adding a reply - find the parent note and add to its replies
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notes: page.notes.map((note: Note) =>
                addReplyToNote(note, newData.parentId!, optimisticNote)
              ),
            })),
          };
        } else {
          // Adding a top-level note
          return {
            ...old,
            pages: old.pages.map((page: any, index: number) =>
              index === 0
                ? { ...page, notes: [optimisticNote, ...page.notes] }
                : page
            ),
          };
        }
      });

      // Clear inputs
      if (newData.parentId) {
        setReplyContent('');
        setReplyMentionedUserIds([]);
        setReplyingTo(null);
      } else {
        setNewNote('');
        setMentionedUserIds([]);
      }

      return { previousData, optimisticNote };
    },
    onSuccess: (result, variables, context) => {
      if (result.success && result.note) {
        // Replace temp ID with real note
        queryClient.setQueryData(queryKeys.notes(proposalId), (old: any) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              notes: page.notes.map((note: Note) =>
                replaceOptimisticNote(note, context?.optimisticNote.id, result.note!)
              ),
            })),
          };
        });
        toast({ title: variables.parentId ? 'Reply added' : 'Note added' });
      } else {
        queryClient.setQueryData(queryKeys.notes(proposalId), context?.previousData);
        toast({
          title: 'Failed to add note',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    },
    onError: (_err, _variables, context) => {
      queryClient.setQueryData(queryKeys.notes(proposalId), context?.previousData);
      toast({
        title: 'Failed to add note',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  // Delete note mutation with optimistic updates
  const deleteMutation = useMutation({
    mutationFn: deleteProposalNote,
    onMutate: async (noteId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes(proposalId) });
      const previousData = queryClient.getQueryData(queryKeys.notes(proposalId));

      // Optimistically remove the note
      queryClient.setQueryData(queryKeys.notes(proposalId), (old: any) => {
        if (!old?.pages) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            notes: page.notes
              .map((note: Note) => removeNoteFromTree(note, noteId))
              .filter(Boolean),
          })),
        };
      });

      return { previousData };
    },
    onSuccess: (result, _noteId, context) => {
      if (result.success) {
        toast({ title: 'Note deleted' });
      } else {
        queryClient.setQueryData(queryKeys.notes(proposalId), context?.previousData);
        toast({
          title: 'Failed to delete note',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        });
      }
    },
    onError: (_err, _noteId, context) => {
      queryClient.setQueryData(queryKeys.notes(proposalId), context?.previousData);
      toast({
        title: 'Failed to delete note',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createMutation.mutate({
      content: newNote.trim(),
      mentionedUserIds,
    });
  };

  const handleAddReply = (parentId: string) => {
    if (!replyContent.trim()) return;
    createMutation.mutate({
      content: replyContent.trim(),
      parentId,
      mentionedUserIds: replyMentionedUserIds,
    });
  };

  const toggleExpanded = useCallback((noteId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

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

  // Render a note with its replies recursively
  const renderNote = (note: Note, depth: number = 0) => {
    const isExpanded = expandedNotes.has(note.id);
    const hasReplies = note.replies.length > 0;
    const isReplying = replyingTo === note.id;
    const maxDepth = 3; // Limit nesting depth for readability

    return (
      <div
        key={note.id}
        className={cn(
          'group',
          depth > 0 && 'ml-4 border-l-2 border-stone-200 pl-3'
        )}
      >
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                {note.userName[0]?.toUpperCase() || '?'}
              </div>
              <span className="text-sm font-medium text-stone-700">{note.userName}</span>
            </div>
            <div className="flex items-center gap-1">
              {depth < maxDepth && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={() => {
                    setReplyingTo(isReplying ? null : note.id);
                    setReplyContent('');
                    setReplyMentionedUserIds([]);
                  }}
                  title="Reply"
                >
                  <Reply className="h-3 w-3 text-stone-500" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => deleteMutation.mutate(note.id)}
                disabled={deleteMutation.isPending}
                title="Delete"
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          </div>
          <HighlightedText
            content={note.content}
            teamMembers={teamMembers}
            className="whitespace-pre-wrap text-sm text-stone-600"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-stone-400">
              {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
            </p>
            {hasReplies && (
              <button
                onClick={() => toggleExpanded(note.id)}
                className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" />
                    Hide {note.replyCount} {note.replyCount === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Show {note.replyCount} {note.replyCount === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Reply input */}
        {isReplying && (
          <div className="mt-2 ml-4 space-y-2">
            <MentionTextarea
              value={replyContent}
              onChange={setReplyContent}
              onMentionsChange={setReplyMentionedUserIds}
              teamMembers={teamMembers}
              isLoadingMembers={isLoadingMembers}
              currentUserId={session?.user?.id}
              placeholder="Write a reply..."
              className="min-h-[60px]"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!replyContent.trim() || createMutation.isPending}
                className="bg-green-700 hover:bg-green-800"
                onClick={() => handleAddReply(note.id)}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Reply'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                  setReplyMentionedUserIds([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Nested replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2 space-y-2">
            {note.replies.map((reply) => renderNote(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const sheet = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent className="flex w-[420px] flex-col sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serif">
            <MessageSquareText className="h-5 w-5 text-green-600" />
            Team Notes
          </SheetTitle>
          <SheetDescription>
            Internal notes visible only to your team. Type @ to mention teammates.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-hidden pt-4">
          {/* Add new note */}
          <div className="space-y-3">
            <MentionTextarea
              value={newNote}
              onChange={setNewNote}
              onMentionsChange={setMentionedUserIds}
              teamMembers={teamMembers}
              isLoadingMembers={isLoadingMembers}
              currentUserId={session?.user?.id}
              placeholder="Add a note... Type @ to mention a team member"
            />
            <Button
              type="button"
              size="sm"
              disabled={!newNote.trim() || createMutation.isPending}
              className="w-full gap-2 bg-green-700 hover:bg-green-800"
              onClick={handleAddNote}
            >
              {createMutation.isPending && !replyingTo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Note
            </Button>
          </div>

          {/* Notes list with infinite scroll */}
          <div
            ref={scrollContainerRef}
            className="flex-1 space-y-3 overflow-y-auto"
          >
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
              <>
                {notes.map((note) => renderNote(note))}
                {/* Load more trigger */}
                <div ref={loadMoreRef} className="h-1" />
                {isFetchingNextPage && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
                  </div>
                )}
                {!hasNextPage && notes.length >= 20 && (
                  <p className="py-4 text-center text-xs text-stone-400">
                    No more notes
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

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

// Helper to add a reply to a note in the tree
function addReplyToNote(note: Note, parentId: string, reply: Note): Note {
  if (note.id === parentId) {
    return {
      ...note,
      replies: [...note.replies, reply],
      replyCount: note.replyCount + 1,
    };
  }
  return {
    ...note,
    replies: note.replies.map((r) => addReplyToNote(r, parentId, reply)),
  };
}

// Helper to replace an optimistic note with the real one
function replaceOptimisticNote(note: Note, tempId: string | undefined, realNote: any): Note {
  if (!tempId) return note;
  if (note.id === tempId) {
    return {
      id: realNote.id,
      content: realNote.content,
      userName: realNote.userName || 'Unknown User',
      userId: realNote.userId,
      parentId: realNote.parentId,
      createdAt: new Date(realNote.createdAt),
      updatedAt: new Date(realNote.updatedAt),
      replies: realNote.replies || [],
      replyCount: realNote.replyCount || 0,
    };
  }
  return {
    ...note,
    replies: note.replies.map((r) => replaceOptimisticNote(r, tempId, realNote)),
  };
}

// Helper to remove a note from the tree
function removeNoteFromTree(note: Note, noteId: string): Note | null {
  if (note.id === noteId) {
    return null;
  }
  const filteredReplies = note.replies
    .map((r) => removeNoteFromTree(r, noteId))
    .filter((r): r is Note => r !== null);

  return {
    ...note,
    replies: filteredReplies,
    replyCount: countTotalReplies(filteredReplies),
  };
}

// Helper to count total replies recursively
function countTotalReplies(replies: Note[]): number {
  return replies.reduce((count, reply) => count + 1 + countTotalReplies(reply.replies), 0);
}
