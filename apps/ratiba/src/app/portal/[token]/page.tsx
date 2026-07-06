import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerCaller } from '@/server/trpc/caller';
import { PortalClient } from './portal-client';
import { PortalGate } from './portal-gate';

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ e?: string }>;
};

const getCachedPortal = cache(async (token: string) => {
  const trpc = await createServerCaller();
  try {
    return await trpc.portals.getByToken({ token });
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const portal = await getCachedPortal(token);
  if (!portal) return { title: 'Trip portal not found' };
  return {
    title: `${portal.tripName} — Traveler details`,
    robots: { index: false, follow: false },
    // Keep the share token out of referrer headers to third parties.
    referrer: 'no-referrer',
  };
}

export default async function PortalPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { e } = await searchParams;
  const portal = await getCachedPortal(token);
  if (!portal) notFound();

  if (portal.expired) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <div className="max-w-md rounded-xl border border-stone-200 bg-white p-8 text-center">
          <h1 className="font-serif text-xl font-bold text-stone-900">This portal has closed</h1>
          <p className="mt-2 text-sm text-stone-600">
            The link for {portal.tripName} has expired. Please contact {portal.orgName} if you still
            need to submit your details.
          </p>
        </div>
      </div>
    );
  }

  if (!portal.unlocked) {
    return (
      <PortalGate
        token={token}
        tripName={portal.tripName}
        orgName={portal.orgName}
        orgLogo={portal.orgLogo}
        emailHint={portal.emailHint}
        hasLeadEmail={portal.hasLeadEmail}
        linkError={e === 'link'}
      />
    );
  }

  return <PortalClient token={token} initial={portal} />;
}
