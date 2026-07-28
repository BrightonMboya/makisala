'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sheet, SheetContent } from '@repo/ui/sheet';
import { ActivityBody } from './activity-body';

// Deep-linkable like InvoiceSheet: state lives in ?activity=proposal:<id> /
// invoice:<id> rather than local useState.
export function ActivitySheet() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activity = searchParams.get('activity');
  const [kind, id] = activity?.split(':') ?? [];
  const isOpen = (kind === 'proposal' || kind === 'invoice') && !!id;

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        const next = new URLSearchParams(searchParams.toString());
        next.delete('activity');
        const qs = next.toString();
        router.replace(qs ? `?${qs}` : '?', { scroll: false });
      }
    },
    [router, searchParams],
  );

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[480px]"
      >
        {isOpen ? <ActivityBody key={activity} kind={kind as 'proposal' | 'invoice'} id={id} /> : null}
      </SheetContent>
    </Sheet>
  );
}
