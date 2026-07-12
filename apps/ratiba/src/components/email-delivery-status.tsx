'use client';

import { trpc } from '@/lib/trpc';
import {
  Check,
  Mail,
  MailOpen,
  MousePointerClick,
  Send,
  AlertTriangle,
} from 'lucide-react';

/**
 * Compact delivery timeline for the emails sent for a proposal. Reads from the
 * email_messages analytics table (populated at send time + Resend webhooks) and
 * polls so opens/clicks surface without a manual refresh.
 *
 * Note on "Opened": Resend reports opens via a tracking pixel, which Apple Mail
 * and some corporate scanners can pre-fetch, so an open is a directional signal,
 * not a guarantee the client read it.
 */
export function EmailDeliveryStatus({ proposalId }: { proposalId: string }) {
  const { data } = trpc.emails.forProposal.useQuery(
    { proposalId },
    {
      // Poll while the panel is open so delivered/opened/clicked land on their own.
      refetchInterval: 30_000,
      refetchOnWindowFocus: true,
    },
  );

  // Most recent send is the one operators care about.
  const message = data?.[0];
  if (!message) return null;

  const steps: Array<{
    key: string;
    label: string;
    at: string | null;
    icon: typeof Check;
    count?: number;
  }> = [
    { key: 'sent', label: 'Sent', at: message.sentAt, icon: Send },
    { key: 'delivered', label: 'Delivered', at: message.deliveredAt, icon: Check },
    { key: 'opened', label: 'Opened', at: message.openedAt, icon: MailOpen, count: message.openCount },
    {
      key: 'clicked',
      label: 'Clicked link',
      at: message.clickedAt,
      icon: MousePointerClick,
      count: message.clickCount,
    },
  ];

  const failure = message.bouncedAt
    ? { label: 'Bounced', at: message.bouncedAt }
    : message.complainedAt
      ? { label: 'Marked as spam', at: message.complainedAt }
      : message.failedAt
        ? { label: 'Failed to send', at: message.failedAt }
        : null;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-700">
        <Mail className="h-4 w-4 text-green-600" />
        Delivery status
        <span className="ml-auto truncate text-xs font-normal text-stone-400">
          {message.toEmail}
        </span>
      </div>

      <ol className="flex flex-wrap gap-x-6 gap-y-2">
        {steps.map((step) => {
          const reached = Boolean(step.at);
          const Icon = step.icon;
          return (
            <li key={step.key} className="flex items-center gap-2">
              <span
                className={
                  reached
                    ? 'flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700'
                    : 'flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-stone-300'
                }
              >
                <Icon className="h-3 w-3" />
              </span>
              <span className="text-xs">
                <span className={reached ? 'text-stone-700' : 'text-stone-400'}>
                  {step.label}
                </span>
                {reached && step.count && step.count > 1 && (
                  <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                    {step.count}×
                  </span>
                )}
                {reached && step.at && (
                  <span className="ml-1 text-stone-400">{formatEventTime(step.at)}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {failure && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            {failure.label}
            <span className="ml-1 text-red-400">{formatEventTime(failure.at)}</span>
          </span>
        </div>
      )}
    </div>
  );
}

// Timestamps are stored without a zone (mode:'string'); treat them as UTC and
// render in the viewer's local time.
function formatEventTime(value: string): string {
  const iso = value.endsWith('Z') ? value : `${value.replace(' ', 'T')}Z`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
