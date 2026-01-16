"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getComments, createComment, createCommentReply, resolveComment as resolveCommentAction } from "@/app/itineraries/actions";
import { queryKeys, staleTimes } from "@/lib/query-keys";

export type Comment = {
  id: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  content: string;
  userName: string;
  createdAt: Date;
  status: "open" | "resolved";
  replies: Reply[];
};

export type Reply = {
  id: string;
  content: string;
  userName: string;
  createdAt: Date;
};

interface CommentsContextType {
  isCommenting: boolean;
  setIsCommenting: (val: boolean) => void;
  comments: Comment[];
  activeCommentId: string | null;
  setActiveCommentId: (id: string | null) => void;
  addComment: (posX: number, posY: number, content: string, width?: number, height?: number) => Promise<void>;
  addReply: (commentId: string, content: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
}

const CommentsContext = createContext<CommentsContextType | undefined>(undefined);

interface CommentsProviderProps {
  children: React.ReactNode;
  proposalId: string;
}

export function CommentsProvider({ children, proposalId }: CommentsProviderProps) {
  const queryClient = useQueryClient();
  const [isCommenting, setIsCommenting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);

  // Use React Query for comments with caching
  const { data: comments = [], isLoading } = useQuery({
    queryKey: queryKeys.comments(proposalId),
    queryFn: () => getComments(proposalId),
    staleTime: staleTimes.comments,
  });

  const addComment = useCallback(async (posX: number, posY: number, content: string, width?: number, height?: number) => {
    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      posX,
      posY,
      width,
      height,
      content,
      userName: "Guest User",
      createdAt: new Date(),
      status: "open",
      replies: [],
    };

    // Optimistically add the comment
    queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) => [
      optimisticComment,
      ...old,
    ]);

    try {
      const result = await createComment({
        proposalId,
        authorName: "Guest User",
        content,
        posX,
        posY,
        width,
        height,
      });

      if (result.success && result.comment) {
        // Replace optimistic comment with real one
        queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
          old.map((c) =>
            c.id === optimisticComment.id
              ? { ...optimisticComment, id: result.comment!.id }
              : c
          )
        );
        setActiveCommentId(result.comment.id);
      } else {
        // Rollback on failure
        queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
          old.filter((c) => c.id !== optimisticComment.id)
        );
      }
    } catch (error) {
      console.error("Failed to create comment", error);
      // Rollback on error
      queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
        old.filter((c) => c.id !== optimisticComment.id)
      );
    }
  }, [proposalId, queryClient]);

  const addReply = useCallback(async (commentId: string, content: string) => {
    // Create optimistic reply
    const optimisticReply: Reply = {
      id: `temp-reply-${Date.now()}`,
      content,
      userName: "Guest User",
      createdAt: new Date(),
    };

    // Optimistically add the reply
    queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
      old.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, optimisticReply] }
          : c
      )
    );

    try {
      const result = await createCommentReply({
        commentId,
        authorName: "Guest User",
        content,
      });

      if (result.success && result.reply) {
        // Replace optimistic reply with real one
        queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
          old.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === optimisticReply.id ? { ...r, id: result.reply!.id } : r
                  ),
                }
              : c
          )
        );
      } else {
        // Rollback on failure
        queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
          old.map((c) =>
            c.id === commentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== optimisticReply.id) }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to create reply", error);
      // Rollback on error
      queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
        old.map((c) =>
          c.id === commentId
            ? { ...c, replies: c.replies.filter((r) => r.id !== optimisticReply.id) }
            : c
        )
      );
    }
  }, [proposalId, queryClient]);

  const resolveComment = useCallback(async (commentId: string) => {
    // Optimistically update
    queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
      old.map((c) => (c.id === commentId ? { ...c, status: "resolved" } : c))
    );

    if (activeCommentId === commentId) {
      setActiveCommentId(null);
    }

    try {
      const result = await resolveCommentAction(commentId);
      if (!result.success) {
        // Rollback on failure
        queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
          old.map((c) => (c.id === commentId ? { ...c, status: "open" } : c))
        );
      }
    } catch (error) {
      console.error("Failed to resolve comment", error);
      // Rollback on error
      queryClient.setQueryData<Comment[]>(queryKeys.comments(proposalId), (old = []) =>
        old.map((c) => (c.id === commentId ? { ...c, status: "open" } : c))
      );
    }
  }, [proposalId, queryClient, activeCommentId]);

  // Don't render children until loaded to avoid hydration mismatch
  if (isLoading) return null;

  return (
    <CommentsContext.Provider
      value={{
        isCommenting,
        setIsCommenting,
        comments,
        activeCommentId,
        setActiveCommentId,
        addComment,
        addReply,
        resolveComment,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (context === undefined) {
    throw new Error("useComments must be used within a CommentsProvider");
  }
  return context;
}
