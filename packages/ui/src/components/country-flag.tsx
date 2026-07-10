'use client';
import React from 'react';
import { CircleFlag } from 'react-circle-flags';
import { countries } from 'country-data-list';
import { cn } from '../cn';

interface Country {
  alpha2: string;
  name: string;
  status: string;
}

function resolveCountry(value: string): Country | undefined {
  return countries.all.find(
    (country: Country) =>
      country.name === value ||
      country.alpha2 === value ||
      country.alpha2 === value?.toUpperCase(),
  );
}

interface CountryFlagProps {
  /** Country name (e.g. "United States") or alpha2 code (e.g. "US"). */
  country: string | null | undefined;
  /** Show the country name next to the flag. Defaults to true. */
  showName?: boolean;
  className?: string;
  size?: number;
}

export function CountryFlag({
  country,
  showName = true,
  className,
  size = 20,
}: CountryFlagProps) {
  const resolved = country ? resolveCountry(country) : undefined;

  if (!resolved) {
    return <span className={cn('text-gray-600', className)}>{country || '-'}</span>;
  }

  return (
    <span className={cn('flex items-center gap-2 text-gray-600', className)}>
      <span
        className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ height: size, width: size }}
      >
        <CircleFlag countryCode={resolved.alpha2.toLowerCase()} height={size} />
      </span>
      {showName && (
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">{resolved.name}</span>
      )}
    </span>
  );
}
