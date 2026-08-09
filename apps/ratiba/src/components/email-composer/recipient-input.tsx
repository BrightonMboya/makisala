'use client';

import { X } from 'lucide-react';
import { useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Splits on the characters Gmail treats as recipient separators (comma,
// semicolon, whitespace) so a paste of "a@x.com, b@x.com c@x.com" becomes
// three candidate pills instead of one unparsed blob.
function splitCandidates(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

interface RecipientInputProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
  placeholder?: string;
}

// Gmail-style "To" field: typed addresses turn into removable pills on
// space, comma, semicolon, Enter, or Tab, and a paste of several addresses
// explodes into one pill per address. An unrecognized (non-email) pill stays
// editable and renders in red rather than being silently dropped, since the
// operator may still be mid-type.
export function RecipientInput({ recipients, onChange, placeholder }: RecipientInputProps) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addCandidates = (raw: string) => {
    const additions = splitCandidates(raw).filter((c) => !recipients.includes(c));
    if (additions.length > 0) onChange([...recipients, ...additions]);
  };

  const commitInput = () => {
    const value = inputValue.trim();
    if (!value) return;
    addCandidates(value);
    setInputValue('');
  };

  const removeRecipient = (target: string) => {
    onChange(recipients.filter((r) => r !== target));
  };

  // Click-to-edit (Gmail/Superhuman pattern): the pill drops back into plain,
  // pre-filled text in the input instead of forcing a remove-then-retype.
  const editRecipient = (target: string) => {
    onChange(recipients.filter((r) => r !== target));
    setInputValue(target);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === ' ' || e.key === 'Tab') {
      if (!inputValue.trim()) {
        if (e.key === 'Tab') return; // let focus move on naturally when empty
        e.preventDefault();
        return;
      }
      e.preventDefault();
      commitInput();
      return;
    }
    if (e.key === 'Backspace' && !inputValue && recipients.length > 0) {
      e.preventDefault();
      onChange(recipients.slice(0, -1));
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    if (!/[\s,;]/.test(text)) return; // single address: let the browser paste it normally
    e.preventDefault();
    addCandidates(text);
  };

  return (
    <div className="flex flex-1 flex-wrap items-center gap-1.5 py-0.5">
      {recipients.map((email) => (
        <span
          key={email}
          onClick={() => editRecipient(email)}
          title="Click to edit"
          className={cn(
            'inline-flex cursor-pointer items-center gap-1 rounded-full py-0.5 pl-2.5 pr-1 text-sm',
            EMAIL_RE.test(email)
              ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              : 'bg-red-50 text-red-600 ring-1 ring-red-200 hover:bg-red-100',
          )}
        >
          {email}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeRecipient(email);
            }}
            className="rounded-full p-0.5 text-stone-400 hover:bg-stone-300/60 hover:text-stone-600"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {email}</span>
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onBlur={commitInput}
        placeholder={recipients.length === 0 ? placeholder : ''}
        className="min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-0"
      />
    </div>
  );
}
