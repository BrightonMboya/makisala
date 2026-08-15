'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PaymentInstructions, type PaymentMethod } from '@/components/proposal/PaymentInstructions';
import {
  basisSuffix,
  computeBookingTotal,
  formatDelta,
  formatLineAmount,
  hasAddOns,
  isSelectionEmpty,
  type AlternativeOffer,
  type BookingAddOns,
  type Selections,
} from '@/lib/booking-addons';

type Props = {
  proposalId: string;
  title: string;
  clientName: string;
  travelerCount: number;
  startDate: string | null;
  totalPrice: number | null;
  currency: string;
  organization: { name: string; logoUrl: string | null } | null;
  paymentMethods: PaymentMethod[];
  /** Proposal already confirmed on a previous visit. */
  alreadyConfirmed: boolean;
  addOns: BookingAddOns;
  /** Selections restored from a previous visit. */
  initialSelections: Selections;
  /** Total agreed at confirm time, if already confirmed. */
  confirmedTotal: number | null;
  /** Invoice already issued for this trip, if any. */
  invoice: InvoiceSummary | null;
};

type InvoiceSummary = {
  number: string;
  currency: string;
  totalCents: number;
  amountPaidCents: number;
  status: string;
  dueDate: string | null;
  shareToken: string;
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

const CURRENCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€' };

/**
 * Whole dollars when the amount is whole, cents when it isn't. Rounding a
 * $13,180.50 total to "$13,181" on the page while the invoice PDF says
 * $13,180.50 reads as two different prices for the same booking.
 */
function money(n: number, currency: string): string {
  const whole = Number.isInteger(n);
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

function invoiceMoney(cents: number, currency: string): string {
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

/** tRPC surfaces the code on `data`, which isn't on the Error type. */
function isConflict(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { data?: { code?: string } }).data?.code === 'CONFLICT'
  );
}

/** Grouped by night so each renders as one either/or choice. */
function groupByDay(alternatives: AlternativeOffer[]) {
  const map = new Map<string, { dayId: string; dayNumber: number; primaryName: string | null; options: AlternativeOffer[] }>();
  for (const alt of alternatives) {
    const entry = map.get(alt.dayId) ?? {
      dayId: alt.dayId,
      dayNumber: alt.dayNumber,
      primaryName: alt.primaryName,
      options: [],
    };
    entry.options.push(alt);
    map.set(alt.dayId, entry);
  }
  return [...map.values()].sort((a, b) => a.dayNumber - b.dayNumber);
}

/**
 * Booking surface reached from a proposal's "Confirm Proposal" CTA. The client
 * opts into add-ons and the total reprices live; the server recomputes it at
 * confirm time, so this arithmetic is display-only.
 */
export function BookingConfirm({
  proposalId,
  title,
  clientName,
  travelerCount,
  startDate,
  totalPrice,
  currency,
  organization,
  paymentMethods,
  alreadyConfirmed,
  addOns,
  initialSelections,
  confirmedTotal,
  invoice,
}: Props) {
  const [name, setName] = useState(clientName || '');
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [error, setError] = useState('');
  const [selections, setSelections] = useState<Selections>(initialSelections);
  // Replaced by the fresh one the confirm mutation issues on this visit.
  const [checkoutInvoice, setCheckoutInvoice] = useState<InvoiceSummary | null>(invoice);

  const confirmMutation = trpc.proposals.confirm.useMutation();

  const baseTotal = totalPrice ?? 0;
  const { lines, addOnTotal, total } = useMemo(
    () => computeBookingTotal(baseTotal, addOns, selections, travelerCount),
    [baseTotal, addOns, selections, travelerCount],
  );

  const showCustomizer = !confirmed && hasAddOns(addOns);
  const altGroups = useMemo(() => groupByDay(addOns.alternatives), [addOns.alternatives]);
  const displayTotal = confirmed && confirmedTotal != null ? confirmedTotal : total;

  const toggleActivity = (id: string) =>
    setSelections((s) => ({
      ...s,
      activityIds: s.activityIds.includes(id)
        ? s.activityIds.filter((x) => x !== id)
        : [...s.activityIds, id],
    }));

  const toggleExtra = (id: string) =>
    setSelections((s) => ({
      ...s,
      extraIds: s.extraIds.includes(id) ? s.extraIds.filter((x) => x !== id) : [...s.extraIds, id],
    }));

  /** Passing null picks the primary lodge back, i.e. drops the day entirely. */
  const chooseAlternative = (dayId: string, altId: string | null) =>
    setSelections((s) => {
      const next = { ...s.alternativeByDayId };
      if (altId === null) delete next[dayId];
      else next[dayId] = altId;
      return { ...s, alternativeByDayId: next };
    });

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      const result = await confirmMutation.mutateAsync({
        proposalId,
        clientName: name.trim(),
        selections,
      });
      if (result.invoice) setCheckoutInvoice(result.invoice);
      setConfirmed(true);
    } catch (err) {
      // The booking went through and this is a duplicate submit: a lost
      // response, a second tab, a back-then-resubmit. Showing a red error to
      // someone who has already booked is worse than showing the confirmation.
      if (isConflict(err)) {
        setConfirmed(true);
        return;
      }
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const dateStr = formatDate(startDate);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-10 flex flex-col items-center text-center">
        {organization?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={organization.logoUrl} alt={organization.name} className="mb-4 h-12 w-auto object-contain" />
        ) : organization?.name ? (
          <p className="mb-2 text-sm font-medium tracking-wide text-stone-500">{organization.name}</p>
        ) : null}
        <h1 className="font-serif text-3xl leading-tight text-stone-900 md:text-4xl">{title}</h1>
        <p className="mt-3 text-xs font-semibold tracking-[0.2em] text-stone-400 uppercase">
          {confirmed ? 'Booking confirmed' : 'Complete your booking'}
        </p>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-x-6 gap-y-5 rounded-2xl border border-stone-200 bg-stone-50 p-6 sm:grid-cols-3">
        {dateStr && (
          <div>
            <p className="text-xs tracking-wide text-stone-400 uppercase">Start date</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{dateStr}</p>
          </div>
        )}
        {travelerCount > 0 && (
          <div>
            <p className="text-xs tracking-wide text-stone-400 uppercase">Travelers</p>
            <p className="mt-1 text-sm font-medium text-stone-800">
              {travelerCount} {travelerCount === 1 ? 'Guest' : 'Guests'}
            </p>
          </div>
        )}
        {displayTotal > 0 && (
          <div>
            <p className="text-xs tracking-wide text-stone-400 uppercase">Total</p>
            <p className="mt-1 text-sm font-medium text-stone-800">{money(displayTotal, currency)}</p>
          </div>
        )}
      </div>

      {showCustomizer && (
        <div className="mb-8 space-y-6">
          <div>
            <h2 className="font-serif text-xl text-stone-900">Customize your trip</h2>
            <p className="mt-1 text-sm text-stone-500">
              Everything here is optional. Your total updates as you choose.
            </p>
          </div>
          {addOns.activities.length > 0 && (
            <section className="rounded-2xl border border-stone-200 p-6">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Optional activities
              </h3>
              <div className="space-y-3">
                {addOns.activities.map((a) => {
                  const checked = selections.activityIds.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        checked ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleActivity(a.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-stone-800"
                      />
                      <span className="flex-1">
                        <span className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-sm font-medium text-stone-900">{a.name}</span>
                          <span className="text-sm font-medium text-stone-700">
                            {a.price == null
                              ? 'On request'
                              : `+${money(a.price, currency)}${a.priceUnit === 'per_person' ? ' pp' : ''}`}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-stone-400">Day {a.dayNumber}</span>
                        {a.description && (
                          <span className="mt-2 block text-sm text-stone-500">{a.description}</span>
                        )}
                        {a.price == null && (
                          <span className="mt-2 block text-xs text-stone-500">
                            We will confirm the price with you before payment.
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
          {altGroups.length > 0 && (
            <section className="rounded-2xl border border-stone-200 p-6">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Alternative Accommodations
              </h3>
              <div className="space-y-6">
                {altGroups.map((group) => {
                  const chosen = selections.alternativeByDayId[group.dayId] ?? null;
                  return (
                    <div key={group.dayId}>
                      <p className="mb-2 text-xs font-medium tracking-wide text-stone-400 uppercase">
                        Day {group.dayNumber}
                      </p>
                      <div className="space-y-2">
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                            chosen === null ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`lodge-${group.dayId}`}
                            checked={chosen === null}
                            onChange={() => chooseAlternative(group.dayId, null)}
                            className="mt-1 h-4 w-4 shrink-0 accent-stone-800"
                          />
                          <span className="flex-1">
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="text-sm font-medium text-stone-900">
                                {group.primaryName ?? 'As quoted'}
                              </span>
                              <span className="text-sm text-stone-400">Included</span>
                            </span>
                            <span className="mt-0.5 block text-xs text-stone-400">
                              Originally quoted
                            </span>
                          </span>
                        </label>

                        {group.options.map((alt) => {
                          const isChosen = chosen === alt.id;
                          return (
                            <label
                              key={alt.id}
                              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                                isChosen ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`lodge-${group.dayId}`}
                                checked={isChosen}
                                onChange={() => chooseAlternative(group.dayId, alt.id)}
                                className="mt-1 h-4 w-4 shrink-0 accent-stone-800"
                              />
                              {/* One thumbnail as a recognition cue; the full
                                  gallery lives on the proposal. */}
                              {alt.images[0] && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={alt.images[0]}
                                  alt=""
                                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                />
                              )}
                              <span className="flex-1">
                                <span className="flex flex-wrap items-baseline justify-between gap-2">
                                  <span className="text-sm font-medium text-stone-900">{alt.name}</span>
                                  {/* Unit comes from priceBasis, the same
                                      field this is billed on — even for
                                      `custom`, whose free-text label bills
                                      once, same as `flat`. */}
                                  <span className="text-sm font-medium text-stone-700">
                                    {formatDelta(alt.additionalPrice, currency)}
                                    {alt.additionalPrice !== 0
                                      ? basisSuffix(alt.priceBasis, alt.customUnitLabel)
                                      : ''}
                                  </span>
                                </span>
                                {(alt.rooms || alt.meals) && (
                                  <span className="mt-0.5 block text-xs text-stone-400">
                                    {[alt.rooms, alt.meals].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
          {addOns.extras.length > 0 && (
            <section className="rounded-2xl border border-stone-200 p-6">
              <h3 className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                Extras
              </h3>
              <div className="space-y-3">
                {addOns.extras.map((e) => {
                  const checked = selections.extraIds.includes(e.id);
                  const label =
                    e.unit === 'free'
                      ? 'Free'
                      : `+${money(e.price, currency)}${e.unit === 'per_person' ? ' pp' : ''}`;
                  return (
                    <label
                      key={e.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        checked ? 'border-stone-800 bg-stone-50' : 'border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleExtra(e.id)}
                        className="mt-1 h-4 w-4 shrink-0 accent-stone-800"
                      />
                      <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2">
                        <span className="text-sm font-medium text-stone-900">{e.name}</span>
                        <span className="text-sm font-medium text-stone-700">{label}</span>
                      </span>
                      {e.unit === 'custom' && e.customUnitLabel && (
                        <span className="text-xs text-stone-400">{e.customUnitLabel}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Only worth showing once something has been added. */}
      {!isSelectionEmpty(selections) && lines.length > 0 && (
        <div className="mb-8 rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h3 className="mb-4 text-xs font-semibold tracking-wide text-stone-500 uppercase">
            {confirmed ? 'What you booked' : 'Your total'}
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-600">Itinerary as quoted</dt>
              <dd className="font-medium text-stone-800">{money(baseTotal, currency)}</dd>
            </div>
            {lines.map((l) => (
              <div key={`${l.kind}-${l.id}`} className="flex justify-between gap-4">
                <dt className="text-stone-600">
                  {l.label}
                  {l.detail && <span className="ml-1 text-xs text-stone-400">({l.detail})</span>}
                </dt>
                <dd className="shrink-0 font-medium text-stone-800">{formatLineAmount(l, currency)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 border-t border-stone-200 pt-3">
              <dt className="font-semibold text-stone-900">Total</dt>
              <dd className="font-semibold text-stone-900">{money(displayTotal, currency)}</dd>
            </div>
          </dl>
          {addOnTotal !== 0 && !confirmed && (
            <p className="mt-3 text-xs text-stone-500">
              {formatDelta(addOnTotal, currency)} against the original quote.
            </p>
          )}
          {lines.some((l) => l.onRequest) && (
            <p className="mt-3 text-xs text-stone-500">
              Items marked &ldquo;on request&rdquo; are not in the total yet.{' '}
              {organization?.name || 'The operator'} will confirm their price with you.
            </p>
          )}
        </div>
      )}

      {confirmed ? (
        <div className="mb-8 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-900">
              Thank you{name ? `, ${name.split(' ')[0]}` : ''}. Your booking is confirmed.
            </p>
            <p className="mt-1 text-sm text-green-800">
              {organization?.name || 'The operator'} has been notified. Use the payment details below
              to complete your payment.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-2xl border border-stone-200 p-6">
          <label className="mb-2 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
            Your name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 focus:outline-none"
          />
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <button
            onClick={handleConfirm}
            disabled={confirmMutation.isPending || !name.trim()}
            className="mt-4 w-full cursor-pointer rounded-lg bg-stone-800 px-6 py-3.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-stone-900 disabled:opacity-50"
          >
            {confirmMutation.isPending
              ? 'Confirming...'
              : displayTotal > 0
                ? `Confirm booking · ${money(displayTotal, currency)}`
                : 'Confirm booking'}
          </button>
          <p className="mt-3 text-center text-xs text-stone-400">
            Confirming notifies {organization?.name || 'the operator'} that you are ready to proceed.
          </p>
        </div>
      )}

      {/* The traveler's downloadable receipt for what they selected. */}
      {checkoutInvoice && (
        <div className="mb-8 rounded-2xl border border-stone-200 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" />
              <div>
                <p className="text-sm font-semibold text-stone-900">
                  Invoice {checkoutInvoice.number}
                </p>
                <p className="mt-0.5 text-sm text-stone-500">
                  {checkoutInvoice.status === 'paid'
                    ? 'Paid in full. Thank you.'
                    : checkoutInvoice.amountPaidCents > 0 &&
                        checkoutInvoice.amountPaidCents < checkoutInvoice.totalCents
                      ? `Balance due ${invoiceMoney(checkoutInvoice.totalCents - checkoutInvoice.amountPaidCents, checkoutInvoice.currency)}`
                      : `Amount due ${invoiceMoney(checkoutInvoice.totalCents, checkoutInvoice.currency)}`}
                </p>
              </div>
            </div>
            {checkoutInvoice.status === 'paid' && (
              <span className="rounded bg-green-600 px-2 py-1 text-[10px] font-medium tracking-wide text-white uppercase">
                Paid
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/invoice/${checkoutInvoice.shareToken}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg bg-stone-800 px-4 py-2.5 text-sm font-medium tracking-wide text-white transition-colors hover:bg-stone-900"
            >
              View invoice
            </a>
            <a
              href={`/invoice/${checkoutInvoice.shareToken}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium tracking-wide text-stone-700 transition-colors hover:border-stone-300"
            >
              Download PDF
            </a>
          </div>
        </div>
      )}

      {/* Payment details: always visible on this page */}
      {paymentMethods.length > 0 ? (
        <PaymentInstructions methods={paymentMethods} />
      ) : (
        <p className="rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-500">
          {organization?.name || 'The operator'} will share payment details with you directly after
          you confirm.
        </p>
      )}
    </div>
  );
}
