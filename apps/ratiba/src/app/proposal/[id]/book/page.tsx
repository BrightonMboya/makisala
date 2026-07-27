import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { isClientConfirmable } from '@/lib/proposal-status';
import { BookingConfirm } from './BookingConfirm';
import type { PaymentMethod } from '@/components/proposal/PaymentInstructions';
import { log, serializeError } from '@/lib/logger';

type Props = { params: Promise<{ id: string }> };

/**
 * generateMetadata and the page body both need this, and it is not a cheap
 * read: proposal + payment methods + days + activities + accommodation images
 * + invoice. Per-request memoized so it runs once per render, not twice.
 */
const getBooking = cache(async (id: string) => {
  const trpc = await createServerCaller();
  return trpc.proposals.getBookingDetails({ id });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const booking = await getBooking(id);
    return {
      title: booking ? `Book · ${booking.title}` : 'Booking',
      robots: { index: false, follow: false },
    };
  } catch {
    return { title: 'Booking', robots: { index: false, follow: false } };
  }
}

export default async function BookingPage({ params }: Props) {
  const { id } = await params;

  let booking: Awaited<ReturnType<typeof getBooking>>;
  try {
    booking = await getBooking(id);
  } catch (err) {
    // Only a genuine load failure lands here. notFound() throws a control-flow
    // signal of its own, so it is called outside the try: inside, this catch
    // would swallow it and log every ordinary 404 as an error.
    log.error('Error loading booking page', { proposalId: id, error: serializeError(err) });
    notFound();
  }

  if (!booking) notFound();

  // Cancelled is the one non-confirmable status that is not a booking. Showing
  // it as "confirmed", with payment instructions, would invite payment on a
  // dead trip.
  if (booking.status === 'cancelled') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-2xl text-stone-800">This trip is no longer available</h1>
          <p className="text-sm text-stone-600">
            {booking.organization?.name ?? 'The operator'} has cancelled this proposal. Get in touch
            with them if you think this is a mistake.
          </p>
        </div>
      </main>
    );
  }

  // Anything else the client can no longer act on shows the confirmed state:
  // payment details and the invoice, but no live button. Same predicate the
  // confirm mutation enforces, so the page never renders a button the server
  // rejects (a `completed` trip used to offer one that errored on click).
  const alreadyConfirmed = !isClientConfirmable(booking.status);

  return (
    <main className="min-h-screen bg-white">
      <BookingConfirm
        proposalId={booking.id}
        title={booking.title}
        clientName={booking.clientName}
        travelerCount={booking.travelerCount}
        startDate={booking.startDate}
        totalPrice={booking.totalPrice}
        organization={booking.organization}
        paymentMethods={booking.paymentMethods as PaymentMethod[]}
        alreadyConfirmed={alreadyConfirmed}
        addOns={booking.addOns}
        initialSelections={booking.selections}
        confirmedTotal={booking.confirmedTotal}
        invoice={booking.invoice}
      />
    </main>
  );
}
