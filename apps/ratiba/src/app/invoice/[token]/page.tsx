import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { createServerCaller } from '@/server/trpc/caller';
import type { InvoiceLineItem, InvoicePartyDetails } from '@repo/db/schema';

type Props = {
  params: Promise<{ token: string }>;
};

const getCachedInvoice = cache(async (token: string) => {
  const trpc = await createServerCaller();
  try {
    return await trpc.invoices.getByToken({ token });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const invoice = await getCachedInvoice(token);
  if (!invoice) return { title: 'Invoice not found' };
  const agency =
    (invoice.fromDetails as InvoicePartyDetails | null)?.name ?? 'Ratiba';
  return { title: `Invoice ${invoice.number} — ${agency}` };
}

function formatMoney(cents: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

export default async function PublicInvoicePage({ params }: Props) {
  const { token } = await params;
  const invoice = await getCachedInvoice(token);
  if (!invoice) notFound();

  const from = invoice.fromDetails as InvoicePartyDetails | null;
  const to = invoice.toDetails as InvoicePartyDetails | null;
  const lineItems: InvoiceLineItem[] = invoice.lineItems ?? [];
  const agencyName = from?.name ?? invoice.organization?.name ?? 'Travel Agency';
  const logoUrl = from?.logoUrl ?? invoice.organization?.logoUrl ?? null;
  const isDraft = !invoice.sentAt;

  return (
    <div className="min-h-screen bg-stone-50 py-10 font-sans text-stone-900">
      <div className="mx-auto max-w-3xl px-4">
        {isDraft ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
            Draft preview. This invoice has not been sent yet.
          </div>
        ) : null}

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={agencyName} className="h-10 w-auto object-contain" />
            ) : null}
            <div className="font-serif text-xl font-bold text-green-800">{agencyName}</div>
          </div>
          <a
            href={`/invoice/${token}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-800"
          >
            Download PDF
          </a>
        </div>

        <article className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
          <header className="flex items-start justify-between border-b-2 border-green-700 px-8 py-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Invoice</p>
              <h1 className="mt-1 font-serif text-3xl font-bold text-green-800">
                {invoice.number}
              </h1>
              {invoice.title ? (
                <p className="mt-2 text-base text-stone-700">{invoice.title}</p>
              ) : null}
            </div>
            <div className="text-right text-sm">
              <div>
                <span className="text-stone-500">Issue date</span>
                <div className="font-semibold">{formatDate(invoice.issueDate)}</div>
              </div>
              {invoice.dueDate ? (
                <div className="mt-2">
                  <span className="text-stone-500">Due date</span>
                  <div className="font-semibold">{formatDate(invoice.dueDate)}</div>
                </div>
              ) : null}
            </div>
          </header>

          <div className="grid grid-cols-1 gap-6 px-8 py-6 md:grid-cols-2">
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                From
              </h2>
              <div className="text-sm leading-relaxed">
                <div className="font-semibold">{from?.name ?? agencyName}</div>
                {from?.email ? <div>{from.email}</div> : null}
                {from?.phone ? <div>{from.phone}</div> : null}
                {from?.address ? <div className="whitespace-pre-line">{from.address}</div> : null}
              </div>
            </div>
            <div>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Bill to
              </h2>
              <div className="text-sm leading-relaxed">
                <div className="font-semibold">{to?.name ?? 'Guest'}</div>
                {to?.email ? <div>{to.email}</div> : null}
                {to?.phone ? <div>{to.phone}</div> : null}
                {to?.address ? <div className="whitespace-pre-line">{to.address}</div> : null}
              </div>
            </div>
          </div>

          <div className="border-t border-stone-200 px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-green-700 text-left text-xs uppercase tracking-wide text-stone-500">
                  <th className="py-2 font-semibold">Description</th>
                  <th className="py-2 text-right font-semibold">Qty</th>
                  <th className="py-2 text-right font-semibold">Unit price</th>
                  <th className="py-2 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b border-stone-100">
                    <td className="py-3">
                      <div className="font-medium">{item.name}</div>
                      {item.description ? (
                        <div className="text-xs text-stone-500">{item.description}</div>
                      ) : null}
                    </td>
                    <td className="py-3 text-right font-medium">{item.quantity}</td>
                    <td className="py-3 text-right">
                      {formatMoney(item.unitPriceCents, invoice.currency)}
                    </td>
                    <td className="py-3 text-right font-medium">
                      {formatMoney(item.quantity * item.unitPriceCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="ml-auto mt-6 w-full max-w-sm text-sm">
              <div className="flex justify-between py-1">
                <span className="text-stone-600">Subtotal</span>
                <span className="font-medium">
                  {formatMoney(invoice.subtotalCents, invoice.currency)}
                </span>
              </div>
              {invoice.taxRatePct ? (
                <div className="flex justify-between py-1">
                  <span className="text-stone-600">Tax ({invoice.taxRatePct}%)</span>
                  <span className="font-medium">
                    {formatMoney(invoice.taxCents, invoice.currency)}
                  </span>
                </div>
              ) : null}
              <div className="mt-2 flex justify-between border-t-2 border-green-700 pt-2">
                <span className="font-serif text-base font-bold text-green-800">Total due</span>
                <span className="font-serif text-lg font-bold text-green-800">
                  {formatMoney(invoice.totalCents, invoice.currency)}
                </span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <div className="border-t border-stone-200 px-8 py-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">
                Notes
              </h2>
              <p className="whitespace-pre-line text-sm text-stone-700">{invoice.notes}</p>
            </div>
          ) : null}
        </article>

        <p className="mt-6 text-center text-xs text-stone-500">
          Questions? Reply to the email this invoice arrived in.
        </p>
      </div>
    </div>
  );
}
