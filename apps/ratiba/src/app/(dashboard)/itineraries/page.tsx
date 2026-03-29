'use client';

import { Input } from '@repo/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDebounce } from '@repo/ui/use-debounce';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import type { RequestItem } from '@/types/dashboard';
import { getStatusConfig } from '@/lib/proposal-status';
import { useSession } from '@/components/session-context';

const PAGE_SIZE = 20;

export default function ItinerariesPage() {
  const router = useRouter();
  const { session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [page, setPage] = useState(1);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const { data, isLoading } = trpc.proposals.listForDashboard.useQuery(
    { filter: 'all', page, pageSize: PAGE_SIZE, search: debouncedQuery || undefined },
    { staleTime: staleTimes.proposals, enabled: !!session?.user?.id, placeholderData: (prev) => prev },
  );

  const proposals = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  const requests: RequestItem[] = proposals.map((p: any) => ({
    id: p.id,
    client: p.client?.name || 'Unknown',
    travelers: 0,
    country: 'Unknown',
    title: p.tourTitle || p.name,
    startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD',
    received: new Date(p.createdAt).toLocaleDateString(),
    source: 'Manual',
    status: p.status || 'draft',
    assignees: [],
  }));

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">Itineraries</h2>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search itineraries..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 p-8">
        {isLoading && !data ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">
              {debouncedQuery.trim() ? 'No matching itineraries' : 'No itineraries found'}
            </h3>
            <p className="mt-1 text-stone-500">
              {debouncedQuery.trim() ? 'Try adjusting your search terms.' : 'Check back later or create a new one.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const cfg = getStatusConfig(req.status);
              return (
              <Link
                key={req.id}
                href={`/proposal/${req.id}`}
                className="group block rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">{req.client}</h3>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{req.title}</p>
                  </div>
                  <div className="text-right text-sm text-stone-500">
                    <div className="flex items-center justify-end gap-1.5">
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
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-stone-200 bg-white px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {totalCount} itinerar{totalCount !== 1 ? 'ies' : 'y'}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="px-2 text-sm text-stone-600">
                Page {page} of {totalPages}
              </span>
              <button
                className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
