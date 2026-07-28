'use client';

import { Eye } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export function ActivityTrigger({
  kind,
  id,
  className,
}: {
  kind: 'proposal' | 'invoice';
  id: string;
  className?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        const next = new URLSearchParams(searchParams.toString());
        next.set('activity', `${kind}:${id}`);
        router.replace(`?${next.toString()}`, { scroll: false });
      }}
      title="View activity"
      className={
        className ??
        'inline-flex items-center gap-1.5 rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50'
      }
    >
      <Eye className="h-3.5 w-3.5" />
      Activity
    </button>
  );
}
