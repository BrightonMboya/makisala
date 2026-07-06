import { createServerCaller } from '@/server/trpc/caller';
import { PortalsList } from './portals-list';
import { NewPortalDialog } from './new-portal-dialog';

export const metadata = {
  title: 'Client Portals',
};

export default async function PortalsPage() {
  const trpc = await createServerCaller();
  const portals = await trpc.portals.list().catch(() => []);

  return (
    <div className="p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Client Portals</h1>
            <p className="mt-2 max-w-2xl text-stone-600">
              After a booking is paid, share one link per trip. The lead traveler adds everyone in
              their party with passport details, dietary needs and logistics. You see it all in one
              place.
            </p>
          </div>
          <NewPortalDialog />
        </div>

        <PortalsList initial={portals} />
      </div>
    </div>
  );
}
