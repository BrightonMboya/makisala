'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

interface AmountInputProps {
  name: string;
  placeholder?: string;
  className?: string;
  allowNegative?: boolean;
  maximumFractionDigits?: number;
  disabled?: boolean;
}

function formatDisplay(value: number, maximumFractionDigits = 2): string {
  if (!Number.isFinite(value)) return '';
  if (value === 0) return '';
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

function parseInput(raw: string): number {
  const cleaned = raw.replace(/[,\s]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : 0;
}

export function AmountInput({
  name,
  placeholder = '0.00',
  className,
  allowNegative = false,
  maximumFractionDigits = 2,
  disabled,
}: AmountInputProps) {
  const { control } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <EditableAmount
          value={(field.value as number) ?? 0}
          onChange={(v) => field.onChange(v)}
          placeholder={placeholder}
          className={className}
          allowNegative={allowNegative}
          maximumFractionDigits={maximumFractionDigits}
          disabled={disabled}
        />
      )}
    />
  );
}

interface EditableAmountProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  allowNegative?: boolean;
  maximumFractionDigits?: number;
  disabled?: boolean;
}

function EditableAmount({
  value,
  onChange,
  placeholder,
  className,
  allowNegative,
  maximumFractionDigits = 2,
  disabled,
}: EditableAmountProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<string>(formatDisplay(value, maximumFractionDigits));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setDraft(formatDisplay(value, maximumFractionDigits));
  }, [value, focused, maximumFractionDigits]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="decimal"
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={() => {
        setFocused(true);
        setDraft(value === 0 ? '' : String(value));
        requestAnimationFrame(() => inputRef.current?.select());
      }}
      onBlur={() => {
        setFocused(false);
        const parsed = parseInput(draft);
        const next = allowNegative ? parsed : Math.max(0, parsed);
        onChange(next);
        setDraft(formatDisplay(next, maximumFractionDigits));
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
