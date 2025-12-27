"use client";

import React, { useState, useRef, useEffect } from "react";
import { useComments } from "./CommentsProvider";
import { CommentPin } from "./CommentPin";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { AnimatePresence, motion } from "framer-motion";


export function CommentsOverlay({ children }: { children: React.ReactNode }) {
  const { isCommenting, setIsCommenting, comments, activeCommentId, setActiveCommentId, addComment } = useComments();
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number; width?: number; height?: number } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const getRelativePosFromClient = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  useEffect(() => {
    if (!dragStart) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      setDragCurrent(getRelativePosFromClient(e.clientX, e.clientY));
    };

    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (!dragStart || !dragCurrent) return;

      const currentPos = getRelativePosFromClient(e.clientX, e.clientY);
      const width = Math.abs(currentPos.x - dragStart.x);
      const height = Math.abs(currentPos.y - dragStart.y);
      const x = Math.min(dragStart.x, currentPos.x);
      const y = Math.min(dragStart.y, currentPos.y);

      // If it's just a click (small movement), treat as a pinpoint
      if (width < 0.5 && height < 0.5) {
        setNewCommentPos({ x: dragStart.x, y: dragStart.y });
      } else {
        setNewCommentPos({ x, y, width, height });
      }

      setDragStart(null);
      setDragCurrent(null);
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [dragStart, dragCurrent]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCommenting) return;
    
    // Only allow left click
    if (e.button !== 0) return;

    // If clicking on an existing pin or thread, don't start a new selection
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.comment-thread')) {
      return;
    }

    if (activeCommentId) {
      setActiveCommentId(null);
      return;
    }

    e.preventDefault();
    const pos = getRelativePosFromClient(e.clientX, e.clientY);
    setDragStart(pos);
    setDragCurrent(pos);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${isCommenting ? 'select-none' : 'default'}`}
    >
      {/* The main content being commented on */}
      {children}

      {/* Interaction Layer - only active when commenting */}
      {isCommenting && (
        <div 
          className="absolute inset-0 z-[45] cursor-crosshair"
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Floating Comment Trigger Button */}
      <div className="fixed bottom-8 right-8 z-[100]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsCommenting(!isCommenting);
            setNewCommentPos(null);
            setActiveCommentId(null);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-110 ${
            isCommenting ? "bg-stone-800 text-white rotate-45" : "bg-white text-stone-800"
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {isCommenting ? (
              <path d="M12 5v14M5 12h14" />
            ) : (
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            )}
          </svg>
        </button>
      </div>

      {/* Rendering selection area while dragging */}
      {dragStart && dragCurrent && (
        <div
          className="absolute border-2 border-pink-400/50 bg-pink-400/10 z-[46] pointer-events-none"
          style={{
            left: `${Math.min(dragStart.x, dragCurrent.x)}%`,
            top: `${Math.min(dragStart.y, dragCurrent.y)}%`,
            width: `${Math.abs(dragCurrent.x - dragStart.x)}%`,
            height: `${Math.abs(dragCurrent.y - dragStart.y)}%`,
          }}
        />
      )}

      {/* New highlight (while typing) */}
      {newCommentPos?.width && newCommentPos?.height && (
        <div
          className="absolute border-2 border-pink-400/50 bg-pink-400/20 z-[46] pointer-events-none shadow-[0_0_20px_rgba(244,114,182,0.3)]"
          style={{
            left: `${newCommentPos.x}%`,
            top: `${newCommentPos.y}%`,
            width: `${newCommentPos.width}%`,
            height: `${newCommentPos.height}%`,
          }}
        />
      )}

      {/* New pinpoint (while typing) */}
      {newCommentPos && !newCommentPos.width && (
        <div 
          className="absolute z-50 w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 bg-stone-900 border-white text-white opacity-50 pointer-events-none"
          style={{ left: `${newCommentPos.x}%`, top: `${newCommentPos.y}%` }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
      )}

      {/* Rendering existing comments */}
      {comments.filter(c => c.status === "open").map((comment) => (
        <React.Fragment key={comment.id}>
          <CommentPin
            id={comment.id}
            posX={comment.posX}
            posY={comment.posY}
            width={comment.width}
            height={comment.height}
            isActive={activeCommentId === comment.id}
          />
          <AnimatePresence>
            {activeCommentId === comment.id && (
              <CommentThread comment={comment} />
            )}
          </AnimatePresence>
        </React.Fragment>
      ))}

      {/* New comment input popup */}
      <AnimatePresence>
        {newCommentPos && (
          <CommentForm
            posX={newCommentPos.x}
            posY={newCommentPos.y}
            width={newCommentPos.width}
            height={newCommentPos.height}
            onClose={() => setNewCommentPos(null)}
          />
        )}
      </AnimatePresence>

      {/* Commenting Mode Indicator */}
      {isCommenting && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-stone-900/[0.02] pointer-events-none z-10 border-4 border-dashed border-stone-800/10"
          />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-stone-900 text-white px-8 py-3 rounded-2xl text-xs font-bold tracking-[0.2em] uppercase shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 pointer-events-none flex items-center gap-3"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Commenting Mode
            <span className="text-white/40 font-normal normal-case tracking-normal ml-2">Drag to highlight or click to pin</span>
          </motion.div>
        </>
      )}
    </div>
  );
}
