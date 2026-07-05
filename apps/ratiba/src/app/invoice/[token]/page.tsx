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
  const agency = (invoice.fromDetails as InvoicePartyDetails | null)?.name ?? 'Ratiba';
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-[76px] font-mono text-[11px] tracking-wide text-[#878787] uppercase">
        {label}
      </span>
      <span className="font-mono text-[11px] text-[#878787]">:</span>
      <span className="font-mono text-[11px] text-neutral-950">{value}</span>
    </div>
  );
}

function Party({
  heading,
  details,
  fallbackName,
}: {
  heading: string;
  details: InvoicePartyDetails | null | undefined;
  fallbackName?: string;
}) {
  const name = details?.name || fallbackName || '';
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] tracking-wide text-[#878787] uppercase">
        {heading}
      </div>
      <div className="font-mono text-[11px] leading-[18px] text-neutral-950">
        {name ? <div>{name}</div> : null}
        {details?.email ? <div>{details.email}</div> : null}
        {details?.phone ? <div>{details.phone}</div> : null}
        {details?.address ? <div className="whitespace-pre-line">{details.address}</div> : null}
      </div>
    </div>
  );
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
  const paymentTerms = invoice.organization?.paymentTerms ?? null;
  const isDraft = !invoice.sentAt;

  return (
    <div className="min-h-screen bg-stone-50 py-10 font-sans text-neutral-950">
      <div className="mx-auto max-w-3xl px-4">
        {isDraft ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 font-mono text-[11px] font-medium tracking-wide text-amber-800 uppercase">
            Draft preview. This invoice has not been sent yet.
          </div>
        ) : null}

        <div className="mb-4 flex justify-end">
          <a
            href={`/invoice/${token}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md bg-stone-900 px-4 py-2 font-mono text-[11px] font-medium tracking-wide text-white uppercase transition-colors hover:bg-stone-700"
          >
            Download PDF
          </a>
        </div>

        <article className="overflow-hidden rounded-lg border border-stone-200 bg-white p-10 shadow-sm">
          <header className="flex items-start justify-between gap-5">
            <div className="flex flex-col gap-1.5">
              <MetaRow label="Invoice no" value={invoice.number} />
              {invoice.title ? <MetaRow label="Description" value={invoice.title} /> : null}
              <MetaRow label="Issue date" value={formatDate(invoice.issueDate)} />
              {invoice.dueDate ? (
                <MetaRow label="Due date" value={formatDate(invoice.dueDate)} />
              ) : null}
            </div>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={agencyName} className="h-14 w-14 object-contain" />
            ) : null}
          </header>

          <div className="mt-8 grid grid-cols-2 gap-6">
            <Party heading="From" details={from} fallbackName={agencyName} />
            <Party heading="Bill to" details={to} />
          </div>

          <div className="mt-10">
            <table className="w-full">
              <thead>
                <tr className="text-left font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                  <th className="pb-2 font-normal">Description</th>
                  <th className="pb-2 text-right font-normal">Qty</th>
                  <th className="pb-2 text-right font-normal">Unit price</th>
                  <th className="pb-2 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={`${item.id}-${index}`} className="align-top">
                    <td className="py-1.5 pr-4">
                      <div className="font-mono text-[11px] text-neutral-950">{item.name}</div>
                      {item.description ? (
                        <div className="font-mono text-[11px] text-[#878787]">
                          {item.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-1.5 text-right font-mono text-[11px] text-neutral-950">
                      {item.quantity}
                    </td>
                    <td className="py-1.5 text-right font-mono text-[11px] text-neutral-950">
                      {formatMoney(item.unitPriceCents, invoice.currency)}
                    </td>
                    <td className="py-1.5 text-right font-mono text-[11px] text-neutral-950">
                      {formatMoney(item.quantity * item.unitPriceCents, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-6 flex justify-end">
              <div className="w-[240px]">
                <div className="flex items-center justify-between py-1">
                  <span className="font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                    Subtotal
                  </span>
                  <span className="font-mono text-[11px] text-[#878787]">
                    {formatMoney(invoice.subtotalCents, invoice.currency)}
                  </span>
                </div>
                {invoice.taxRatePct ? (
                  <div className="flex items-center justify-between py-1">
                    <span className="font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                      Tax ({invoice.taxRatePct}%)
                    </span>
                    <span className="font-mono text-[11px] text-[#878787]">
                      {formatMoney(invoice.taxCents, invoice.currency)}
                    </span>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-3">
                  <span className="font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                    Total
                  </span>
                  <span className="font-mono text-[21px] font-medium text-neutral-950">
                    {formatMoney(invoice.totalCents, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {paymentTerms || invoice.notes ? (
            <div className="mt-10 grid grid-cols-2 gap-6">
              <div>
                {paymentTerms ? (
                  <>
                    <div className="mb-2 font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                      Payment details
                    </div>
                    <p className="font-mono text-[11px] leading-[18px] whitespace-pre-line text-neutral-950">
                      {paymentTerms}
                    </p>
                  </>
                ) : null}
              </div>
              <div>
                {invoice.notes ? (
                  <>
                    <div className="mb-2 font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                      Note
                    </div>
                    <p className="font-mono text-[11px] leading-[18px] whitespace-pre-line text-neutral-950">
                      {invoice.notes}
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </article>
      </div>
    </div>
  );
}
