"use client";

import React, { useState, useRef, useEffect } from "react";
import { useComments } from "./CommentsProvider";
import { CommentPin } from "./CommentPin";
import { CommentThread } from "./CommentThread";
import { CommentForm } from "./CommentForm";
import { AnimatePresence, motion } from "framer-motion";


export function CommentsOverlay({ children }: { children: React.ReactNode }) {
  const { isCommenting, setIsCommenting, comments, activeCommentId, setActiveCommentId, addComment } = useComments();
  const [newCommentPos, setNewCommentPos] = useState<{ x: number; y: number; width?: number; height?: number; stickySelector?: string } | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stickyElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Find sticky element at a point and generate a unique selector for it
  const findStickyElement = (clientX: number, clientY: number): { element: HTMLElement; selector: string } | null => {
    const elementAtPoint = document.elementFromPoint(clientX, clientY);
    if (!elementAtPoint) return null;

    let current: HTMLElement | null = elementAtPoint as HTMLElement;
    
    while (current && current !== containerRef.current) {
      const computedStyle = window.getComputedStyle(current);
      if (computedStyle.position === 'sticky') {
        // Generate a unique selector for this sticky element
        // Try to use data attributes, IDs, or class names
        let selector = '';
        if (current.id) {
          selector = `#${current.id}`;
        } else if (current.getAttribute('data-sticky-id')) {
          selector = `[data-sticky-id="${current.getAttribute('data-sticky-id')}"]`;
        } else {
          // Generate a selector based on classes and position in DOM
          const classes = Array.from(current.classList).filter(c => !c.startsWith('sticky')).join('.');
          const parent = current.parentElement;
          const index = parent ? Array.from(parent.children).indexOf(current) : -1;
          selector = classes ? `.${classes}:nth-of-type(${index + 1})` : `:nth-child(${index + 1})`;
        }
        
        // Store the element reference
        stickyElementsRef.current.set(selector, current);
        return { element: current, selector };
      }
      current = current.parentElement;
    }
    
    return null;
  };

  const getRelativePosFromClient = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    // Check if the click is on a sticky element
    const stickyInfo = findStickyElement(clientX, clientY);
    
    if (stickyInfo) {
      const stickyRect = stickyInfo.element.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      // Calculate position relative to sticky element
      const stickyX = ((clientX - stickyRect.left) / stickyRect.width) * 100;
      const stickyY = ((clientY - stickyRect.top) / stickyRect.height) * 100;
      
      // Also calculate position relative to container for storage (as fallback)
      const containerX = ((clientX - containerRect.left) / containerRect.width) * 100;
      const containerY = ((clientY - containerRect.top) / containerRect.height) * 100;
      
      return {
        x: containerX,
        y: containerY,
        stickySelector: stickyInfo.selector,
        stickyX,
        stickyY,
      };
    }
    
    // Default: calculate relative to container
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
        setNewCommentPos({ 
          x: dragStart.x, 
          y: dragStart.y,
          stickySelector: (dragStart as any).stickySelector 
        });
      } else {
        setNewCommentPos({ 
          x, 
          y, 
          width, 
          height,
          stickySelector: (dragStart as any).stickySelector 
        });
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
          <StickyAwareCommentPin
            id={comment.id}
            posX={comment.posX}
            posY={comment.posY}
            width={comment.width}
            height={comment.height}
            isActive={activeCommentId === comment.id}
            containerRef={containerRef}
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
            stickySelector={newCommentPos.stickySelector}
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

// Component that handles positioning for comments on sticky elements
function StickyAwareCommentPin({
  id,
  posX,
  posY,
  width,
  height,
  isActive,
  containerRef,
}: {
  id: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  isActive: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const { setActiveCommentId } = useComments();
  const [stickyInfo, setStickyInfo] = useState<{ element: HTMLElement; x: number; y: number } | null>(null);
  const stickyElementRef = useRef<HTMLElement | null>(null);

  // Calculate pin position in percentage
  const pinX = width ? posX + width / 2 : posX;
  const pinY = height ? posY + height : posY;

  // Detect and track sticky element at this position
  useEffect(() => {
    if (!containerRef.current) return;

    const findAndUpdateStickyPosition = () => {
      if (!containerRef.current) return;

      // Convert percentage to pixel position
      const containerRect = containerRef.current.getBoundingClientRect();
      const targetX = containerRect.left + (containerRect.width * pinX / 100);
      const targetY = containerRect.top + (containerRect.height * pinY / 100);

      // If we already have a sticky element, check if it's still at this position
      if (stickyElementRef.current) {
        const stickyRect = stickyElementRef.current.getBoundingClientRect();
        // Check if the target point is still within the sticky element
        if (
          targetX >= stickyRect.left &&
          targetX <= stickyRect.right &&
          targetY >= stickyRect.top &&
          targetY <= stickyRect.bottom
        ) {
          // Calculate position relative to sticky element
          const relativeX = ((targetX - stickyRect.left) / stickyRect.width) * 100;
          const relativeY = ((targetY - stickyRect.top) / stickyRect.height) * 100;
          
          // Calculate fixed position based on sticky element's current position
          const fixedX = stickyRect.left + (stickyRect.width * relativeX / 100);
          const fixedY = stickyRect.top + (stickyRect.height * relativeY / 100);
          
          setStickyInfo({ element: stickyElementRef.current, x: fixedX, y: fixedY });
          return;
        } else {
          // Sticky element no longer at this position, reset
          stickyElementRef.current = null;
          setStickyInfo(null);
        }
      }

      // Find element at this position
      const elementAtPoint = document.elementFromPoint(targetX, targetY);
      if (!elementAtPoint) {
        setStickyInfo(null);
        return;
      }

      // Find nearest sticky ancestor
      let current: HTMLElement | null = elementAtPoint as HTMLElement;
      let stickyElement: HTMLElement | null = null;

      while (current && current !== containerRef.current) {
        const computedStyle = window.getComputedStyle(current);
        if (computedStyle.position === 'sticky') {
          stickyElement = current;
          break;
        }
        current = current.parentElement;
      }

      if (stickyElement) {
        stickyElementRef.current = stickyElement;
        const stickyRect = stickyElement.getBoundingClientRect();
        // Calculate position relative to sticky element
        const relativeX = ((targetX - stickyRect.left) / stickyRect.width) * 100;
        const relativeY = ((targetY - stickyRect.top) / stickyRect.height) * 100;
        
        // Calculate fixed position based on sticky element's current position
        const fixedX = stickyRect.left + (stickyRect.width * relativeX / 100);
        const fixedY = stickyRect.top + (stickyRect.height * relativeY / 100);
        
        setStickyInfo({ element: stickyElement, x: fixedX, y: fixedY });
      } else {
        stickyElementRef.current = null;
        setStickyInfo(null);
      }
    };

    // Initial detection
    findAndUpdateStickyPosition();

    // Update on scroll and resize
    window.addEventListener('scroll', findAndUpdateStickyPosition, true);
    window.addEventListener('resize', findAndUpdateStickyPosition);
    
    return () => {
      window.removeEventListener('scroll', findAndUpdateStickyPosition, true);
      window.removeEventListener('resize', findAndUpdateStickyPosition);
    };
  }, [pinX, pinY, containerRef]);

  // If we have sticky info, use fixed positioning
  if (stickyInfo) {
    return (
      <>
        {/* Highlighter Area - positioned relative to sticky element */}
        {width && height && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isActive ? 1 : 0.6 }}
            className="fixed z-40 bg-pink-300/30 border-b-2 border-pink-400 transition-colors"
            style={{
              left: `${stickyInfo.x - (stickyInfo.element.getBoundingClientRect().width * width / 200)}px`,
              top: `${stickyInfo.y - (stickyInfo.element.getBoundingClientRect().height * height / 100)}px`,
              width: `${stickyInfo.element.getBoundingClientRect().width * width / 100}px`,
              height: `${stickyInfo.element.getBoundingClientRect().height * height / 100}px`,
            }}
          />
        )}

        {/* Pin - fixed position */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          onClick={(e) => {
            e.stopPropagation();
            setActiveCommentId(isActive ? null : id);
          }}
          className={`fixed z-50 w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ${
            isActive
              ? "bg-stone-900 border-white text-white scale-110 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
              : "bg-white border-stone-800 text-stone-900 hover:bg-stone-50"
          }`}
          style={{ left: `${stickyInfo.x}px`, top: `${stickyInfo.y}px` }}
        >
          <div className="relative">
            <div className={`absolute -left-3.5 -top-3.5 w-4 h-4 rounded-tl-full rounded-tr-full rounded-bl-full flex items-center justify-center transform -rotate-45 shadow-sm border border-white/20 ${
              isActive ? "bg-stone-500" : "bg-stone-400"
            }`}>
              <div className="transform rotate-45 text-[8px] font-bold text-white"></div>
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
        </motion.button>
      </>
    );
  }

  // Default: use regular CommentPin for non-sticky elements
  return (
    <CommentPin
      id={id}
      posX={posX}
      posY={posY}
      width={width}
      height={height}
      isActive={isActive}
    />
  );
}
