'use client';

import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@repo/ui/toast';
import { ArrowLeft, FileText, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { InvoiceSheet } from '@/components/invoices/invoice-sheet';
import { formatMoney } from '@/components/invoices/form-types';

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

export default function InvoicesForProposalPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalId = params.proposalId as string;

  const utils = trpc.useUtils();
  const { data: invoices, isLoading } = trpc.invoices.listForProposal.useQuery({ proposalId });
  const { data: proposal } = trpc.proposals.getById.useQuery({ id: proposalId });

  const openInvoice = (invoiceId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('invoiceId', invoiceId);
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const createMutation = trpc.invoices.createFromProposal.useMutation({
    onSuccess: (invoice) => {
      void utils.invoices.listForProposal.invalidate({ proposalId });
      if (invoice?.id) openInvoice(invoice.id);
    },
    onError: (error) => {
      toast({
        title: 'Could not create invoice',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-8 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-[#878787] hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="text-[#878787]">/</span>
          <h2 className="font-serif text-lg font-bold text-foreground">
            {proposal?.tourTitle || proposal?.name || 'Invoices'}
          </h2>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => createMutation.mutate({ proposalId })}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Create invoice
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6">
            <h1 className="font-serif text-xl font-bold text-foreground">Invoices</h1>
            <p className="mt-1 text-xs text-[#878787]">
              Send deposit, balance, or full invoices for this proposal.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-[#878787]" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-background">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Invoice no
                    </th>
                    <th className="px-4 py-2.5 text-left font-mono text-[11px] font-normal uppercase tracking-wide text-[#878787]">
                      Title
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
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
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
                          {invoice.title || (
                            <span className="text-[#878787]">—</span>
                          )}
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
                No invoices yet
              </h2>
              <p className="mt-1 text-xs text-[#878787]">
                Create your first invoice to bill this client.
              </p>
              <Button
                className="mt-4 gap-2"
                onClick={() => createMutation.mutate({ proposalId })}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                Create invoice
              </Button>
            </div>
          )}
        </div>
      </div>

      <InvoiceSheet proposalId={proposalId} />
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
