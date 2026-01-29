'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, PopoverContent, PopoverAnchor } from '@repo/ui/popover';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (userIds: string[]) => void;
  teamMembers: TeamMember[];
  isLoadingMembers?: boolean;
  currentUserId?: string;
  placeholder?: string;
  className?: string;
}

export function MentionTextarea({
  value,
  onChange,
  onMentionsChange,
  teamMembers,
  isLoadingMembers = false,
  currentUserId,
  placeholder,
  className,
}: MentionTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartIndex, setMentionStartIndex] = useState<number | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<Set<string>>(new Set());

  // Filter team members: exclude current user and filter by search query
  const filteredMembers = useMemo(() => {
    return teamMembers
      .filter((member) => member.id !== currentUserId)
      .filter((member) =>
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [teamMembers, currentUserId, searchQuery]);

  // Get all valid member names for highlighting
  const memberNames = useMemo(() => {
    return teamMembers
      .filter((member) => member.id !== currentUserId)
      .map((member) => member.name);
  }, [teamMembers, currentUserId]);

  // Reset selection when filtered members change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredMembers.length, searchQuery]);

  // Extract mentioned user IDs from the text content
  const extractMentionedUsers = useCallback(
    (text: string): Set<string> => {
      const mentioned = new Set<string>();
      for (const member of teamMembers) {
        if (member.id !== currentUserId) {
          // Match @Name pattern (with optional trailing space)
          const pattern = new RegExp(`@${escapeRegExp(member.name)}(?:\\s|$)`, 'g');
          if (pattern.test(text)) {
            mentioned.add(member.id);
          }
        }
      }
      return mentioned;
    },
    [teamMembers, currentUserId]
  );

  // Update mentioned users when value changes
  useEffect(() => {
    const newMentioned = extractMentionedUsers(value);
    if (!setsEqual(newMentioned, mentionedUserIds)) {
      setMentionedUserIds(newMentioned);
      onMentionsChange?.(Array.from(newMentioned));
    }
  }, [value, extractMentionedUsers, onMentionsChange, mentionedUserIds]);

  // Sync scroll between textarea and highlight overlay
  const syncScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    onChange(newValue);

    // Check if user is typing a mention
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      // Check if @ is at start or after whitespace
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor.charAt(lastAtIndex - 1) : ' ';
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);

      // Only trigger dropdown if @ is at word boundary and no space after @
      if (/\s/.test(charBeforeAt) || lastAtIndex === 0) {
        if (!textAfterAt.includes(' ') && textAfterAt.length <= 30) {
          setMentionStartIndex(lastAtIndex);
          setSearchQuery(textAfterAt);
          setIsOpen(true);
          return;
        }
      }
    }

    // Close dropdown if no valid mention context
    setIsOpen(false);
    setMentionStartIndex(null);
    setSearchQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen) return;

    // If loading, don't allow selection
    if (isLoadingMembers) {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        setMentionStartIndex(null);
        setSearchQuery('');
      }
      return;
    }

    if (filteredMembers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredMembers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        selectMember(filteredMembers[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setMentionStartIndex(null);
        setSearchQuery('');
        break;
    }
  };

  const selectMember = (member: TeamMember | undefined) => {
    if (!member || mentionStartIndex === null) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(cursorPosition);

    // Insert @Name with a trailing space
    const mentionText = `@${member.name} `;
    const newValue = beforeMention + mentionText + afterMention;
    onChange(newValue);

    // Update mentions
    const newMentioned = new Set(mentionedUserIds);
    newMentioned.add(member.id);
    setMentionedUserIds(newMentioned);
    onMentionsChange?.(Array.from(newMentioned));

    // Close dropdown
    setIsOpen(false);
    const startIndex = mentionStartIndex;
    setMentionStartIndex(null);
    setSearchQuery('');

    // Move cursor after the inserted mention
    const newCursorPosition = startIndex + mentionText.length;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Generate highlighted HTML with @mentions styled
  const highlightedContent = useMemo(() => {
    if (memberNames.length === 0) return escapeHtml(value);

    // Build regex to match all valid @mentions
    const mentionPattern = memberNames
      .map((name) => `@${escapeRegExp(name)}`)
      .join('|');

    if (!mentionPattern) return escapeHtml(value);

    const regex = new RegExp(`(${mentionPattern})(?=\\s|$)`, 'g');

    // Split and highlight
    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    const text = value;
    regex.lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push(escapeHtml(text.slice(lastIndex, match.index)));
      }
      // Add highlighted mention
      parts.push(
        `<span class="rounded bg-green-100 px-0.5 text-green-800 font-medium">${escapeHtml(match[0])}</span>`
      );
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(escapeHtml(text.slice(lastIndex)));
    }

    // Add a trailing space to match textarea behavior and preserve line breaks
    return parts.join('') + '\n';
  }, [value, memberNames]);

  // Determine if we should show the dropdown
  const showDropdown = isOpen && (isLoadingMembers || filteredMembers.length > 0);

  return (
    <Popover open={showDropdown} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div className={cn('relative', className)}>
          {/* Highlight overlay - renders behind the textarea */}
          <div
            ref={highlightRef}
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-md border border-transparent bg-transparent px-3 py-2 text-sm"
            style={{
              fontFamily: 'inherit',
              lineHeight: 'inherit',
              wordSpacing: 'inherit',
              letterSpacing: 'inherit',
            }}
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlightedContent }}
          />
          {/* Actual textarea - transparent background to show highlights */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            placeholder={placeholder}
            className={cn(
              'relative min-h-[80px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              // Make text transparent where highlights should show, but caret visible
              'caret-stone-900'
            )}
            style={{
              // Use a trick: text is transparent, but caret is visible
              color: 'transparent',
              caretColor: 'inherit',
            }}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-64 p-1"
        align="start"
        side="bottom"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {isLoadingMembers ? (
          <div className="flex items-center justify-center gap-2 px-3 py-3 text-sm text-stone-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading team members...</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="px-3 py-2 text-sm text-stone-500">No team members found</div>
        ) : (
          <ul className="max-h-48 overflow-y-auto">
            {filteredMembers.map((member, index) => (
              <li key={member.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-green-100 text-green-900'
                      : 'hover:bg-stone-100'
                  )}
                  onClick={() => selectMember(member)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700">
                    {member.name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="font-medium">{member.name}</div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
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

// Helper to compare two sets
function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
