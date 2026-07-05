'use client';

import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
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
          const party = field.value as InvoicePartyDetails | null;
          return (
            <div className="flex flex-col gap-1.5">
              <PartyTextarea
                value={party}
                onChange={field.onChange}
                placeholder={placeholder}
                readOnly={readOnly}
              />
              <input
                className={cn(
                  'w-full border-none bg-transparent p-0 text-[11px] leading-[18px] text-foreground outline-none focus:ring-0',
                  'placeholder:text-[#878787]',
                )}
                value={party?.taxId ?? ''}
                placeholder="Tax ID / VAT (optional)"
                readOnly={readOnly}
                onChange={(e) =>
                  field.onChange({ ...(party ?? {}), taxId: e.target.value || null })
                }
              />
            </div>
          );
        }}
      />
    </div>
  );
}

/**
 * Keeps the raw textarea text in local state so keystrokes (Enter, blank lines)
 * survive. The structured value is parsed on change for storage, but we never let
 * the lossy value -> text round-trip clobber what the user is typing: we only
 * re-seed from the form value when it changes from *outside* this component
 * (e.g. switching invoices / form reset).
 */
function PartyTextarea({
  value,
  onChange,
  placeholder,
  readOnly,
}: {
  value: InvoicePartyDetails | null;
  onChange: (next: InvoicePartyDetails) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [text, setText] = useState(() => partyToText(value));
  // What the current form value formats back to. If an incoming value differs from
  // this, the change came from outside (not our own onChange) and we adopt it.
  const emittedRef = useRef(text);

  const incoming = partyToText(value);
  useEffect(() => {
    if (incoming !== emittedRef.current) {
      emittedRef.current = incoming;
      setText(incoming);
    }
  }, [incoming]);

  const handleChange = (raw: string) => {
    setText(raw);
    const parsed = textToParty(raw, value ?? {});
    emittedRef.current = partyToText(parsed);
    onChange(parsed);
  };

  return (
    <textarea
      className={cn(
        'min-h-[90px] w-full resize-none border-none bg-transparent p-0 text-[11px] leading-[18px] text-foreground outline-none focus:ring-0',
        'placeholder:text-[#878787]',
        !text &&
          !readOnly &&
          'bg-[repeating-linear-gradient(-60deg,#DBDBDB,#DBDBDB_1px,transparent_1px,transparent_5px)] dark:bg-[repeating-linear-gradient(-60deg,#2C2C2C,#2C2C2C_1px,transparent_1px,transparent_5px)]',
      )}
      value={text}
      placeholder={placeholder}
      readOnly={readOnly}
      onChange={(e) => handleChange(e.target.value)}
    />
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
