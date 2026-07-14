import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { ClientDealView } from './client-deal-view';

export const dynamic = 'force-dynamic';

export default async function ClientDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const trpc = await createServerCaller();

  // Seed the client + their proposals so the deal view paints on first load
  // rather than flashing empty then filling in.
  const initialData = await trpc.proposals.listForClient({ clientId: id }).catch(() => null);

  if (!initialData) {
    notFound();
  }

  return <ClientDealView clientId={id} initialData={initialData} />;
}
