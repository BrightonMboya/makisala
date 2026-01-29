'use client';

import { useMemo } from 'react';
import type { TeamMember } from './mention-textarea';

interface HighlightedTextProps {
  content: string;
  teamMembers: TeamMember[];
  className?: string;
}

export function HighlightedText({ content, teamMembers, className }: HighlightedTextProps) {
  const memberNames = useMemo(() => {
    return teamMembers.map((member) => member.name);
  }, [teamMembers]);

  const highlightedContent = useMemo(() => {
    if (memberNames.length === 0) return escapeHtml(content);

    // Build regex to match all valid @mentions
    const mentionPattern = memberNames.map((name) => `@${escapeRegExp(name)}`).join('|');

    if (!mentionPattern) return escapeHtml(content);

    const regex = new RegExp(`(${mentionPattern})(?=\\s|$)`, 'g');

    // Split and highlight
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    regex.lastIndex = 0;

    while ((match = regex.exec(content)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(escapeHtml(content.slice(lastIndex, match.index)));
      }
      // Add highlighted mention
      parts.push(
        `<span class="rounded bg-green-100 px-0.5 text-green-800 font-medium">${escapeHtml(match[0])}</span>`
      );
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(escapeHtml(content.slice(lastIndex)));
    }

    return parts.join('');
  }, [content, memberNames]);

  return (
    <p
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
    />
  );
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to escape HTML characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}
