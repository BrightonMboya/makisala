import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { env } from '@/lib/env';
import { PortalDetail } from './portal-detail';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function PortalDetailPage({ params }: Props) {
  const { id } = await params;
  const trpc = await createServerCaller();
  const portal = await trpc.portals.getById({ id }).catch(() => null);
  if (!portal) notFound();

  return <PortalDetail initial={portal} baseUrl={env.NEXT_PUBLIC_APP_URL} />;
}
