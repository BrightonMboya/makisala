'use client';

import { Calendar } from '@repo/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Label } from './label-input';

function toIsoMidnight(date: Date): string {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return utc.toISOString();
}

export function InvoiceMeta() {
  const { control } = useFormContext();
  const number = useWatch({ control, name: 'number' });

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <Label>Invoice no</Label>
        <span className="font-mono text-[11px] text-[#878787]">:</span>
        <span className="font-mono text-[11px] text-foreground">{number}</span>
      </div>
      <DateRow name="issueDate" label="Issue date" />
      <DateRow name="dueDate" label="Due date" nullable />
    </div>
  );
}

function DateRow({
  name,
  label,
  nullable = false,
}: {
  name: string;
  label: string;
  nullable?: boolean;
}) {
  const { setValue, control } = useFormContext();
  const value = useWatch({ control, name }) as string | null;
  const [open, setOpen] = useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <span className="font-mono text-[11px] text-[#878787]">:</span>
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger
          className={cn(
            'font-mono text-[11px] text-foreground outline-none hover:text-[#15803d]',
            !selectedDate && 'text-[#878787]',
          )}
        >
          {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select'}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(d) => {
              if (d) {
                setValue(name, toIsoMidnight(d), { shouldDirty: true });
              } else if (nullable) {
                setValue(name, null, { shouldDirty: true });
              }
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
