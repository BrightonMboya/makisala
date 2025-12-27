"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

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
  addComment: (posX: number, posY: number, content: string, width?: number, height?: number) => void;
  addReply: (commentId: string, content: string) => void;
  resolveComment: (commentId: string) => void;
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

  // Load comments from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`comments-${proposalId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved, (key, value) => {
          if (key === "createdAt") return new Date(value);
          return value;
        });
        setComments(parsed);
      } catch (e) {
        console.error("Failed to parse saved comments", e);
      }
    }
    setIsLoaded(true);
  }, [proposalId]);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(`comments-${proposalId}`, JSON.stringify(comments));
    }
  }, [comments, proposalId, isLoaded]);

  const addComment = useCallback((posX: number, posY: number, content: string, width?: number, height?: number) => {
    const newComment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
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
    setComments((prev) => [...prev, newComment]);
    setActiveCommentId(newComment.id);
  }, []);

  const addReply = useCallback((commentId: string, content: string) => {
    const newReply: Reply = {
      id: Math.random().toString(36).substr(2, 9),
      content,
      userName: "Guest User",
      createdAt: new Date(),
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c
      )
    );
  }, []);

  const resolveComment = useCallback((commentId: string) => {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, status: "resolved" } : c))
    );
    if (activeCommentId === commentId) {
      setActiveCommentId(null);
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
