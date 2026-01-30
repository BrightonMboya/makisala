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

  const parts = useMemo(() => {
    if (memberNames.length === 0) return [{ type: 'text' as const, value: content }];

    // Build regex to match all valid @mentions
    const mentionPattern = memberNames.map((name) => `@${escapeRegExp(name)}`).join('|');

    if (!mentionPattern) return [{ type: 'text' as const, value: content }];

    const regex = new RegExp(`(${mentionPattern})(?=\\s|$)`, 'g');

    const result: { type: 'text' | 'mention'; value: string }[] = [];
    let lastIndex = 0;
    let match;

    regex.lastIndex = 0;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        result.push({ type: 'text', value: content.slice(lastIndex, match.index) });
      }
      result.push({ type: 'mention', value: match[0] });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      result.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return result;
  }, [content, memberNames]);

  return (
    <p className={className}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <span
            key={i}
            className="rounded bg-green-100 px-0.5 text-green-800 font-medium"
          >
            {part.value}
          </span>
        ) : (
          part.value
        )
      )}
    </p>
  );
}

// Helper to escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
