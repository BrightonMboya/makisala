'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PaymentInstructions, type PaymentMethod } from '@/components/proposal/PaymentInstructions';

type Props = {
  proposalId: string;
  title: string;
  clientName: string;
  travelerCount: number;
  startDate: string | null;
  totalPrice: number | null;
  organization: { name: string; logoUrl: string | null } | null;
  paymentMethods: PaymentMethod[];
  /** Proposal already confirmed on a previous visit. */
  alreadyConfirmed: boolean;
};

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Standalone booking surface reached from a proposal's "Confirm Proposal" CTA
 * (web page and downloaded PDF both link here). Payment details are shown
 * directly. Confirming notifies the operator and marks the proposal
 * awaiting_payment; the payment details stay visible afterwards.
 */
export function BookingConfirm({
  proposalId,
  title,
  clientName,
  travelerCount,
  startDate,
  totalPrice,
  organization,
  paymentMethods,
  alreadyConfirmed,
}: Props) {
  const [name, setName] = useState(clientName || '');
  const [confirmed, setConfirmed] = useState(alreadyConfirmed);
  const [error, setError] = useState('');

  const confirmMutation = trpc.proposals.confirm.useMutation();

  const handleConfirm = async () => {
    if (!name.trim()) return;
    setError('');
    try {
      await confirmMutation.mutateAsync({ proposalId, clientName: name.trim() });
      setConfirmed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  const dateStr = formatDate(startDate);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Operator branding */}
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

      {/* Trip summary */}
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
        {totalPrice != null && (
          <div>
            <p className="text-xs tracking-wide text-stone-400 uppercase">Total</p>
            <p className="mt-1 text-sm font-medium text-stone-800">${totalPrice.toLocaleString()}</p>
          </div>
        )}
      </div>

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
            {confirmMutation.isPending ? 'Confirming...' : 'Confirm booking'}
          </button>
          <p className="mt-3 text-center text-xs text-stone-400">
            Confirming notifies {organization?.name || 'the operator'} that you are ready to proceed.
          </p>
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
