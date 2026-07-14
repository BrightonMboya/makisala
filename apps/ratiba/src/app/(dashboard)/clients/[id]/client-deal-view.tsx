'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Pencil,
  Phone,
  Plus,
  Users,
} from 'lucide-react';
import { Button } from '@repo/ui/button';
import { CountryFlag } from '@repo/ui/country-flag';
import { EmailStatusBadge } from '@/components/email-status-badge';
import { trpc } from '@/lib/trpc';
import { staleTimes } from '@/lib/query-keys';
import { ProposalStatusDropdown } from '@/components/proposal-status-dropdown';
import { NewRequestDialog } from '@/components/new-request-dialog';
import { ProposalRowMenu } from './proposal-row-menu';
import type { AppRouter } from '@/server/trpc/router';
import type { inferRouterOutputs } from '@trpc/server';

type RouterOutputs = inferRouterOutputs<AppRouter>;
type DealData = RouterOutputs['proposals']['listForClient'];

export function ClientDealView({
  clientId,
  initialData,
}: {
  clientId: string;
  initialData: DealData;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data } = trpc.proposals.listForClient.useQuery(
    { clientId },
    { initialData, staleTime: staleTimes.proposals },
  );

  const client = data?.client ?? initialData.client;
  const proposals = data?.proposals ?? initialData.proposals;

  return (
    <div className="flex h-full flex-col bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-8 py-5">
        <Link
          href="/dashboard"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to proposals
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-bold text-stone-900">{client.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-stone-500">
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="inline-flex items-center gap-1.5 hover:text-green-800"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {client.email}
                </a>
              )}
              {client.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {client.phone}
                </span>
              )}
              {client.countryOfResidence && (
                <CountryFlag country={client.countryOfResidence} size={16} className="text-stone-500" />
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" className="gap-1.5">
              <Link href={`/clients/${clientId}/edit`}>
                <Pencil className="h-4 w-4" />
                Edit client
              </Link>
            </Button>
            <Button
              className="gap-1.5 bg-green-700 hover:bg-green-800"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New proposal
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-8">
        <h2 className="mb-4 text-sm font-medium tracking-wide text-stone-500 uppercase">
          {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
        </h2>

        {proposals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-300 bg-white py-16 text-center">
            <div className="mx-auto mb-4 h-12 w-12 text-stone-300">
              <FileText className="h-full w-full" />
            </div>
            <h3 className="text-lg font-medium text-stone-900">No proposals yet</h3>
            <p className="mt-1 text-stone-500">
              Create the first proposal for {client.name}.
            </p>
            <Button
              className="mt-6 gap-1.5 bg-green-700 hover:bg-green-800"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              New proposal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all hover:border-green-600/30 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => router.push(`/itineraries/${p.id}/day-by-day`)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="truncate font-serif text-lg font-bold text-stone-900">
                      {p.title}
                    </h3>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {p.startDate
                        ? `Starts ${format(new Date(p.startDate), 'MMM d, yyyy')}`
                        : 'Date TBD'}
                    </span>
                    <span>
                      {p.numberOfDays} day{p.numberOfDays !== 1 ? 's' : ''}
                    </span>
                    {p.travelers > 0 && (
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {p.travelers} traveler{p.travelers !== 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs">
                      <EmailStatusBadge status={p.emailStatus} />
                    </span>
                  </div>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  <ProposalStatusDropdown proposalId={p.id} status={p.status} />
                  <Link
                    href={`/proposal/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => router.push(`/itineraries/${p.id}/day-by-day`)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <ProposalRowMenu proposalId={p.id} tourTitle={p.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultClientId={clientId}
      />
    </div>
  );
}
