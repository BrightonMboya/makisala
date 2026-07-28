'use client';

import { Input } from '@repo/ui/input';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, FileText, Loader2, Search } from 'lucide-react';
import { useEffect, useState, useDeferredValue } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { InvoiceSheet } from '@/components/invoices/invoice-sheet';
import { formatMoney } from '@/components/invoices/form-types';
import { ActivityTrigger } from '@/components/activity/activity-trigger';
import { ActivitySheet } from '@/components/activity/activity-sheet';

const PAGE_SIZE = 20;

function formatDate(value: string | null | undefined) {
  if (!value) return '';
  try {
    const d = new Date(value);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric',
    });
  } catch {
    return '';
  }
}

export default function InvoicesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [deferredSearchQuery]);

  const { data, isLoading, isFetching } = trpc.invoices.listAll.useQuery({
    page,
    limit: PAGE_SIZE,
    query: deferredSearchQuery.trim() || undefined,
  });
  const invoices = data?.invoices ?? [];
  const pagination = data?.pagination;

  const selectedInvoiceId = searchParams.get('invoiceId');
  const selectedInvoice = invoices.find((invoice) => invoice.id === selectedInvoiceId);

  const openInvoice = (invoiceId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('invoiceId', invoiceId);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-8 py-4">
        <h2 className="font-serif text-lg font-bold text-foreground">Invoices</h2>
        <div className="relative w-64">
          <Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-[#878787]" />
          <Input
            placeholder="Search invoices..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-6xl">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[#878787]" />
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Invoice no
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Tour
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Client
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Status
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Issue date
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Due
                    </th>
                    <th className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 text-right font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]" />
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const tourName = invoice.proposal?.tourTitle || invoice.proposal?.name;
                    return (
                      <tr
                        key={invoice.id}
                        onClick={() => openInvoice(invoice.id)}
                        className="group cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-accent/40"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-[11px] text-foreground">
                            {invoice.number}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-foreground">
                          {tourName || <span className="text-[#878787]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-foreground">
                          {invoice.client?.name || <span className="text-[#878787]">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill
                            status={invoice.status}
                            overdue={
                              invoice.status === 'sent' &&
                              !!invoice.dueDate &&
                              new Date(invoice.dueDate) < new Date()
                            }
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#878787]">
                          {formatDate(invoice.issueDate)}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#878787]">
                          {formatDate(invoice.dueDate)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-[11px] text-foreground">
                            {formatMoney(invoice.totalCents / 100, invoice.currency)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActivityTrigger
                            kind="invoice"
                            id={invoice.id}
                            className="inline-flex items-center gap-1 text-[#878787] hover:text-foreground"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-border bg-background py-20 text-center">
              <FileText className="mx-auto h-8 w-8 text-[#878787]/60" />
              <h2 className="mt-4 font-serif text-base font-bold text-foreground">
                {deferredSearchQuery ? 'No matching invoices' : 'No invoices yet'}
              </h2>
              <p className="mt-1 text-xs text-[#878787]">
                {deferredSearchQuery
                  ? 'Try a different search.'
                  : 'Create an invoice from a proposal to see it here.'}
              </p>
            </div>
          )}

          {pagination && (pagination.page > 1 || pagination.hasNextPage) && (
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={pagination.page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="font-mono text-[11px] text-[#878787]">Page {pagination.page}</span>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                disabled={!pagination.hasNextPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <InvoiceSheet proposalId={selectedInvoice?.proposalId ?? null} />
      <ActivitySheet />
    </div>
  );
}

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void';

function StatusPill({ status, overdue }: { status: InvoiceStatus; overdue?: boolean }) {
  const variant =
    overdue && status === 'sent'
      ? { label: 'Overdue', dot: 'bg-red-500', pill: 'bg-red-500/10 text-red-600' }
      : {
          draft: { label: 'Draft', dot: 'bg-[#878787]', pill: 'bg-[#878787]/10 text-[#878787]' },
          sent: { label: 'Sent', dot: 'bg-amber-500', pill: 'bg-amber-500/10 text-amber-600' },
          paid: { label: 'Paid', dot: 'bg-[#15803d]', pill: 'bg-[#15803d]/10 text-[#15803d]' },
          void: { label: 'Void', dot: 'bg-[#878787]', pill: 'bg-[#878787]/10 text-[#878787]' },
        }[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide',
        variant.pill,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', variant.dot)} />
      {variant.label}
    </span>
  );
}
