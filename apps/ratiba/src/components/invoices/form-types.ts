import type { InvoiceLineItem, InvoicePartyDetails } from '@repo/db/schema';

export interface InvoiceFormLineItem {
  id: string;
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  included?: boolean | null;
}

export interface InvoiceFormValues {
  id: string;
  number: string;
  title: string | null;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  lineItems: InvoiceFormLineItem[];
  taxRatePct: number | null;
  notes: string | null;
  fromDetails: InvoicePartyDetails | null;
  toDetails: InvoicePartyDetails | null;
  sentAt: string | null;
  shareToken: string | null;
}

export function toFormLineItems(items: InvoiceLineItem[]): InvoiceFormLineItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    quantity: item.quantity,
    unitPrice: item.unitPriceCents / 100,
    included: item.included ?? true,
  }));
}

export function toWireLineItems(items: InvoiceFormLineItem[]): InvoiceLineItem[] {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description ?? null,
    quantity: item.quantity,
    unitPriceCents: Math.round((item.unitPrice ?? 0) * 100),
    included: item.included ?? true,
  }));
}

export function formatMoney(amount: number, currency: string, max = 2): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: max,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(max)}`;
  }
}
