'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '../cn';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export function DatePicker({
  date,
  setDate,
}: {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          className="w-full"
          classNames={{ root: 'w-full', month: 'w-full' }}
          defaultMonth={date}
          selected={date}
          onSelect={(d) => {
            setDate(d);
            setOpen(false);
          }}
          startMonth={new Date()}
          endMonth={new Date(new Date().getFullYear() + 3, 11)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
