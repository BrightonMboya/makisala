"use client";

import React from "react";
import { motion } from "framer-motion";
import { useComments } from "./CommentsProvider";
import { cn } from "@/lib/utils";

interface CommentPinProps {
  id: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  isActive: boolean;
}

export function CommentPin({ id, posX, posY, width, height, isActive }: CommentPinProps) {
  const { setActiveCommentId } = useComments();

  // If we have an area, pin is at bottom center of area
  const pinX = width ? posX + width / 2 : posX;
  const pinY = height ? posY + height : posY;

  return (
    <>
      {/* Highlighter Area */}
      {width && height && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0.6 }}
          className={cn(
            "absolute z-40 bg-pink-300/30 border-b-2 border-pink-400 transition-colors",
            isActive && "bg-pink-400/40"
          )}
          style={{
            left: `${posX}%`,
            top: `${posY}%`,
            width: `${width}%`,
            height: `${height}%`,
          }}
        />
      )}

      {/* Pin */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={(e) => {
          e.stopPropagation();
          setActiveCommentId(isActive ? null : id);
        }}
        className={cn(
          "absolute z-50 w-8 h-8 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border-2 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          isActive
            ? "bg-stone-900 border-white text-white scale-110 shadow-[0_8px_30px_rgb(0,0,0,0.2)]"
            : "bg-white border-stone-800 text-stone-900 hover:bg-stone-50"
        )}
        style={{ left: `${pinX}%`, top: `${pinY}%` }}
      >
        <div className="relative">
           {/* Label/Tail as shown in image */}
          <div className={cn(
            "absolute -left-3.5 -top-3.5 w-4 h-4 rounded-tl-full rounded-tr-full rounded-bl-full flex items-center justify-center transform -rotate-45 shadow-sm border border-white/20",
            isActive ? "bg-stone-500" : "bg-stone-400"
          )}>
            <div className="transform rotate-45 text-[8px] font-bold text-white">
              {/* Could be an index or icon */}
            </div>
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
