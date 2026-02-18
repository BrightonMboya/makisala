'use client';

import { Input } from '@repo/ui/input';
import { Clock, FileText, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useDebounce } from '@repo/ui/use-debounce';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import type { AssignedUser, RequestItem } from '@/types/dashboard';
import { checkOnboardingStatus } from '@/lib/onboarding';
import { Onboarding } from '../_components/onboarding';
import { NotesPanel } from '@/components/notes-panel';
import { ProposalAssignPopover } from '@/components/proposal-assign-popover';
import { useSession } from '@/components/session-context';

export default function DashboardPage() {
  const router = useRouter();
  const utils = trpc.useUtils();
  const { session } = useSession();
  const userId = session?.user?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<'mine' | 'all'>('mine');

  const { data: isAdmin = false } = trpc.settings.checkAdmin.useQuery(undefined, {
    staleTime: staleTimes.dashboardData,
    enabled: !!userId,
  });

  const { data: proposals = [], isLoading: proposalsLoading } = trpc.proposals.listForDashboard.useQuery(
    { filter: activeFilter },
    { staleTime: staleTimes.proposals, enabled: !!userId },
  );

  // Always fetch onboarding data to check org-level completion status
  const { data: onboardingData, isLoading: onboardingLoading } = trpc.onboarding.getData.useQuery(
    undefined,
    { staleTime: staleTimes.dashboardData, enabled: !!userId },
  );

  const markCompleteMutation = trpc.onboarding.markComplete.useMutation();

  // Check if org has already completed onboarding (stored at org level)
  const orgOnboardingComplete = !!onboardingData?.organization?.onboardingCompletedAt;

  // Calculate onboarding status from fetched data (only if org hasn't completed onboarding)
  const onboardingStatus =
    onboardingData && !orgOnboardingComplete
      ? checkOnboardingStatus(onboardingData.organization, onboardingData.tourCount)
      : null;

  // When all onboarding steps are complete, persist to org level in database
  useEffect(() => {
    if (onboardingStatus?.isComplete && !orgOnboardingComplete) {
      markCompleteMutation.mutate();
    }
  }, [onboardingStatus?.isComplete, orgOnboardingComplete]);

  // Callback to refetch data when tours are updated during onboarding
  const handleToursUpdated = () => {
    utils.onboarding.getData.invalidate();
  };

  const isOnboarded = orgOnboardingComplete || onboardingStatus?.isComplete;
  const isLoading = proposalsLoading || onboardingLoading;

  const requests: RequestItem[] = proposals
    .map((p: any): RequestItem => ({
      id: p.id,
      client: p.client?.name || 'Unknown',
      travelers: 0,
      country: 'Unknown',
      title: p.tourTitle || p.name,
      startDate: p.startDate ? new Date(p.startDate).toLocaleDateString() : 'TBD',
      received: new Date(p.createdAt).toLocaleDateString(),
      source: 'Manual',
      status: p.status === 'shared' ? 'shared' : 'draft',
      assignees: (p.assignments || []).map((a: any): AssignedUser => ({
        id: a.user.id,
        name: a.user.name,
        image: a.user.image,
      })),
    }))
    .filter((req) => {
      if (!debouncedQuery.trim()) return true;
      const query = debouncedQuery.toLowerCase();
      return (
        req.client.toLowerCase().includes(query) ||
        req.title.toLowerCase().includes(query) ||
        req.status.toLowerCase().includes(query)
      );
    });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  // Show onboarding if not complete
  if (!isOnboarded && onboardingStatus) {
    return (
      <Onboarding
        status={onboardingStatus}
        organizationName={onboardingData?.organization?.name}
        onToursUpdated={handleToursUpdated}
      />
    );
  }

  // Show regular dashboard
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

      <div className="p-8">
        {requests.length === 0 ? (
          <div className="py-24 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">
              {debouncedQuery.trim()
                ? 'No matching proposals'
                : activeFilter === 'mine'
                  ? 'No proposals assigned to you'
                  : 'No proposals yet'}
            </h3>
            <p className="mt-1 text-stone-500">
              {debouncedQuery.trim()
                ? 'Try adjusting your search terms.'
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
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          req.status === 'shared'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {req.status === 'shared' ? 'Shared' : 'Draft'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-stone-600">{req.title}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    {req.assignees.length > 0 && (
                      <div className="flex -space-x-1.5">
                        {req.assignees.slice(0, 3).map((assignee) => (
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
                          )
                        ))}
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
                <div className="mt-4 flex items-center justify-end gap-3 border-t border-stone-100 pt-3">
                  <NotesPanel proposalId={req.id} compact />
                  {isAdmin && (
                    <ProposalAssignPopover
                      proposalId={req.id}
                      activeFilter={activeFilter}
                    />
                  )}
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
