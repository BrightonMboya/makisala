import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import { createServerCaller } from '@/server/trpc/caller';
import type {
  InvoiceLineItem,
  InvoicePartyDetails,
  InvoicePaymentMethod,
} from '@repo/db/schema';
import { lineTotalCents } from '@/lib/invoices/seed-from-proposal';

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
        {details?.taxId ? <div>Tax ID: {details.taxId}</div> : null}
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
  const paymentMethods: InvoicePaymentMethod[] = invoice.paymentMethods ?? [];
  const agencyName = from?.name ?? invoice.organization?.name ?? 'Travel Agency';
  const logoUrl = from?.logoUrl ?? invoice.organization?.logoUrl ?? null;
  const isDraft = !invoice.sentAt;
  const isPaid = invoice.status === 'paid';
  const partiallyPaid =
    invoice.amountPaidCents > 0 && invoice.amountPaidCents < invoice.totalCents;

  return (
    <div className="min-h-screen bg-stone-50 py-10 font-sans text-neutral-950">
      <div className="mx-auto max-w-3xl px-4">
        {isDraft ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-2 font-mono text-[11px] font-medium tracking-wide text-amber-800 uppercase">
            Draft preview. This invoice has not been sent yet.
          </div>
        ) : isPaid ? (
          <div className="mb-4 rounded-md border border-[#15803d]/30 bg-[#15803d]/10 px-4 py-2 font-mono text-[11px] font-medium tracking-wide text-[#15803d] uppercase">
            Paid in full. Thank you.
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
                      {formatMoney(lineTotalCents(item), invoice.currency)}
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
                {partiallyPaid ? (
                  <>
                    <div className="flex items-center justify-between py-1 pt-3">
                      <span className="font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                        Amount paid
                      </span>
                      <span className="font-mono text-[11px] text-[#878787]">
                        -{formatMoney(invoice.amountPaidCents, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                        Balance due
                      </span>
                      <span className="font-mono text-[11px] font-medium text-neutral-950">
                        {formatMoney(
                          invoice.totalCents - invoice.amountPaidCents,
                          invoice.currency,
                        )}
                      </span>
                    </div>
                  </>
                ) : null}
                {isPaid ? (
                  <div className="mt-3 flex justify-end">
                    <span className="rounded bg-[#15803d] px-2 py-1 font-mono text-[10px] tracking-wide text-white uppercase">
                      Paid in full
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {!isPaid && paymentMethods.length > 0 ? (
            <div className="mt-10 border-t border-stone-200 pt-6">
              <div className="mb-3 font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                How to pay
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {paymentMethods.map((method, index) => {
                  const isLink =
                    (['pesapal', 'stripe', 'paypal'] as InvoicePaymentMethod['type'][]).includes(
                      method.type,
                    ) && method.url;
                  return (
                    <div
                      key={index}
                      className="rounded-md border border-stone-200 bg-stone-50 p-4"
                    >
                      <p className="font-mono text-[11px] font-medium text-neutral-950">
                        {method.label}
                      </p>
                      {method.instructions ? (
                        <p className="mt-2 font-mono text-[11px] leading-[18px] whitespace-pre-line text-[#878787]">
                          {method.instructions}
                        </p>
                      ) : null}
                      {isLink ? (
                        <a
                          href={method.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center rounded bg-stone-900 px-3 py-1.5 font-mono text-[11px] tracking-wide text-white uppercase transition-colors hover:bg-stone-700"
                        >
                          Pay with {method.label}
                        </a>
                      ) : method.url ? (
                        <a
                          href={method.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block font-mono text-[11px] text-neutral-950 underline"
                        >
                          {method.url}
                        </a>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {invoice.notes ? (
            <div className="mt-10">
              <div className="mb-2 font-mono text-[11px] tracking-wide text-[#878787] uppercase">
                Note
              </div>
              <p className="font-mono text-[11px] leading-[18px] whitespace-pre-line text-neutral-950">
                {invoice.notes}
              </p>
            </div>
          ) : null}
        </article>
      </div>
    </div>
  );
}
