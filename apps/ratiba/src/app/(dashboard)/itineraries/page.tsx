'use client';

import { Input } from '@repo/ui/input';
import {
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import type { RequestItem } from '@/types/dashboard';
import { useSession } from '@/components/session-context';

export default function ItinerariesPage() {
  const router = useRouter();
  const { session } = useSession();

  const { data: proposals = [], isLoading } = trpc.proposals.listForDashboard.useQuery(
    { filter: 'all' },
    { staleTime: staleTimes.proposals, enabled: !!session?.user?.id },
  );

  const requests: RequestItem[] = proposals.map((p: any) => ({
    id: p.id,
    client: p.client?.name || 'Unknown',
    travelers: 0,
    country: 'Unknown',
    title: p.tourTitle || p.name,
    startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD',
    received: new Date(p.createdAt).toLocaleDateString(),
    source: 'Manual',
    status: p.status === 'shared' ? 'shared' : 'draft',
    assignees: [],
  }));

  return (
    <div className="flex flex-col h-full bg-stone-50">
        <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Itineraries</h2>
          <div className="flex items-center gap-4">
             <div className="relative w-64">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
              <Input placeholder="Search itineraries..." className="pl-9" />
            </div>
          </div>
        </header>

        <div className="p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="py-24 text-center">
              <div className="mx-auto h-12 w-12 text-stone-300 mb-4">
                <FileText className="h-full w-full" />
              </div>
              <h3 className="text-lg font-medium text-stone-900">No itineraries found</h3>
              <p className="text-stone-500 mt-1">Check back later or create a new one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Link
                  key={req.id}
                  href={`/proposal/${req.id}`}
                  className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">{req.client}</h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          req.status === 'shared' ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-800'
                        }`}>
                          {req.status === 'shared' ? 'Shared' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-stone-600 mt-1">{req.title}</p>
                    </div>
                    <div className="text-right text-sm text-stone-500">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Clock className="h-3.5 w-3.5" />
                        Starts {req.startDate}
                      </div>
                      <div className="mt-1">Created {req.received}</div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end border-t border-stone-100 pt-3">
                    <button
                       className="text-xs font-medium text-green-700 hover:text-green-800 hover:underline"
                       onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         router.push(`/itineraries/${req.id}/day-by-day`);
                       }}
                    >
                      Edit Proposal
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
    </div>
  );
}
