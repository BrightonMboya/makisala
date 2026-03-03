'use client';

import { Input } from '@repo/ui/input';
import { FileText, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDebounce } from '@repo/ui/use-debounce';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import type { ProposalStatus } from '@/types/dashboard';
import { checkOnboardingStatus } from '@/lib/onboarding';
import { Onboarding } from '../_components/onboarding';
import { useSession } from '@/components/session-context';
import { StatusFilterPills } from './_components/status-filter-pills';
import { NeedsAttentionSection } from './_components/needs-attention-section';
import { ProposalCard } from './_components/proposal-card';
import { SortControls } from './_components/sort-controls';
import { Pagination } from './_components/pagination';

export default function DashboardPage() {
  const utils = trpc.useUtils();
  const { session } = useSession();
  const userId = session?.user?.id;

  // Filter & sort state
  const [activeFilter, setActiveFilter] = useState<'mine' | 'all'>('mine');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [activeStatuses, setActiveStatuses] = useState<ProposalStatus[]>([]);
  const [sortBy, setSortBy] = useState<'updatedAt' | 'startDate' | 'createdAt' | 'status'>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [activeFilter, debouncedQuery, activeStatuses, sortBy, sortOrder]);

  const { data: isAdmin = false } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    enabled: !!userId,
  });

  const { data: stats } = trpc.proposals.dashboardStats.useQuery(
    { filter: activeFilter },
    { staleTime: staleTimes.proposals, enabled: !!userId },
  );

  const { data: proposalsData, isLoading: proposalsLoading } = trpc.proposals.listForDashboard.useQuery(
    {
      filter: activeFilter,
      status: activeStatuses.length > 0 ? activeStatuses : undefined,
      search: debouncedQuery || undefined,
      sortBy,
      sortOrder,
      page,
      pageSize: 12,
    },
    { staleTime: staleTimes.proposals, enabled: !!userId },
  );

  // Onboarding
  const { data: onboardingData, isLoading: onboardingLoading } = trpc.onboarding.getData.useQuery(
    undefined,
    { staleTime: staleTimes.dashboardData, enabled: !!userId },
  );
  const markCompleteMutation = trpc.onboarding.markComplete.useMutation();
  const orgOnboardingComplete = !!onboardingData?.organization?.onboardingCompletedAt;
  const onboardingStatus =
    onboardingData && !orgOnboardingComplete
      ? checkOnboardingStatus(onboardingData.organization, onboardingData.tourCount)
      : null;

  useEffect(() => {
    if (onboardingStatus?.isComplete && !orgOnboardingComplete) {
      markCompleteMutation.mutate();
    }
  }, [onboardingStatus?.isComplete, orgOnboardingComplete]);

  const handleToursUpdated = () => {
    utils.onboarding.getData.invalidate();
  };

  const isOnboarded = orgOnboardingComplete || onboardingStatus?.isComplete;
  const isLoading = proposalsLoading || onboardingLoading;

  const handleStatusToggle = (status: ProposalStatus) => {
    setActiveStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  // Loading
  if (isLoading && !proposalsData) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  // Onboarding
  if (!isOnboarded && onboardingStatus) {
    return (
      <Onboarding
        status={onboardingStatus}
        organizationName={onboardingData?.organization?.name}
        onToursUpdated={handleToursUpdated}
      />
    );
  }

  const items = proposalsData?.items ?? [];
  const total = Number(proposalsData?.total ?? 0);

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-8 py-4">
        <div className="flex items-center gap-4">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Dashboard</h2>
          <div className="flex rounded-lg border border-stone-200 bg-stone-50 p-0.5">
            <button
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                activeFilter === 'mine'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              onClick={() => setActiveFilter('mine')}
            >
              My Proposals
            </button>
            <button
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
              onClick={() => setActiveFilter('all')}
            >
              All Proposals
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderChange={setSortOrder}
          />
          <div className="relative w-64">
            <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Search proposals..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-8">
        {/* Stats bar */}
        {stats && (
          <StatusFilterPills
            counts={stats.counts}
            activeStatuses={activeStatuses}
            onToggle={handleStatusToggle}
          />
        )}

        {/* Needs Attention */}
        {stats?.needsAttention && stats.needsAttention.length > 0 && (
          <NeedsAttentionSection items={stats.needsAttention as any} />
        )}

        {/* Proposal grid */}
        {items.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">
              {debouncedQuery.trim() || activeStatuses.length > 0
                ? 'No matching proposals'
                : activeFilter === 'mine'
                  ? 'No proposals assigned to you'
                  : 'No proposals yet'}
            </h3>
            <p className="mt-1 text-stone-500">
              {debouncedQuery.trim() || activeStatuses.length > 0
                ? 'Try adjusting your filters or search terms.'
                : activeFilter === 'mine'
                  ? 'Switch to "All Proposals" to see everything, or create a new proposal.'
                  : 'Create your first proposal using the sidebar button.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((p: any) => (
              <ProposalCard
                key={p.id}
                id={p.id}
                client={p.client?.name || 'Unknown'}
                title={p.tourTitle || p.name}
                status={p.status}
                startDate={p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD'}
                received={new Date(p.createdAt).toLocaleDateString()}
                dayCount={p.days?.length ?? 0}
                assignees={(p.assignments || []).map((a: any) => ({
                  id: a.user.id,
                  name: a.user.name,
                  image: a.user.image,
                }))}
                isAdmin={isAdmin}
                activeFilter={activeFilter}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={12}
          total={total}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
