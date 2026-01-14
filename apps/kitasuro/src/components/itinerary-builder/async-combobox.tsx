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
  placeholder?: string;
  className?: string;
  debounceMs?: number;
}

export function AsyncCombobox({
  value,
  onChange,
  onSearch,
  onGetLabel,
  placeholder = 'Select item...',
  className,
  debounceMs = 300,
}: AsyncComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [items, setItems] = React.useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [displayLabel, setDisplayLabel] = React.useState<string | null>(null);
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch initial suggestions when opening
  React.useEffect(() => {
    if (open && items.length === 0) {
      setIsLoading(true);
      onSearch('').then((results) => {
        setItems(results);
        setIsLoading(false);
      });
    }
  }, [open]);

  // Fetch label for selected value
  React.useEffect(() => {
    if (value && onGetLabel) {
      // Check if value is in current items
      const found = items.find((item) => item.value === value);
      if (found) {
        setDisplayLabel(found.label);
      } else {
        // Fetch from server
        onGetLabel(value).then((label) => {
          setDisplayLabel(label);
        });
      }
    } else if (!value) {
      setDisplayLabel(null);
    }
  }, [value, items, onGetLabel]);

  // Handle search with debounce
  const handleSearch = React.useCallback(
    (query: string) => {
      setSearchValue(query);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(async () => {
        setIsLoading(true);
        const results = await onSearch(query);
        setItems(results);
        setIsLoading(false);
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

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
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
              <CommandEmpty>No results found.</CommandEmpty>
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
                      setSearchValue('');
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
