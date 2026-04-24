'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export function PercentInput({
  name,
  className,
  disabled,
}: {
  name: string;
  className?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Editable
          value={field.value as number | null}
          onChange={(v) => field.onChange(v)}
          className={className}
          disabled={disabled}
        />
      )}
    />
  );
}

function Editable({
  value,
  onChange,
  className,
  disabled,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  className?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(value == null ? '' : String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value == null ? '' : String(value));
  }, [value, focused]);

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={draft}
        placeholder="0"
        disabled={disabled}
        onFocus={() => {
          setFocused(true);
          requestAnimationFrame(() => inputRef.current?.select());
        }}
        onBlur={() => {
          setFocused(false);
          if (draft.trim() === '') {
            onChange(null);
            setDraft('');
            return;
          }
          const parsed = parseFloat(draft.replace(/[,\s]/g, ''));
          const next = Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : null;
          onChange(next);
          setDraft(next == null ? '' : String(next));
        }}
        onChange={(e) => setDraft(e.target.value)}
        className={cn(
          'w-10 border-none bg-transparent p-0 text-right font-mono text-[11px] text-foreground outline-none focus:ring-0',
          'placeholder:text-[#878787]/60 disabled:cursor-not-allowed disabled:opacity-60',
          className,
        )}
      />
      <span className="ml-0.5 font-mono text-[11px] text-[#878787]">%</span>
    </div>
  );
}
