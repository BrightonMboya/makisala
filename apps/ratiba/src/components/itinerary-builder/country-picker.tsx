'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/command';
import { AFRICAN_COUNTRIES } from '@/lib/countries';

type CountryOption = { value: string; label: string; flag: string };

export function CountryPicker({
  value,
  onChange,
  options = AFRICAN_COUNTRIES as unknown as CountryOption[],
  triggerLabel = 'Destinations:',
}: {
  value: string[];
  onChange: (countries: string[]) => void;
  options?: CountryOption[];
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggleCountry = (countryValue: string) => {
    if (value.includes(countryValue)) {
      onChange(value.filter((c) => c !== countryValue));
    } else {
      onChange([...value, countryValue]);
    }
  };

  const selectedCountries = options.filter((c) => value.includes(c.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-stone-50"
        >
          <span className="font-bold text-stone-700">{triggerLabel}</span>
          <div className="flex items-center gap-1.5">
            {selectedCountries.length > 0 ? (
              selectedCountries.map((c) => (
                <span key={c.value} className="flex items-center gap-1">
                  <span className="text-lg">{c.flag}</span>
                  <span className="text-stone-600">{c.label}</span>
                </span>
              ))
            ) : (
              <span className="text-stone-400">Select countries</span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList className="max-h-72">
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options.map((country) => {
                const isSelected = value.includes(country.value);
                return (
                  <CommandItem
                    key={country.value}
                    value={country.label}
                    onSelect={() => toggleCountry(country.value)}
                    className={isSelected ? 'bg-green-50 text-green-800 aria-selected:bg-green-50 aria-selected:text-green-800' : ''}
                  >
                    <span className="flex flex-1 items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span className="font-medium">{country.label}</span>
                    </span>
                    {isSelected && <X className="h-3.5 w-3.5 text-green-600" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
