'use client';

import { cn } from '@/lib/utils';
import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Plus, X } from 'lucide-react';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { AmountInput } from './amount-input';
import { QuantityInput } from './quantity-input';
import { Label } from './label-input';
import { formatMoney, type InvoiceFormLineItem } from './form-types';

const GRID = 'grid-cols-[1.5fr_12%_22%_18%]';

export function LineItems({ readOnly }: { readOnly?: boolean }) {
  const { control } = useFormContext();
  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'lineItems',
  });
  const currency = (useWatch({ control, name: 'currency' }) as string) || 'USD';

  const reorderList = (newFields: typeof fields) => {
    const firstDiffIndex = fields.findIndex(
      (field, index) => field.id !== newFields[index]?.id,
    );
    if (firstDiffIndex === -1) return;
    const newIndex = newFields.findIndex(
      (field) => field.id === fields[firstDiffIndex]?.id,
    );
    if (newIndex !== -1) swap(firstDiffIndex, newIndex);
  };

  const handleRemove = (index: number) => {
    if (fields.length > 1) remove(index);
  };

  return (
    <div className="space-y-4">
      <div className={cn('mb-2 grid items-end gap-4', GRID)}>
        <Label>Description</Label>
        <Label>Qty</Label>
        <Label>Unit price</Label>
        <Label className="text-right">Total</Label>
      </div>

      <Reorder.Group
        axis="y"
        values={fields}
        onReorder={reorderList}
        className="!m-0"
        transition={{ duration: 0 }}
      >
        {fields.map((field, index) => (
          <LineItemRow
            key={field.id}
            item={field as unknown as InvoiceFormLineItem}
            index={index}
            handleRemove={handleRemove}
            isReorderable={fields.length > 1 && !readOnly}
            currency={currency}
            readOnly={readOnly}
          />
        ))}
      </Reorder.Group>

      {!readOnly ? (
        <button
          type="button"
          onClick={() =>
            append({
              id: Math.random().toString(36).slice(2, 10),
              name: '',
              quantity: 1,
              unitPrice: 0,
            })
          }
          className="flex items-center gap-1.5 font-mono text-[11px] text-[#878787] hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          Add item
        </button>
      ) : null}
    </div>
  );
}

interface LineItemRowProps {
  index: number;
  handleRemove: (index: number) => void;
  isReorderable: boolean;
  item: InvoiceFormLineItem;
  currency: string;
  readOnly?: boolean;
}

function LineItemRow({
  index,
  handleRemove,
  isReorderable,
  item,
  currency,
  readOnly,
}: LineItemRowProps) {
  const controls = useDragControls();
  const { control } = useFormContext();

  const quantity = useWatch({ control, name: `lineItems.${index}.quantity` }) as number;
  const unitPrice = useWatch({
    control,
    name: `lineItems.${index}.unitPrice`,
  }) as number;

  const lineTotalDollars = (quantity ?? 0) * (unitPrice ?? 0);

  return (
    <Reorder.Item
      className={cn('group relative mb-2 grid w-full items-start gap-4', GRID)}
      value={item}
      dragListener={false}
      dragControls={controls}
      transition={{ duration: 0 }}
    >
      {isReorderable ? (
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className="absolute -left-6 top-0.5 opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Reorder"
        >
          <GripVertical className="h-3.5 w-3.5 text-[#878787]" />
        </button>
      ) : null}

      <Controller
        control={control}
        name={`lineItems.${index}.name`}
        render={({ field }) => (
          <input
            type="text"
            value={field.value ?? ''}
            disabled={readOnly}
            placeholder="Item name"
            onChange={field.onChange}
            className="w-full border-none bg-transparent p-0 text-[11px] text-foreground outline-none placeholder:text-[#878787]/60 focus:ring-0 disabled:opacity-60"
          />
        )}
      />

      <QuantityInput name={`lineItems.${index}.quantity`} disabled={readOnly} />

      <AmountInput name={`lineItems.${index}.unitPrice`} disabled={readOnly} />

      <div className="text-right">
        <span className="font-mono text-[11px] text-foreground">
          {formatMoney(lineTotalDollars, currency)}
        </span>
      </div>

      {!readOnly && index !== 0 ? (
        <button
          type="button"
          onClick={() => handleRemove(index)}
          className="absolute -right-6 top-0.5 text-[#878787] opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
          aria-label="Remove"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </Reorder.Item>
  );
}
