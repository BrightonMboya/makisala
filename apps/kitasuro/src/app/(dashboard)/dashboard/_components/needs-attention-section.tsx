'use client';

import { AlertTriangle, Clock } from 'lucide-react';
import Link from 'next/link';

interface NeedsAttentionSectionProps {
  items: Array<{
    id: string;
    name: string;
    tourTitle: string | null;
    startDate: string | null;
    client: { name: string } | null;
    [key: string]: unknown;
  }>;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function NeedsAttentionSection({ items }: NeedsAttentionSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-900">Needs Attention</h3>
        <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-800">
          {items.length}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const days = item.startDate ? daysUntil(item.startDate) : null;
          return (
            <Link
              key={item.id}
              href={`/proposal/${item.id}`}
              className="flex items-start justify-between rounded-lg border border-amber-200 bg-white p-3 transition-colors hover:border-amber-300 hover:bg-amber-50/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">
                  {item.client?.name || 'Unknown'}
                </p>
                <p className="truncate text-xs text-stone-500">{item.tourTitle || item.name}</p>
              </div>
              <div className="ml-2 flex shrink-0 items-center gap-1 text-xs font-medium text-amber-700">
                <Clock className="h-3 w-3" />
                {days !== null && days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
