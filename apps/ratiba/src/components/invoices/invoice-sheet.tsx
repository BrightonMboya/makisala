'use client';

import { Sheet, SheetContent } from '@repo/ui/sheet';
import { Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { InvoiceForm } from './invoice-form';

export function InvoiceSheet({ proposalId }: { proposalId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('invoiceId');
  const isOpen = !!invoiceId;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete('invoiceId');
        const qs = next.toString();
        router.replace(qs ? `?${qs}` : `?`, { scroll: false });
      }
    },
    [router, searchParams],
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[720px]"
      >
        {invoiceId ? (
          <SheetBody
            key={invoiceId}
            invoiceId={invoiceId}
            proposalId={proposalId}
            onSent={() => handleOpenChange(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function SheetBody({
  invoiceId,
  proposalId,
  onSent,
}: {
  invoiceId: string;
  proposalId: string;
  onSent: () => void;
}) {
  const { data: invoice, isLoading } = trpc.invoices.getById.useQuery({ id: invoiceId });

  if (isLoading || !invoice) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#878787]" />
      </div>
    );
  }

  return <InvoiceForm invoice={invoice} proposalId={proposalId} onSent={onSent} />;
}
