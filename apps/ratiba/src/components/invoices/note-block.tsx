'use client';

import { cn } from '@/lib/utils';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from './label-input';

interface NoteBlockProps {
  name: string;
  label: string;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
  value?: string;
}

export function NoteBlock({ name, label, placeholder, readOnly, rows = 3, value }: NoteBlockProps) {
  const { control } = useFormContext();

  if (value !== undefined) {
    // read-only fixed value (e.g., payment terms from org)
    return (
      <div className="flex flex-col gap-2">
        <Label>{label}</Label>
        <p className="whitespace-pre-wrap text-[11px] leading-[18px] text-foreground">
          {value || <span className="text-[#878787]">{placeholder}</span>}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <textarea
            rows={rows}
            className={cn(
              'min-h-[78px] w-full resize-none border-none bg-transparent p-0 text-[11px] leading-[18px] text-foreground outline-none focus:ring-0',
              'placeholder:text-[#878787]',
            )}
            value={(field.value as string | null) ?? ''}
            placeholder={placeholder}
            readOnly={readOnly}
            onChange={(e) => field.onChange(e.target.value || null)}
          />
        )}
      />
    </div>
  );
}
