"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { getComments, createComment, createCommentReply, resolveComment as resolveCommentAction } from "@/app/itineraries/actions";

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
  const [isCommenting, setIsCommenting] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load comments from database on mount
  useEffect(() => {
    const loadComments = async () => {
      try {
        const fetchedComments = await getComments(proposalId);
        setComments(fetchedComments);
      } catch (e) {
        console.error("Failed to load comments", e);
      } finally {
        setIsLoaded(true);
      }
    };
    
    loadComments();
  }, [proposalId]);

  const addComment = useCallback(async (posX: number, posY: number, content: string, width?: number, height?: number) => {
    try {
      const result = await createComment({
        proposalId,
        authorName: "Guest User", // TODO: Get from auth context
        content,
        posX,
        posY,
        width,
        height,
      });

      if (result.success && result.comment) {
        // Reload comments to get the new one with proper ID
        const fetchedComments = await getComments(proposalId);
        setComments(fetchedComments);
        
        // Set the new comment as active
        if (result.comment.id) {
          setActiveCommentId(result.comment.id);
        }
      }
    } catch (error) {
      console.error("Failed to create comment", error);
    }
  }, [proposalId]);

  const addReply = useCallback(async (commentId: string, content: string) => {
    try {
      const result = await createCommentReply({
        commentId,
        authorName: "Guest User", // TODO: Get from auth context
        content,
      });

      if (result.success) {
        // Reload comments to get the updated comment with reply
        const fetchedComments = await getComments(proposalId);
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error("Failed to create reply", error);
    }
  }, [proposalId]);

  const resolveComment = useCallback(async (commentId: string) => {
    try {
      const result = await resolveCommentAction(commentId);
      
      if (result.success) {
        // Update local state optimistically
        setComments((prev) =>
          prev.map((c) => (c.id === commentId ? { ...c, status: "resolved" } : c))
        );
        
        if (activeCommentId === commentId) {
          setActiveCommentId(null);
        }
      }
    } catch (error) {
      console.error("Failed to resolve comment", error);
    }
  }, [activeCommentId]);

  // Don't render children until loaded to avoid hydration mismatch/flash of empty state
  if (!isLoaded) return null;

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
