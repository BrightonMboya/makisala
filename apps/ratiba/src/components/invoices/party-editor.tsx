'use client';

import { cn } from '@/lib/utils';
import { Controller, useFormContext } from 'react-hook-form';
import { Label } from './label-input';
import type { InvoicePartyDetails } from '@repo/db/schema';

interface PartyEditorProps {
  name: 'fromDetails' | 'toDetails';
  label: string;
  placeholder?: string;
  readOnly?: boolean;
}

export function PartyEditor({ name, label, placeholder, readOnly }: PartyEditorProps) {
  const { control } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = (field.value as InvoicePartyDetails | null) ?? {};
          const asText = partyToText(value);
          return (
            <textarea
              className={cn(
                'min-h-[90px] w-full resize-none border-none bg-transparent p-0 text-[11px] leading-[18px] text-foreground outline-none focus:ring-0',
                'placeholder:text-[#878787]',
                !asText &&
                  !readOnly &&
                  'bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]',
              )}
              value={asText}
              placeholder={placeholder}
              readOnly={readOnly}
              onChange={(e) => field.onChange(textToParty(e.target.value, value))}
            />
          );
        }}
      />
    </div>
  );
}

function partyToText(p: InvoicePartyDetails | null | undefined): string {
  if (!p) return '';
  return [p.name, p.email, p.phone, p.address].filter(Boolean).join('\n');
}

function textToParty(
  text: string,
  previous: InvoicePartyDetails,
): InvoicePartyDetails {
  const lines = text.split('\n');
  const [name, email, phone, ...rest] = lines;
  return {
    ...previous,
    name: name || null,
    email: email || null,
    phone: phone || null,
    address: rest.length ? rest.join('\n') : null,
  };
}
