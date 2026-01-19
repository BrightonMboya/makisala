'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@repo/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@repo/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';

interface AsyncComboboxProps {
  value: string | null;
  onChange: (value: string) => void;
  onSearch: (query: string) => Promise<{ value: string; label: string }[]>;
  onGetLabel?: (value: string) => Promise<string | null>;
  initialLabel?: string | null;
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function AsyncCombobox({
  value,
  onChange,
  onSearch,
  onGetLabel,
  initialLabel,
  placeholder = 'Select item...',
  className,
  debounceMs = 300,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [items, setItems] = React.useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false); // Track if a search has completed
  const [displayLabel, setDisplayLabel] = React.useState<string | null>(initialLabel ?? null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Don't fetch on open - let user search instead

  // Track if we've already fetched the label for this value
  const fetchedValueRef = React.useRef<string | null>(null);

  // Fetch label for selected value (skip if we already have a display label)
  React.useEffect(() => {
    if (!value) {
      setDisplayLabel(null);
      fetchedValueRef.current = null;
      return;
    }

    // Skip if we already have the correct label
    if (displayLabel) {
      fetchedValueRef.current = value;
      return;
    }

    // Skip if we already fetched for this value
    if (fetchedValueRef.current === value) return;

    // Check if value is in current items
    const found = items.find((item) => item.value === value);
    if (found) {
      setDisplayLabel(found.label);
      fetchedValueRef.current = value;
    } else if (onGetLabel) {
      // Fetch from server only if not already fetched
      fetchedValueRef.current = value;
      onGetLabel(value).then((label) => {
        if (label) setDisplayLabel(label);
      });
    }
  }, [value, items, onGetLabel, displayLabel]);

  // Handle search with debounce
  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchValue(query);

      // Show loading immediately when user types
      if (query) {
        setIsLoading(true);
        setHasSearched(false);
      } else {
        // Clear results when search is empty
        setItems([]);
        setIsLoading(false);
        setHasSearched(false);
      }

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (!query) return; // Don't search if empty

      debounceRef.current = setTimeout(async () => {
        const results = await onSearch(query);
        setItems(results);
        setIsLoading(false);
        setHasSearched(true);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Reset state when popover closes
  const handleOpenChange = React.useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchValue('');
      setItems([]);
      setHasSearched(false);
      setIsLoading(false);
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between font-normal', className)}
        >
          {displayLabel || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search...`}
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-stone-400" />
              </div>
            ) : items.length === 0 ? (
              <CommandEmpty>
                {hasSearched && searchValue ? 'No results found.' : 'Type to search...'}
              </CommandEmpty>
            ) : (
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
                        value === item.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {item.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
