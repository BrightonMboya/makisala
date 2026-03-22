'use client';

import { X } from 'lucide-react';
import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover';

const AVAILABLE_COUNTRIES = [
  { value: 'rwanda', label: 'Rwanda', flag: '\u{1F1F7}\u{1F1FC}' },
  { value: 'tanzania', label: 'Tanzania', flag: '\u{1F1F9}\u{1F1FF}' },
  { value: 'botswana', label: 'Botswana', flag: '\u{1F1E7}\u{1F1FC}' },
  { value: 'kenya', label: 'Kenya', flag: '\u{1F1F0}\u{1F1EA}' },
  { value: 'uganda', label: 'Uganda', flag: '\u{1F1FA}\u{1F1EC}' },
] as const;

export function CountryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (countries: string[]) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggleCountry = (countryValue: string) => {
    if (value.includes(countryValue)) {
      onChange(value.filter((c) => c !== countryValue));
    } else {
      onChange([...value, countryValue]);
    }
  };

  const selectedCountries = AVAILABLE_COUNTRIES.filter((c) => value.includes(c.value));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-stone-50">
          <span className="font-bold text-stone-700">Destinations:</span>
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
      <PopoverContent className="w-64 p-2" align="end">
        <div className="space-y-1">
          <p className="px-2 py-1 text-xs font-semibold text-stone-500 uppercase">
            Select Countries
          </p>
          {AVAILABLE_COUNTRIES.map((country) => {
            const isSelected = value.includes(country.value);
            return (
              <button
                key={country.value}
                onClick={() => toggleCountry(country.value)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-green-50 text-green-800'
                    : 'text-stone-700 hover:bg-stone-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-lg">{country.flag}</span>
                  <span className="font-medium">{country.label}</span>
                </span>
                {isSelected && (
                  <X className="h-3.5 w-3.5 text-green-600" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
