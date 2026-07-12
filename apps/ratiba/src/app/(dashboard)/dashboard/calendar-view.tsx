'use client';

import { useEffect, useState } from 'react';
import { IlamyCalendar } from '@ilamy/calendar';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Input } from '@repo/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { useDebounce } from '@repo/ui/use-debounce';
import { keepPreviousData } from '@tanstack/react-query';
import { Check, Filter, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { getStatusConfig, PROPOSAL_STATUSES, type ProposalStatus } from '@/lib/proposal-status';
import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';
import { monthWindow, type CalendarWindow } from './calendar-window';
import { ProposalEventMenu, type ProposalEventData } from './proposal-event-menu';

type CalendarTrips = inferRouterOutputs<AppRouter>['proposals']['listForCalendar'];
type SearchResult = {
  id: string;
  title: string;
  client: string | null;
  status: ProposalStatus;
  startDate: string;
};

const MAX_RESULTS = 8;

export function CalendarView({
  initialTrips,
  initialRange,
}: {
  initialTrips: CalendarTrips;
  initialRange: CalendarWindow;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 200);
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | undefined>(undefined);
  // The specific trip the calendar is focused on (chosen from search results).
  // `seq` bumps on every selection so re-picking the same trip (after manually
  // navigating away) still forces the calendar to remount and jump back.
  const [focus, setFocus] = useState<{ id: string; startDate: string; seq: number } | null>(null);
  // The visible calendar window, so we only load trips in view rather than every
  // proposal the org ever created. Updated as the user navigates the calendar.
  const [range, setRange] = useState<CalendarWindow>(initialRange);

  // `keepPreviousData` keeps the current month's trips on screen while the next
  // window loads, so navigating never flashes an empty calendar.
  const { data = [] } = trpc.proposals.listForCalendar.useQuery(
    { filter: 'all', ...range },
    {
      staleTime: staleTimes.proposals,
      placeholderData: keepPreviousData,
      // Seed only matches the initial window; other windows fetch fresh.
      initialData: range === initialRange ? initialTrips : undefined,
    },
  );

  const statusTrips = statusFilter ? data.filter((t) => t.status === statusFilter) : data;

  // The calendar always shows every (status-filtered) trip; search is a separate
  // "find and jump to" affordance so nothing is ever hidden by it.
  const events = statusTrips.map((t) => {
    const start = new Date(t.startDate);
    // Build inclusive local-day bounds so a trip covers each of its calendar
    // days regardless of how the library treats an all-day end boundary.
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
    const endDay = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + (t.numberOfDays - 1),
      23,
      59,
      0,
    );
    const { hex } = getStatusConfig(t.status);
    return {
      id: t.id,
      title: t.client ? `${t.title} · ${t.client}` : t.title,
      start: startDay,
      end: endDay,
      allDay: true,
      color: hex.fg,
      backgroundColor: hex.bg,
      // Carried through to `renderEvent` so the pill's action menu knows which
      // proposal it acts on, shows the current status as checked, and can
      // prefill the duplicate dialog with the tour's own title.
      data: {
        proposalId: t.id,
        status: t.status,
        title: t.title,
      } satisfies ProposalEventData,
    };
  });

  const searchTerm = debouncedQuery.trim();
  const showResults = searchOpen && searchTerm.length > 0;

  // Search spans every proposal, not just the loaded window, so you can find and
  // jump to a trip in any month. Runs server-side so it stays fast as the
  // proposal history grows.
  const { data: searchData } = trpc.proposals.listForDashboard.useQuery(
    { filter: 'all', search: searchTerm, status: statusFilter, page: 1, pageSize: MAX_RESULTS },
    { enabled: showResults, staleTime: staleTimes.proposals, placeholderData: keepPreviousData },
  );

  // Matches ordered soonest-first so trips that share a name stay disambiguated
  // by the date shown on each row.
  const results: SearchResult[] = showResults
    ? (searchData?.items ?? [])
        .filter((t): t is typeof t & { startDate: string } => Boolean(t.startDate))
        .map((t) => ({
          id: t.id,
          title: t.tourTitle || t.name,
          client: t.client?.name ?? null,
          status: t.status,
          startDate: t.startDate,
        }))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    : [];

  // The calendar reads `initialDate` on mount only, so we remount it via `key`
  // to jump to the focused trip's month.
  const focusDate = focus ? new Date(focus.startDate) : undefined;
  const calendarKey = focus ? `focus-${focus.id}-${focus.seq}` : 'default';

  // The calendar library measures its container after mount and paints its grid
  // only then, leaving the body blank on first render. Overlay a spinner until
  // it has had a layout+paint pass. Re-run on every remount (calendarKey change).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(false);
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setReady(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [calendarKey]);

  const selectTrip = (t: Pick<SearchResult, 'id' | 'startDate'>) => {
    setFocus((prev) => ({ id: t.id, startDate: t.startDate, seq: (prev?.seq ?? 0) + 1 }));
    // Move the window to the selected trip's month. The calendar remounts to jump
    // there, but that doesn't fire onDateChange, so we set the window here to load
    // that month's trips (which includes the one we're jumping to).
    setRange(monthWindow(new Date(t.startDate)));
    setSearchQuery('');
    setSearchOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-end gap-2">
        <div className="relative w-72">
          <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Search proposals..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            // Delay so a click on a result row registers before the list closes.
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) selectTrip(results[0]);
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
          {showResults && (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
              {results.length === 0 ? (
                <div className="px-3 py-2.5 text-sm text-stone-500">No matching proposals</div>
              ) : (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {results.map((t) => {
                    const cfg = getStatusConfig(t.status);
                    return (
                      <li key={t.id}>
                        <button
                          type="button"
                          // onMouseDown (not onClick) so it fires before input blur.
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectTrip(t);
                          }}
                          className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-stone-50"
                        >
                          <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-stone-900">
                              {t.title}
                              {t.client ? <span className="text-stone-500"> · {t.client}</span> : null}
                            </span>
                            <span className="block text-xs text-stone-500">
                              {format(new Date(t.startDate), 'MMM d, yyyy')}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
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
              onClick={() => setStatusFilter(undefined)}
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
                  onClick={() => setStatusFilter(s)}
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

      <div className="relative flex-1 rounded-lg border border-stone-200 bg-white p-4">
        {!ready && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
          </div>
        )}
        <IlamyCalendar
          key={calendarKey}
          initialDate={focusDate}
          events={events}
          initialView="month"
          disableDragAndDrop
          disableCellClick
          hideExportButton
          dayMaxEvents={4}
          // Clicking an event navigates to its editor. Without an `onEventClick`
          // the library falls back to opening its own built-in "Edit Event"
          // form, which we don't want. The pill's kebab stops propagation so its
          // menu doesn't also trigger this navigation.
          onEventClick={(e) => router.push(`/itineraries/${e.id}/day-by-day`)}
          renderEvent={(e) => (
            <ProposalEventMenu
              title={e.title}
              color={e.color}
              backgroundColor={e.backgroundColor}
              data={e.data as ProposalEventData}
            />
          )}
          onDateChange={(_date, r) =>
            setRange({ rangeStart: r.start.toISOString(), rangeEnd: r.end.toISOString() })
          }
        />
      </div>
    </div>
  );
}
