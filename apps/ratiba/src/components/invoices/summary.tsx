'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { Label } from './label-input';
import { PercentInput } from './percent-input';
import { formatMoney, type InvoiceFormLineItem } from './form-types';

export function Summary() {
  const { control } = useFormContext();

  const lineItems = (useWatch({ control, name: 'lineItems' }) as InvoiceFormLineItem[]) || [];
  const taxRatePct = useWatch({ control, name: 'taxRatePct' }) as number | null;
  const currency = (useWatch({ control, name: 'currency' }) as string) || 'USD';

  const subtotal = lineItems.reduce(
    (acc, item) => acc + (item?.quantity ?? 0) * (item?.unitPrice ?? 0),
    0,
  );
  const tax = taxRatePct && taxRatePct > 0 ? (subtotal * taxRatePct) / 100 : 0;
  const total = subtotal + tax;

  return (
    <div className="flex w-[280px] flex-col">
      <div className="flex items-center justify-between py-1">
        <Label>Subtotal</Label>
        <span className="font-mono text-[11px] text-[#878787]">
          {formatMoney(subtotal, currency)}
        </span>
      </div>

      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-1">
          <Label>Tax</Label>
          <PercentInput name="taxRatePct" />
        </div>
        {taxRatePct != null && taxRatePct > 0 ? (
          <span className="font-mono text-[11px] text-[#878787]">
            {formatMoney(tax, currency)}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border py-4">
        <Label>Total</Label>
        <span className="text-right font-mono text-[21px] font-medium text-foreground">
          {formatMoney(total, currency)}
        </span>
      </div>
    </div>
  );
}
