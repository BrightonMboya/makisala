'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

export function QuantityInput({
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
          value={(field.value as number) ?? 0}
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
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(value > 0 ? String(value) : '');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(value > 0 ? String(value) : '');
  }, [value, focused]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={draft}
      placeholder="0"
      disabled={disabled}
      onFocus={() => {
        setFocused(true);
        requestAnimationFrame(() => inputRef.current?.select());
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseFloat(draft.replace(/[,\s]/g, ''));
        const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
        onChange(next);
        setDraft(next > 0 ? String(next) : '');
      }}
      onChange={(e) => setDraft(e.target.value)}
      className={cn(
        'w-full border-none bg-transparent p-0 text-right font-mono text-[11px] text-foreground outline-none focus:ring-0',
        'placeholder:text-[#878787]/60 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    />
  );
}
