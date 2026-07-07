'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
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

// African countries. `value` is the lowercase name stored in the DB, matching
// the existing `tanzania` / `rwanda` convention.
export const AFRICAN_COUNTRIES = [
  // Priority markets first, then the rest alphabetically.
  { value: 'tanzania', label: 'Tanzania', flag: '🇹🇿' },
  { value: 'rwanda', label: 'Rwanda', flag: '🇷🇼' },
  { value: 'kenya', label: 'Kenya', flag: '🇰🇪' },
  { value: 'botswana', label: 'Botswana', flag: '🇧🇼' },
  { value: 'algeria', label: 'Algeria', flag: '🇩🇿' },
  { value: 'angola', label: 'Angola', flag: '🇦🇴' },
  { value: 'benin', label: 'Benin', flag: '🇧🇯' },
  { value: 'burkina faso', label: 'Burkina Faso', flag: '🇧🇫' },
  { value: 'burundi', label: 'Burundi', flag: '🇧🇮' },
  { value: 'cabo verde', label: 'Cabo Verde', flag: '🇨🇻' },
  { value: 'cameroon', label: 'Cameroon', flag: '🇨🇲' },
  { value: 'central african republic', label: 'Central African Republic', flag: '🇨🇫' },
  { value: 'chad', label: 'Chad', flag: '🇹🇩' },
  { value: 'comoros', label: 'Comoros', flag: '🇰🇲' },
  { value: 'congo', label: 'Congo (Republic)', flag: '🇨🇬' },
  { value: 'dr congo', label: 'DR Congo', flag: '🇨🇩' },
  { value: "cote d'ivoire", label: "Côte d'Ivoire", flag: '🇨🇮' },
  { value: 'djibouti', label: 'Djibouti', flag: '🇩🇯' },
  { value: 'egypt', label: 'Egypt', flag: '🇪🇬' },
  { value: 'equatorial guinea', label: 'Equatorial Guinea', flag: '🇬🇶' },
  { value: 'eritrea', label: 'Eritrea', flag: '🇪🇷' },
  { value: 'eswatini', label: 'Eswatini', flag: '🇸🇿' },
  { value: 'ethiopia', label: 'Ethiopia', flag: '🇪🇹' },
  { value: 'gabon', label: 'Gabon', flag: '🇬🇦' },
  { value: 'gambia', label: 'Gambia', flag: '🇬🇲' },
  { value: 'ghana', label: 'Ghana', flag: '🇬🇭' },
  { value: 'guinea', label: 'Guinea', flag: '🇬🇳' },
  { value: 'guinea-bissau', label: 'Guinea-Bissau', flag: '🇬🇼' },
  { value: 'lesotho', label: 'Lesotho', flag: '🇱🇸' },
  { value: 'liberia', label: 'Liberia', flag: '🇱🇷' },
  { value: 'libya', label: 'Libya', flag: '🇱🇾' },
  { value: 'madagascar', label: 'Madagascar', flag: '🇲🇬' },
  { value: 'malawi', label: 'Malawi', flag: '🇲🇼' },
  { value: 'mali', label: 'Mali', flag: '🇲🇱' },
  { value: 'mauritania', label: 'Mauritania', flag: '🇲🇷' },
  { value: 'mauritius', label: 'Mauritius', flag: '🇲🇺' },
  { value: 'morocco', label: 'Morocco', flag: '🇲🇦' },
  { value: 'mozambique', label: 'Mozambique', flag: '🇲🇿' },
  { value: 'namibia', label: 'Namibia', flag: '🇳🇦' },
  { value: 'niger', label: 'Niger', flag: '🇳🇪' },
  { value: 'nigeria', label: 'Nigeria', flag: '🇳🇬' },
  { value: 'sao tome and principe', label: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { value: 'senegal', label: 'Senegal', flag: '🇸🇳' },
  { value: 'seychelles', label: 'Seychelles', flag: '🇸🇨' },
  { value: 'sierra leone', label: 'Sierra Leone', flag: '🇸🇱' },
  { value: 'somalia', label: 'Somalia', flag: '🇸🇴' },
  { value: 'south africa', label: 'South Africa', flag: '🇿🇦' },
  { value: 'south sudan', label: 'South Sudan', flag: '🇸🇸' },
  { value: 'sudan', label: 'Sudan', flag: '🇸🇩' },
  { value: 'togo', label: 'Togo', flag: '🇹🇬' },
  { value: 'tunisia', label: 'Tunisia', flag: '🇹🇳' },
  { value: 'uganda', label: 'Uganda', flag: '🇺🇬' },
  { value: 'zambia', label: 'Zambia', flag: '🇿🇲' },
  { value: 'zimbabwe', label: 'Zimbabwe', flag: '🇿🇼' },
] as const;

export function CountrySelect({
  value,
  onChange,
  placeholder = 'Select country',
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = AFRICAN_COUNTRIES.find((c) => c.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{selected.flag}</span>
              {selected.label}
            </span>
          ) : (
            <span className="text-stone-500">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search countries..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {AFRICAN_COUNTRIES.map((country) => (
                <CommandItem
                  key={country.value}
                  value={country.label}
                  onSelect={() => {
                    onChange(country.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === country.value ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="mr-2 text-base leading-none">{country.flag}</span>
                  {country.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
