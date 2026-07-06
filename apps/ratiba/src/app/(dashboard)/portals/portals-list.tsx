'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { Badge } from '@repo/ui/badge';
import { ClipboardList } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';

type PortalRow = RouterOutputs['portals']['list'][number];

const STATUS_LABEL: Record<PortalRow['status'], string> = {
  pending: 'Not started',
  in_progress: 'In progress',
  submitted: 'Submitted',
};

function StatusBadge({ status }: { status: PortalRow['status'] }) {
  if (status === 'submitted') {
    return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
  }
  if (status === 'in_progress') {
    return <Badge className="bg-amber-100 text-amber-800">In progress</Badge>;
  }
  return <Badge variant="secondary">Not started</Badge>;
}

export function PortalsList({ initial }: { initial: PortalRow[] }) {
  const { data } = trpc.portals.list.useQuery(undefined, { initialData: initial });
  const portals = data ?? initial;

  if (portals.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white px-6 py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-stone-100">
          <ClipboardList className="h-5 w-5 text-stone-500" />
        </div>
        <h2 className="text-lg font-semibold text-stone-900">No trip portals yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
          Create a portal to collect passport details, dietary needs and logistics from your
          clients after they book. One link per trip, filled in by the lead traveler.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs tracking-wide text-stone-500 uppercase">
            <th className="px-5 py-3 font-medium">Trip</th>
            <th className="px-5 py-3 font-medium">Client</th>
            <th className="px-5 py-3 font-medium">Travelers</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Created</th>
          </tr>
        </thead>
        <tbody>
          {portals.map((p) => (
            <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
              <td className="px-5 py-3">
                <Link
                  href={`/portals/${p.id}`}
                  className="font-medium text-stone-900 hover:text-green-700 hover:underline"
                >
                  {p.tripName}
                </Link>
              </td>
              <td className="px-5 py-3 text-stone-600">{p.clientName || '—'}</td>
              <td className="px-5 py-3 text-stone-600">{p.travelerCount}</td>
              <td className="px-5 py-3">
                <StatusBadge status={p.status} />
              </td>
              <td className="px-5 py-3 text-stone-500">
                {p.createdAt ? format(new Date(p.createdAt), 'd MMM yyyy') : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { STATUS_LABEL };
