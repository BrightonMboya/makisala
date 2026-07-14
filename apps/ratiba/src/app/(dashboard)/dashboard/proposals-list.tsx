'use client';

import { Input } from '@repo/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Layers,
  Pencil,
  RotateCcw,
  Search,
  User,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useState } from 'react';
import { CountryFlag } from '@repo/ui/country-flag';
import { useDebounce } from '@repo/ui/use-debounce';
import { EmailStatusBadge } from '@/components/email-status-badge';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import {
  DEFAULT_DASHBOARD_STATUSES,
  getStatusConfig,
  type ProposalStatus,
  PROPOSAL_STATUSES,
} from '@/lib/proposal-status';
import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ClientsPage = RouterOutputs['proposals']['listClientsForDashboard'];
type DashboardRow = ClientsPage['items'][number];

interface ProposalsListProps {
  initialClients: ClientsPage;
  // The List/Calendar switcher, rendered at the left of the toolbar so the
  // dashboard has a single row of controls.
  leftSlot?: ReactNode;
}

const PAGE_SIZE = 20;

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString() : 'TBD';
}

export function ProposalsList({ initialClients, leftSlot }: ProposalsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  // Multi-select status filter. Seeded with the active pipeline (drafts through
  // booked) so cancelled/completed trips are hidden until the operator opts in.
  const [statuses, setStatuses] = useState<ProposalStatus[]>(DEFAULT_DASHBOARD_STATUSES);
  const [page, setPage] = useState(1);

  // Toggle one status. Keep at least one selected so the list never filters down
  // to an empty, confusing "nothing matches" state from an all-off selection.
  const toggleStatus = (status: ProposalStatus) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.length > 1
          ? prev.filter((s) => s !== status)
          : prev
        : [...prev, status],
    );
    setPage(1);
  };
  const setAllStatuses = () => {
    setStatuses(PROPOSAL_STATUSES);
    setPage(1);
  };
  const resetStatuses = () => {
    setStatuses(DEFAULT_DASHBOARD_STATUSES);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const queryInput = {
    filter: 'all' as const,
    page,
    pageSize: PAGE_SIZE,
    statuses,
    search: debouncedQuery || undefined,
  };

  const allStatusesSelected = statuses.length === PROPOSAL_STATUSES.length;
  const isDefaultStatuses =
    statuses.length === DEFAULT_DASHBOARD_STATUSES.length &&
    DEFAULT_DASHBOARD_STATUSES.every((s) => statuses.includes(s));
  // The status filter is "active" (visually highlighted) whenever it deviates
  // from the default pipeline view.
  const statusFilterActive = !isDefaultStatuses;
  const statusLabel = allStatusesSelected
    ? 'All statuses'
    : statuses.length === 1
      ? getStatusConfig(statuses[0]!).label
      : `${statuses.length} statuses`;

  const isDefaultQuery = page === 1 && isDefaultStatuses && !debouncedQuery;

  const { data, isLoading } = trpc.proposals.listClientsForDashboard.useQuery(queryInput, {
    staleTime: staleTimes.proposals,
    initialData: isDefaultQuery ? initialClients : undefined,
    placeholderData: (prev) => prev,
  });

  const rows = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">{leftSlot}</div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search clients or proposals..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    statusFilterActive
                      ? 'border-green-600/20 bg-green-50 text-green-800'
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {statusLabel}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-between px-2 py-1.5">
                  <span className="text-xs font-medium text-stone-500">Filter by status</span>
                  <button
                    type="button"
                    onClick={allStatusesSelected ? resetStatuses : setAllStatuses}
                    className="text-xs font-medium text-green-700 hover:text-green-800"
                  >
                    {allStatusesSelected ? 'Reset' : 'Select all'}
                  </button>
                </div>
                <DropdownMenuSeparator />
                {PROPOSAL_STATUSES.map((s) => {
                  const cfg = getStatusConfig(s);
                  return (
                    <DropdownMenuCheckboxItem
                      key={s}
                      checked={statuses.includes(s)}
                      // Keep the menu open so several statuses can be toggled at once.
                      onSelect={(e) => e.preventDefault()}
                      onCheckedChange={() => toggleStatus(s)}
                      className="flex items-center gap-2"
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span className="flex-1">{cfg.label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
                {!isDefaultStatuses && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={resetStatuses} className="flex items-center gap-2">
                      <RotateCcw className="h-3.5 w-3.5 text-stone-400" />
                      <span className="flex-1">Reset to default</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        {rows.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">
              {debouncedQuery.trim() || statusFilterActive
                ? 'No matching proposals'
                : 'No proposals yet'}
            </h3>
            <p className="mt-1 text-stone-500">
              {debouncedQuery.trim() || statusFilterActive
                ? 'Try adjusting your search or filters.'
                : 'Create your first proposal using the sidebar button.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map((row) =>
              row.kind === 'client' ? (
                <ClientRow key={`client-${row.clientId}`} row={row} router={router} />
              ) : (
                <DraftRow key={`proposal-${row.proposalId}`} row={row} router={router} />
              ),
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-stone-200 bg-white px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {totalCount} client{totalCount !== 1 ? 's' : ''}
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

type Router = ReturnType<typeof useRouter>;
type ClientRowData = Extract<DashboardRow, { kind: 'client' }>;
type DraftRowData = Extract<DashboardRow, { kind: 'proposal' }>;

// One row per client. Shows their country, headcount, how many proposals they
// have and the latest one's status + email delivery; clicking opens their deal
// page with all proposals.
function ClientRow({ row, router }: { row: ClientRowData; router: Router }) {
  const cfg = getStatusConfig(row.featuredStatus);
  return (
    <button
      type="button"
      onClick={() => router.push(`/clients/${row.clientId}`)}
      className="group block w-full rounded-xl border border-stone-200 bg-white p-5 text-left shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            {row.country && <CountryFlag country={row.country} showName={false} size={18} />}
            <h3 className="truncate font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
              {row.clientName}
            </h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
              <Layers className="h-3 w-3" />
              {row.proposalCount} proposal{row.proposalCount !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-2 text-sm text-stone-600">
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
            <span className="truncate">{row.featuredTitle}</span>
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            {row.travelers > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-stone-400" />
                {row.travelers} traveler{row.travelers !== 1 ? 's' : ''}
              </span>
            )}
            <EmailStatusBadge status={row.emailStatus} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-sm text-stone-500">
            <div className="flex items-center justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Starts {formatDate(row.featuredStartDate)}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-stone-300 transition-colors group-hover:text-green-700" />
        </div>
      </div>
    </button>
  );
}

// A proposal with no client attached yet (fresh draft). Can't be grouped, so it
// stands alone and jumps straight into the editor.
function DraftRow({ row, router }: { row: DraftRowData; router: Router }) {
  const cfg = getStatusConfig(row.status);
  return (
    <button
      type="button"
      onClick={() => router.push(`/itineraries/${row.proposalId}/day-by-day`)}
      className="group block w-full rounded-xl border border-dashed border-stone-300 bg-white p-5 text-left shadow-sm transition-all hover:border-green-600/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="truncate font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
              {row.title}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
            >
              {cfg.label}
            </span>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <User className="h-3.5 w-3.5 text-stone-400" />
            No client yet
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
            {row.travelers > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-stone-400" />
                {row.travelers} traveler{row.travelers !== 1 ? 's' : ''}
              </span>
            )}
            <EmailStatusBadge status={row.emailStatus} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right text-sm text-stone-500">
            <div className="flex items-center justify-end gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Starts {formatDate(row.startDate)}
            </div>
          </div>
          <Pencil className="h-4 w-4 text-stone-300 transition-colors group-hover:text-green-700" />
        </div>
      </div>
    </button>
  );
}
