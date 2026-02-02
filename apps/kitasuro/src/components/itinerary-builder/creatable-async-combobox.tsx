'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@repo/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@repo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';

interface CreatableAsyncComboboxProps {
  value: string | null;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<{ value: string; label: string }[]>;
  onCreate?: (name: string) => Promise<{ value: string; label: string } | null>;
  onGetLabel?: (value: string) => Promise<string | null>;
  initialLabel?: string | null;
  placeholder?: string;
  createLabel?: string;
  className?: string;
  debounceMs?: number;
}

export function CreatableAsyncCombobox({
  value,
  onChange,
  onSearch,
  onCreate,
  onGetLabel,
  initialLabel,
  placeholder = 'Select item...',
  createLabel = 'Use',
  className,
  debounceMs = 300,
}: CreatableAsyncComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [items, setItems] = React.useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState<string | null>(initialLabel ?? null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);
  const fetchedValueRef = React.useRef<string | null>(null);

  // Fetch initial items when popover opens
  React.useEffect(() => {
    if (open && items.length === 0 && !hasSearched) {
      setIsLoading(true);
      onSearch('').then((results) => {
        setItems(results);
        setIsLoading(false);
        setHasSearched(true);
      });
    }
  }, [open]);

  // Resolve display label for selected value
  React.useEffect(() => {
    if (!value) {
      setDisplayLabel(null);
      fetchedValueRef.current = null;
      return;
    }

    if (displayLabel) {
      fetchedValueRef.current = value;
      return;
    }

    if (fetchedValueRef.current === value) return;

    const found = items.find((item) => item.value === value);
    if (found) {
      setDisplayLabel(found.label);
      fetchedValueRef.current = value;
    } else if (onGetLabel) {
      fetchedValueRef.current = value;
      onGetLabel(value).then((label) => {
        if (label) setDisplayLabel(label);
      });
    } else {
      // For custom text values (non-UUID), use the value itself as label
      setDisplayLabel(value);
      fetchedValueRef.current = value;
    }
  }, [value, items, onGetLabel, displayLabel]);

  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchValue(query);
      setIsLoading(true);
      setHasSearched(false);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        const results = await onSearch(query);
        setItems(results);
        setIsLoading(false);
        setHasSearched(true);
      }, debounceMs);
    },
    [onSearch, debounceMs],
  );

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchValue('');
      setItems([]);
      setHasSearched(false);
      setIsLoading(false);
    }
  }, []);

  const handleCreate = React.useCallback(async () => {
    if (!searchValue.trim()) return;

    if (onCreate) {
      setIsCreating(true);
      const result = await onCreate(searchValue.trim());
      setIsCreating(false);
      if (result) {
        onChange(result.value);
        setDisplayLabel(result.label);
        setOpen(false);
      }
    } else {
      // No onCreate handler - use the raw text as the value
      onChange(searchValue.trim());
      setDisplayLabel(searchValue.trim());
      setOpen(false);
    }
  }, [searchValue, onCreate, onChange]);

  const showCreateOption =
    hasSearched &&
    searchValue.trim() &&
    !items.some((item) => item.label.toLowerCase() === searchValue.trim().toLowerCase());

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate">{displayLabel || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
              </div>
            ) : items.length === 0 && !showCreateOption ? (
              <CommandEmpty>
                {hasSearched ? 'No results found.' : 'Type to search...'}
              </CommandEmpty>
            ) : (
              <>
                <CommandGroup>
                  {items.map((item) => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={(currentValue) => {
                        onChange(currentValue === value ? '' : currentValue);
                        setDisplayLabel(item.label);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === item.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {showCreateOption && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreate}
                        className="text-green-600"
                        disabled={isCreating}
                      >
                        {isCreating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="mr-2 h-4 w-4" />
                        )}
                        {createLabel}: {searchValue.trim()}
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
