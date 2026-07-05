'use client';

import { Button } from '@repo/ui/button';
import { toast } from '@repo/ui/toast';
import { Check, Download, ExternalLink, Loader2, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useDebounceValue } from 'usehooks-ts';
import { trpc } from '@/lib/trpc';
import type { Invoice } from '@repo/db/schema';
import { InvoiceMeta } from './invoice-meta';
import { InvoiceLogo } from './invoice-logo';
import { LineItems } from './line-items';
import { NoteBlock } from './note-block';
import { PartyEditor } from './party-editor';
import { Summary } from './summary';
import {
  toFormLineItems,
  toWireLineItems,
  type InvoiceFormValues,
} from './form-types';

function buildDefaults(invoice: Invoice): InvoiceFormValues {
  return {
    id: invoice.id,
    number: invoice.number,
    title: invoice.title ?? null,
    currency: invoice.currency,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate ?? null,
    lineItems: toFormLineItems(invoice.lineItems ?? []),
    taxRatePct: invoice.taxRatePct == null ? null : Number(invoice.taxRatePct),
    notes: invoice.notes ?? null,
    fromDetails: invoice.fromDetails,
    toDetails: invoice.toDetails,
    sentAt: invoice.sentAt ?? null,
    shareToken: invoice.shareToken ?? null,
  };
}

interface InvoiceFormProps {
  invoice: Invoice;
  proposalId: string;
  onSent?: () => void;
}

export function InvoiceForm({ invoice, proposalId, onSent }: InvoiceFormProps) {
  const form = useForm<InvoiceFormValues>({
    defaultValues: buildDefaults(invoice),
  });

  useEffect(() => {
    form.reset(buildDefaults(invoice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice.id]);

  const utils = trpc.useUtils();
  const [isSaving, setIsSaving] = useState(false);

  const updateMutation = trpc.invoices.update.useMutation({
    onMutate: () => setIsSaving(true),
    onSuccess: () => {
      void utils.invoices.getById.invalidate({ id: invoice.id });
      void utils.invoices.listForProposal.invalidate({ proposalId });
    },
    onError: (error) => {
      toast({
        title: 'Could not save draft',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => setIsSaving(false),
  });

  const sendMutation = trpc.invoices.send.useMutation({
    onSuccess: () => {
      void utils.invoices.getById.invalidate({ id: invoice.id });
      void utils.invoices.listForProposal.invalidate({ proposalId });
      toast({
        title: 'Invoice sent',
        description: 'Client received the invoice with a PDF attachment.',
      });
      onSent?.();
    },
    onError: (error) => {
      toast({
        title: 'Could not send invoice',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const setPaidMutation = trpc.invoices.setPaid.useMutation({
    onSuccess: (updated) => {
      void utils.invoices.getById.invalidate({ id: invoice.id });
      void utils.invoices.listForProposal.invalidate({ proposalId });
      toast({
        title: updated?.status === 'paid' ? 'Marked as paid' : 'Marked as unpaid',
      });
    },
    onError: (error) => {
      toast({
        title: 'Could not update payment status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // A sent OR paid invoice is locked: its amounts are settled and should no
  // longer be edited (an offline/POS payment can lock a never-sent draft).
  const locked = !!invoice.sentAt || invoice.status === 'paid';

  return (
    <FormProvider {...form}>
      <form
        className="flex h-full flex-col"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
            e.preventDefault();
          }
        }}
      >
        <AutoSaveBridge
          invoiceId={invoice.id}
          sent={locked}
          onChange={(values) => {
            updateMutation.mutate({
              id: invoice.id,
              title: values.title || null,
              notes: values.notes || null,
              dueDate: values.dueDate || null,
              taxRatePct: values.taxRatePct,
              lineItems: toWireLineItems(values.lineItems),
              fromDetails: values.fromDetails,
              toDetails: values.toDetails,
            });
          }}
        />

        <div className="flex-1 overflow-y-auto bg-[#fcfcfc] dark:bg-[#0f0f0f]">
          <div className="flex h-full flex-col p-8">
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <InvoiceMeta />
              </div>
              <div className="flex-shrink-0">
                <InvoiceLogo />
              </div>
            </div>

            <div className="mt-8 mb-4 grid grid-cols-2 gap-6">
              <PartyEditor name="fromDetails" label="From" readOnly={locked} />
              <PartyEditor
                name="toDetails"
                label="Bill to"
                placeholder="Client name\nclient@example.com"
                readOnly={locked}
              />
            </div>

            <div className="mt-6">
              <LineItems readOnly={locked} />
            </div>

            <div className="mt-12 mb-8 flex justify-end">
              <Summary />
            </div>

            <div className="mt-auto pb-4">
              <NoteBlock
                name="notes"
                label="Note"
                placeholder="Add a note for your client..."
                readOnly={locked}
              />
            </div>
          </div>
        </div>

        <FooterBar
          invoice={invoice}
          isSaving={isSaving}
          isSending={sendMutation.isPending}
          isTogglingPaid={setPaidMutation.isPending}
          onSend={() =>
            sendMutation.mutate({
              id: invoice.id,
            })
          }
          onTogglePaid={() =>
            setPaidMutation.mutate({
              id: invoice.id,
              paid: invoice.status !== 'paid',
            })
          }
        />
      </form>
    </FormProvider>
  );
}

function AutoSaveBridge({
  invoiceId,
  sent,
  onChange,
}: {
  invoiceId: string;
  sent: boolean;
  onChange: (values: InvoiceFormValues) => void;
}) {
  const values = useWatch<InvoiceFormValues>();
  const [debounced] = useDebounceValue(values, 600);
  const [baseline, setBaseline] = useState<string | null>(null);

  useEffect(() => {
    setBaseline(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    if (sent || !debounced) return;
    const serialized = JSON.stringify(debounced);
    if (baseline === null) {
      setBaseline(serialized);
      return;
    }
    if (serialized === baseline) return;
    setBaseline(serialized);
    onChange(debounced as InvoiceFormValues);
  }, [debounced, baseline, sent, onChange]);

  return null;
}

function FooterBar({
  invoice,
  isSaving,
  isSending,
  isTogglingPaid,
  onSend,
  onTogglePaid,
}: {
  invoice: Invoice;
  isSaving: boolean;
  isSending: boolean;
  isTogglingPaid: boolean;
  onSend: () => void;
  onTogglePaid: () => void;
}) {
  const sent = !!invoice.sentAt;
  const paid = invoice.status === 'paid';
  return (
    <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4">
      <div className="flex items-center gap-2 text-[11px] text-[#878787]">
        {paid ? (
          <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wide text-[#15803d]">
            <Check className="h-3 w-3" /> Paid
          </span>
        ) : sent ? (
          <span className="inline-flex items-center gap-1 font-mono uppercase tracking-wide">
            <Send className="h-3 w-3" /> Sent
          </span>
        ) : isSaving ? (
          <span className="inline-flex items-center gap-1.5 font-mono uppercase tracking-wide">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving
          </span>
        ) : (
          <span className="font-mono uppercase tracking-wide">Draft saved</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {invoice.shareToken ? (
          <>
            <a
              href={`/invoice/${invoice.shareToken}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
              title={sent ? 'Open public invoice' : 'Preview the invoice as the client will see it'}
            >
              <ExternalLink className="h-3 w-3" />
              {sent ? 'Public link' : 'Preview'}
            </a>
            <a
              href={`/invoice/${invoice.shareToken}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
            >
              <Download className="h-3 w-3" />
              PDF
            </a>
          </>
        ) : null}
        {paid ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-2"
            onClick={onTogglePaid}
            disabled={isTogglingPaid}
          >
            {isTogglingPaid ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Mark as unpaid
          </Button>
        ) : sent ? (
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-[#15803d] text-white hover:bg-[#15803d]/90"
            onClick={onTogglePaid}
            disabled={isTogglingPaid}
          >
            {isTogglingPaid ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Mark as paid
          </Button>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={onTogglePaid}
              disabled={isTogglingPaid || isSaving}
              title="Record a payment made offline (e.g. card, POS, cash) without sending the invoice"
            >
              {isTogglingPaid ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark as paid
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-foreground text-background hover:bg-foreground/90"
              onClick={onSend}
              disabled={isSending || isSaving}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send invoice
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
