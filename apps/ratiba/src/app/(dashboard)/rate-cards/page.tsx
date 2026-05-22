import { Lock } from 'lucide-react';
import { RateCardsShell } from './_components/rate-cards-shell';
import { createServerCaller } from '@/server/trpc/caller';

type SectionKey = 'hotels' | 'parks' | 'vehicles' | 'transfers' | 'seasons';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RateCardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const validTabs: SectionKey[] = ['hotels', 'parks', 'vehicles', 'transfers', 'seasons'];
  // Older deep links pointed at the merged settings tab.
  const requested = params.tab === 'settings' ? 'seasons' : params.tab;
  const defaultTab: SectionKey =
    requested && validTabs.includes(requested as SectionKey)
      ? (requested as SectionKey)
      : 'hotels';

  const trpc = await createServerCaller();
  const isAdmin = await trpc.settings.checkAdmin().catch(() => false);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Rate Cards</h1>
          <p className="mt-2 text-stone-600">
            Your supplier rates. The auto-pricing engine uses these to cost itineraries. Start
            with your hotels and camps. Seasons drive how hotel rates change through the year.
          </p>
        </div>

        {isAdmin ? (
          <RateCardsShell defaultTab={defaultTab} />
        ) : (
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
              <Lock className="h-5 w-5 text-stone-500" />
            </div>
            <h2 className="text-lg font-semibold text-stone-900">Admins only</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
              Rate cards are managed by your organization&apos;s admins. Ask an admin to update
              supplier rates and pricing defaults.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
