"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useComments, type Comment } from "./CommentsProvider";
import { formatDistanceToNow } from "date-fns";

interface CommentThreadProps {
  comment: Comment;
}

export function CommentThread({ comment }: CommentThreadProps) {
  const { addReply, resolveComment } = useComments();
  const [replyText, setReplyText] = useState("");

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      addReply(comment.id, replyText.trim());
      setReplyText("");
    }
  };

  const threadX = comment.width ? comment.posX + comment.width / 2 : comment.posX;
  const threadY = comment.height ? comment.posY + comment.height : comment.posY;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="absolute z-[60] w-80 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
      style={{
        left: `${threadX}%`,
        top: `calc(${threadY}% + 24px)`,
        transform: "translateX(-50%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-4 border-b border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-500">
            {comment.userName.charAt(0)}
          </div>
          <span className="text-xs font-semibold text-stone-700">{comment.userName}</span>
        </div>
        <button
          onClick={() => resolveComment(comment.id)}
          className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-800 transition-colors font-bold"
        >
          Resolve
        </button>
      </div>

      {/* Content */}
      <div className="max-h-64 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <div className="space-y-1">
          <p className="text-sm text-stone-600 leading-relaxed">{comment.content}</p>
          <span className="text-[10px] text-stone-400">
            {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
          </span>
        </div>

        {comment.replies.map((reply) => (
          <div key={reply.id} className="pl-4 border-l border-stone-100 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-stone-700">{reply.userName}</span>
              <span className="text-[9px] text-stone-400">
                {formatDistanceToNow(reply.createdAt, { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-stone-600">{reply.content}</p>
          </div>
        ))}
      </div>

      {/* Reply Input */}
      <form onSubmit={handleSubmitReply} className="p-4 bg-stone-50/50 border-t border-stone-100">
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="Reply..."
          className="w-full bg-white border border-stone-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-stone-800/10 transition-all"
          autoFocus
        />
      </form>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e7e5e4;
          border-radius: 10px;
        }
      `}</style>
    </motion.div>
  );
}
