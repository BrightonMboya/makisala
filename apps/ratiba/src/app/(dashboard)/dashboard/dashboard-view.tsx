'use client';

import { Input } from '@repo/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui/tooltip';
import { Check, ChevronLeft, ChevronRight, Clock, Copy, FileText, Filter, Loader2, Pencil, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useDebounce } from '@repo/ui/use-debounce';
import { trpc } from '@/lib/trpc';
import { toast } from '@repo/ui/toast';
import { staleTimes } from '@/lib/query-keys';
import type { AssignedUser, RequestItem } from '@/types/dashboard';
import { getStatusConfig, PROPOSAL_STATUSES } from '@/lib/proposal-status';
import { ProposalStatusDropdown } from '@/components/proposal-status-dropdown';
import { NotesPanel } from '@/components/notes-panel';
import { ProposalAssignPopover } from '@/components/proposal-assign-popover';
import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;

interface DashboardViewProps {
  initialProposals: RouterOutputs['proposals']['listForDashboard'];
  initialIsAdmin: RouterOutputs['settings']['checkAdmin'];
}

const PAGE_SIZE = 20;

export function DashboardView({ initialProposals, initialIsAdmin }: DashboardViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<'mine' | 'all'>('mine');
  const [statusFilter, setStatusFilter] = useState<RequestItem['status'] | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Reset page when filters change
  const handleFilterChange = (filter: 'mine' | 'all') => {
    setActiveFilter(filter);
    setPage(1);
  };
  const handleStatusFilter = (status: RequestItem['status'] | undefined) => {
    setStatusFilter(status);
    setPage(1);
  };
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const { data: isAdmin = false } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    initialData: initialIsAdmin,
  });

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const duplicateMutation = trpc.proposals.duplicate.useMutation({
    onMutate: ({ proposalId }) => setDuplicatingId(proposalId),
    onSuccess: (data) => {
      toast({ title: 'Proposal duplicated' });
      router.push(`/itineraries/${data.newProposalId}/day-by-day`);
    },
    onError: (err) => {
      toast({ title: err.message || 'Failed to duplicate', variant: 'destructive' });
    },
    onSettled: () => setDuplicatingId(null),
  });

  const queryInput = {
    filter: activeFilter,
    page,
    pageSize: PAGE_SIZE,
    status: statusFilter,
    search: debouncedQuery || undefined,
  };

  const isDefaultQuery = activeFilter === 'mine' && page === 1 && !statusFilter && !debouncedQuery;

  const { data, isLoading: proposalsLoading } = trpc.proposals.listForDashboard.useQuery(
    queryInput,
    {
      staleTime: staleTimes.proposals,
      initialData: isDefaultQuery ? initialProposals : undefined,
      placeholderData: (prev) => prev,
    },
  );

  const proposals = data?.items ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalCount = data?.totalCount ?? 0;

  const requests: RequestItem[] = proposals.map(
    (p: any): RequestItem => ({
      id: p.id,
      client: p.client?.name || 'Unknown',
      travelers: 0,
      country: 'Unknown',
      title: p.tourTitle || p.name,
      startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD',
      received: new Date(p.createdAt).toLocaleDateString(),
      source: 'Manual',
      status: p.status || 'draft',
      assignees: (p.assignments || []).map(
        (a: any): AssignedUser => ({
          id: a.user.id,
          name: a.user.name,
          image: a.user.image,
        }),
      ),
    }),
  );

  if (proposalsLoading && !data) {
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
          <div className="">
            <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  activeFilter === 'mine'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                onClick={() => handleFilterChange('mine')}
              >
                My Proposals
              </button>
              <button
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  activeFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
                onClick={() => handleFilterChange('all')}
              >
                All Proposals
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
              <Input
                placeholder="Search proposals..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                    statusFilter
                      ? `${getStatusConfig(statusFilter).bg} ${getStatusConfig(statusFilter).text} border-current/20`
                      : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <Filter className="h-3.5 w-3.5" />
                  {statusFilter ? getStatusConfig(statusFilter).label : 'All'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => handleStatusFilter(undefined)}
                  className="flex items-center gap-2"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-stone-400" />
                  <span className="flex-1">All</span>
                  {!statusFilter && <Check className="h-3.5 w-3.5 text-stone-500" />}
                </DropdownMenuItem>
                {PROPOSAL_STATUSES.map((s) => {
                  const cfg = getStatusConfig(s);
                  return (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => handleStatusFilter(s)}
                      className="flex items-center gap-2"
                    >
                      <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
                      <span className="flex-1">{cfg.label}</span>
                      {statusFilter === s && <Check className="h-3.5 w-3.5 text-stone-500" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex-1 p-8">
        {requests.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">
              {debouncedQuery.trim() || statusFilter
                ? 'No matching proposals'
                : activeFilter === 'mine'
                  ? 'No proposals assigned to you'
                  : 'No proposals yet'}
            </h3>
            <p className="mt-1 text-stone-500">
              {debouncedQuery.trim() || statusFilter
                ? 'Try adjusting your search or filters.'
                : activeFilter === 'mine'
                  ? 'Switch to "All Proposals" to see everything, or create a new proposal.'
                  : 'Create your first proposal using the sidebar button.'}
            </p>
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
                      <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800">
                        {req.client}
                      </h3>
                      <ProposalStatusDropdown
                        proposalId={req.id}
                        status={req.status}
                        activeFilter={activeFilter}
                      />
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{req.title}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    {req.assignees.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {req.assignees.slice(0, 3).map((assignee) =>
                          assignee.image ? (
                            <img
                              key={assignee.id}
                              src={assignee.image}
                              alt={assignee.name}
                              title={assignee.name}
                              className="h-6 w-6 rounded-full border-2 border-white object-cover"
                            />
                          ) : (
                            <span
                              key={assignee.id}
                              title={assignee.name}
                              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-200 text-[10px] font-medium text-stone-600"
                            >
                              {assignee.name?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          ),
                        )}
                        {req.assignees.length > 3 && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-stone-100 text-[10px] font-medium text-stone-500">
                            +{req.assignees.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-right text-sm text-stone-500">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Starts {req.startDate}
                      </div>
                      <div className="mt-1">Created {req.received}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                        <NotesPanel proposalId={req.id} compact />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Notes</TooltipContent>
                  </Tooltip>
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                          <ProposalAssignPopover
                            proposalId={req.id}
                            activeFilter={activeFilter}
                            currentAssigneeIds={req.assignees.map((a) => a.id)}
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>Assign</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="cursor-pointer rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          duplicateMutation.mutate({ proposalId: req.id });
                        }}
                        disabled={duplicatingId === req.id}
                      >
                        {duplicatingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Duplicate</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="cursor-pointer rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-600"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          router.push(`/itineraries/${req.id}/day-by-day`);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                  </Tooltip>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="border-t border-stone-200 bg-white px-8 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-stone-500">
              {totalCount} proposal{totalCount !== 1 ? 's' : ''}
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
