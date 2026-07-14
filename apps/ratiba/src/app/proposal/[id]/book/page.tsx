import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { BookingConfirm } from './BookingConfirm';
import type { PaymentMethod } from '@/components/proposal/PaymentInstructions';
import { log, serializeError } from '@/lib/logger';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const trpc = await createServerCaller();
    const booking = await trpc.proposals.getBookingDetails({ id });
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

  try {
    const trpc = await createServerCaller();
    const booking = await trpc.proposals.getBookingDetails({ id });
    if (!booking) notFound();

    // "Already confirmed" so a returning client who paid/committed doesn't
    // re-notify the operator, but still sees the payment details.
    const alreadyConfirmed =
      booking.status === 'awaiting_payment' ||
      booking.status === 'paid' ||
      booking.status === 'booked';

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
        />
      </main>
    );
  } catch (err) {
    log.error('Error loading booking page', { error: serializeError(err) });
    notFound();
  }
}
