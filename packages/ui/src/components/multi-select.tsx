'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';

import { cn } from '../cn';
import { Badge } from './badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export type MultiSelectOption = { value: string; label: string };

/**
 * MultiSelect — searchable combobox where chosen items render as removable
 * pills inside the trigger. Built on Command + Popover + Badge.
 *
 * When `creatable` is set, typing a value that isn't already an option shows a
 * "Create …" row that adds the typed text as a new selection.
 */
export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder,
  emptyText = 'No item found.',
  className,
  disabled,
  creatable = false,
  createLabel = 'Create',
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  creatable?: boolean;
  createLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const remove = (value: string) => onChange(selected.filter((v) => v !== value));

  const labelFor = (value: string) =>
    options.find((o) => o.value === value)?.label ?? value;

  const trimmed = searchValue.trim();

  const filteredOptions = React.useMemo(() => {
    if (!trimmed) return options;
    return options.filter((o) => o.label.toLowerCase().includes(trimmed.toLowerCase()));
  }, [options, trimmed]);

  const showCreate =
    creatable &&
    !!trimmed &&
    !options.some((o) => o.label.toLowerCase() === trimmed.toLowerCase()) &&
    !selected.some((v) => v.toLowerCase() === trimmed.toLowerCase());

  const handleCreate = () => {
    if (!trimmed) return;
    if (!selected.includes(trimmed)) onChange([...selected, trimmed]);
    setSearchValue('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'border-input bg-background ring-offset-background focus-visible:ring-ring flex min-h-9 w-full items-center justify-between gap-2 rounded-md border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap gap-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((value) => (
                <Badge
                  key={value}
                  variant="secondary"
                  className="gap-1 pr-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  {labelFor(value)}
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label={`Remove ${labelFor(value)}`}
                    className="hover:bg-muted-foreground/20 flex items-center justify-center rounded-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      remove(value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        remove(value);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder ?? `Search ${placeholder.toLowerCase()}...`}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {filteredOptions.length === 0 && !showCreate ? (
              <CommandEmpty>{emptyText}</CommandEmpty>
            ) : (
              <>
                <CommandGroup>
                  {filteredOptions.map((option) => {
                    const isSelected = selected.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={() => {
                          toggle(option.value);
                          setSearchValue('');
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')}
                        />
                        {option.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {showCreate && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem className="text-green-600" onSelect={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        {createLabel}: {trimmed}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
