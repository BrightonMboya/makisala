"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useComments } from "./CommentsProvider";

interface CommentFormProps {
  posX: number;
  posY: number;
  width?: number;
  height?: number;
  onClose: () => void;
}

export function CommentForm({ posX, posY, width, height, onClose }: CommentFormProps) {
  const { addComment } = useComments();
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      addComment(posX, posY, text.trim(), width, height);
      onClose();
    }
  };

  const formX = width ? posX + width / 2 : posX;
  const formY = height ? posY + height : posY;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute z-[70] w-64 bg-white/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl p-3"
      style={{
        left: `${formX}%`,
        top: `${formY}%`,
        transform: "translate(-50%, 16px)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment..."
          className="w-full bg-stone-50/50 border border-stone-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 min-h-[80px] resize-none"
        />
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors font-bold"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 bg-stone-800 text-white rounded-lg text-[10px] uppercase tracking-widest hover:bg-stone-900 transition-colors font-bold"
          >
            Post
          </button>
        </div>
      </form>
    </motion.div>
  );
}
