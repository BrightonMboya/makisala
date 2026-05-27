import { Lock } from 'lucide-react';
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { RateCardsShell } from './_components/rate-cards-shell';
import { createServerCaller } from '@/server/trpc/caller';

type SectionKey = 'hotels' | 'parks' | 'activities' | 'vehicles' | 'transfers' | 'seasons';

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

function qKey(path: string[], input?: unknown) {
  return input === undefined ? [path, { type: 'query' }] : [path, { input, type: 'query' }];
}

export default async function RateCardsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const validTabs: SectionKey[] = ['hotels', 'parks', 'activities', 'vehicles', 'transfers', 'seasons'];
  // Older deep links pointed at the merged settings tab.
  const requested = params.tab === 'settings' ? 'seasons' : params.tab;
  const defaultTab: SectionKey =
    requested && validTabs.includes(requested as SectionKey)
      ? (requested as SectionKey)
      : 'hotels';

  const trpc = await createServerCaller();
  const isAdmin = await trpc.settings.checkAdmin().catch(() => false);

  if (!isAdmin) {
    return (
      <div className="p-8">
        <div className="mx-auto max-w-6xl">
          <RateCardsHeader />
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
        </div>
      </div>
    );
  }

  const queryClient = new QueryClient();
  const [hotelRates, parkRates, activityRates, vehicles, transfers, seasons] = await Promise.all([
    trpc.rateCards.accommodationRates.listAll(),
    trpc.rateCards.parkFeeRates.listAll(),
    trpc.rateCards.activityRates.listAll(),
    trpc.rateCards.vehicles.list(),
    trpc.rateCards.transferRates.list(),
    trpc.rateCards.seasons.list(),
  ]);

  queryClient.setQueryData(qKey(['rateCards', 'accommodationRates', 'listAll']), hotelRates);
  queryClient.setQueryData(qKey(['rateCards', 'parkFeeRates', 'listAll']), parkRates);
  queryClient.setQueryData(qKey(['rateCards', 'activityRates', 'listAll']), activityRates);
  queryClient.setQueryData(qKey(['rateCards', 'vehicles', 'list']), vehicles);
  queryClient.setQueryData(qKey(['rateCards', 'transferRates', 'list']), transfers);
  queryClient.setQueryData(qKey(['rateCards', 'seasons', 'list']), seasons);

  if (defaultTab === 'parks') {
    const firstParkId = parkRates.find((r) => r.parkId)?.parkId;
    if (firstParkId) {
      const [fees, ancillary] = await Promise.all([
        trpc.rateCards.parkFeeRates.listByPark({ parkId: firstParkId }),
        trpc.rateCards.parkAncillaryFees.listByPark({ parkId: firstParkId }),
      ]);
      queryClient.setQueryData(
        qKey(['rateCards', 'parkFeeRates', 'listByPark'], { parkId: firstParkId }),
        fees,
      );
      queryClient.setQueryData(
        qKey(['rateCards', 'parkAncillaryFees', 'listByPark'], { parkId: firstParkId }),
        ancillary,
      );
    }
  } else if (defaultTab === 'hotels') {
    const firstHotelId = hotelRates.find((r) => r.accommodationId)?.accommodationId;
    if (firstHotelId) {
      const rates = await trpc.rateCards.accommodationRates.listByAccommodation({
        accommodationId: firstHotelId,
      });
      queryClient.setQueryData(
        qKey(['rateCards', 'accommodationRates', 'listByAccommodation'], {
          accommodationId: firstHotelId,
        }),
        rates,
      );
    }
  } else if (defaultTab === 'activities') {
    const firstActivityId = activityRates.find((r) => r.activityId)?.activityId;
    if (firstActivityId) {
      const rates = await trpc.rateCards.activityRates.listByActivity({
        activityId: firstActivityId,
      });
      queryClient.setQueryData(
        qKey(['rateCards', 'activityRates', 'listByActivity'], {
          activityId: firstActivityId,
        }),
        rates,
      );
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <RateCardsHeader />
        <HydrationBoundary state={dehydrate(queryClient)}>
          <RateCardsShell defaultTab={defaultTab} />
        </HydrationBoundary>
      </div>
    </div>
  );
}

function RateCardsHeader() {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-stone-900">Rate Cards</h1>
      <p className="mt-2 text-stone-600">
        Your supplier rates. The auto-pricing engine uses these to cost itineraries. Start with
        your hotels and camps. Seasons drive how hotel rates change through the year.
      </p>
    </div>
  );
}
