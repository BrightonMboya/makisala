'use client';

import {
  AlertTriangle,
  Check,
  Clock,
  Eye,
  FileText,
  Loader2,
  Mail,
  MailOpen,
  Monitor,
  MousePointerClick,
  Receipt,
  Send,
  Smartphone,
  Tablet,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { SheetHeader, SheetTitle } from '@repo/ui/sheet';
import { trpc } from '@/lib/trpc';
import type { EmailMessage, LinkView } from '@repo/db/schema';

type IconType = typeof Eye;

// Furthest-reached status per send, matching EmailStatusBadge's semantics -
// email_messages.status is already the furthest stage a webhook confirmed.
const EMAIL_STATUS_CONFIG: Record<string, { label: string; Icon: IconType; className: string }> = {
  sent: { label: 'Sent', Icon: Send, className: 'text-stone-500' },
  delivered: { label: 'Delivered', Icon: Check, className: 'text-blue-600' },
  opened: { label: 'Opened', Icon: MailOpen, className: 'text-green-600' },
  clicked: { label: 'Clicked link', Icon: MousePointerClick, className: 'text-emerald-600' },
  delivery_delayed: { label: 'Delayed', Icon: Clock, className: 'text-amber-600' },
  bounced: { label: 'Bounced', Icon: AlertTriangle, className: 'text-red-600' },
  complained: { label: 'Marked as spam', Icon: AlertTriangle, className: 'text-red-600' },
  failed: { label: 'Failed', Icon: AlertTriangle, className: 'text-red-600' },
};

const PROGRESS_STAGES: Array<{
  key: 'sentAt' | 'deliveredAt' | 'openedAt' | 'clickedAt';
  label: string;
}> = [
  { key: 'sentAt', label: 'Sent' },
  { key: 'deliveredAt', label: 'Delivered' },
  { key: 'openedAt', label: 'Opened' },
  { key: 'clickedAt', label: 'Clicked' },
];

const ERROR_STATUSES = new Set(['bounced', 'complained', 'failed']);

const DEVICE_ICON: Record<string, IconType> = {
  mobile: Smartphone,
  tablet: Tablet,
  desktop: Monitor,
};

function locationLabel(v: { city?: string | null; region?: string | null; country?: string | null }) {
  return [v.city, v.region, v.country].filter(Boolean).join(', ') || null;
}

function SectionHeader({ title, Icon }: { title: string; Icon: IconType }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-border bg-stone-50 px-6 py-2">
      <Icon className="h-3.5 w-3.5 text-[#878787]" />
      <p className="text-[11px] font-semibold tracking-wide text-[#878787] uppercase">{title}</p>
    </div>
  );
}

// The at-a-glance answer ("did they open it?") is what an operator scans
// for first, so it gets color + a status dot; the per-visit list underneath
// is detail for when that answer is "yes" and they want to know more.
function ViewSection({ title, Icon, views }: { title: string; Icon: IconType; views: LinkView[] }) {
  const viewCount = views.length;
  const lastView = views[0];
  const opened = viewCount > 0;

  return (
    <div>
      <SectionHeader title={title} Icon={Icon} />
      <div className="px-6 py-3">
        <div
          className={`flex items-center gap-2 text-sm font-semibold ${opened ? 'text-green-700' : 'text-stone-400'}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${opened ? 'bg-green-600' : 'bg-stone-300'}`} />
          {opened ? `Opened ${viewCount} time${viewCount === 1 ? '' : 's'}` : `${title} not opened`}
        </div>
        {lastView ? (
          <p className="mt-1 pl-3.5 text-xs text-[#878787]">
            Last opened {formatDistanceToNow(new Date(lastView.createdAt), { addSuffix: true })}
            {locationLabel(lastView) ? ` from ${locationLabel(lastView)}` : ''}
            {lastView.device ? ` on ${lastView.device}` : ''}
          </p>
        ) : null}
      </div>

      {views.length > 0 ? (
        <ul className="divide-y divide-border border-t border-border">
          {views.map((v) => {
            const VisitIcon = v.device ? (DEVICE_ICON[v.device] ?? Eye) : Eye;
            const detail = [locationLabel(v), v.device, v.browser].filter(Boolean).join(' · ');
            return (
              <li key={v.id} className="flex items-start gap-3 px-6 py-2">
                <VisitIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-stone-600">
                    {v.format === 'pdf' ? 'Downloaded PDF' : 'Opened link'}
                  </p>
                  {detail ? <p className="truncate text-[11px] text-[#878787]">{detail}</p> : null}
                </div>
                <span
                  className="shrink-0 text-[10px] text-[#878787]"
                  title={format(new Date(v.createdAt), 'PPpp')}
                >
                  {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// One row per email send (furthest stage reached), not one row per lifecycle
// event - a send that went sent -> delivered -> opened -> clicked used to
// take 4 rows saying almost the same thing. The progress trail underneath
// keeps that history visible without the repetition.
function EmailActivitySection({ emails }: { emails: EmailMessage[] }) {
  const sorted = [...emails].sort((a, b) => {
    const bAt = new Date(b.lastEventAt ?? b.sentAt ?? b.createdAt).getTime();
    const aAt = new Date(a.lastEventAt ?? a.sentAt ?? a.createdAt).getTime();
    return bAt - aAt;
  });

  return (
    <div>
      <SectionHeader title="Email Activity" Icon={Mail} />
      {sorted.length === 0 ? (
        <div className="px-6 py-6 text-center text-xs text-[#878787]">No emails sent yet.</div>
      ) : (
        <ul className="divide-y divide-border">
          {sorted.map((m) => {
            const cfg = EMAIL_STATUS_CONFIG[m.status] ?? {
              label: m.status,
              Icon: Mail,
              className: 'text-stone-500',
            };
            const at = m.lastEventAt ?? m.sentAt ?? m.createdAt;
            const showTrail = at != null && !ERROR_STATUSES.has(m.status);
            return (
              <li key={m.id} className="px-6 py-3">
                <div className="flex items-start gap-3">
                  <cfg.Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${cfg.className}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">{cfg.label}</p>
                    <p className="truncate text-[11px] text-[#878787]">to {m.toEmail}</p>
                  </div>
                  {at ? (
                    <span
                      className="shrink-0 text-[10px] text-[#878787]"
                      title={format(new Date(at), 'PPpp')}
                    >
                      {formatDistanceToNow(new Date(at), { addSuffix: true })}
                    </span>
                  ) : null}
                </div>
                {showTrail ? (
                  <div className="mt-2 flex items-center gap-1 pl-[26px]">
                    {PROGRESS_STAGES.map((stage, i) => {
                      const reached = !!m[stage.key];
                      return (
                        <span key={stage.key} className="flex items-center gap-1">
                          {i > 0 ? (
                            <span className={`h-px w-2.5 ${reached ? 'bg-green-300' : 'bg-stone-200'}`} />
                          ) : null}
                          <span
                            className={`text-[10px] ${reached ? 'font-medium text-green-700' : 'text-stone-300'}`}
                          >
                            {stage.label}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ActivityBody({ kind, id }: { kind: 'proposal' | 'invoice'; id: string }) {
  const proposalViewsQuery = trpc.views.forProposal.useQuery(
    { proposalId: id },
    { enabled: kind === 'proposal' },
  );
  const proposalEmailsQuery = trpc.emails.forProposal.useQuery(
    { proposalId: id },
    { enabled: kind === 'proposal' },
  );
  // A proposal may have a spun-off invoice; surface its activity as its own
  // cluster too rather than making the operator open a second sheet for it.
  const linkedInvoicesQuery = trpc.invoices.listForProposal.useQuery(
    { proposalId: id },
    { enabled: kind === 'proposal' },
  );

  const invoiceId = kind === 'invoice' ? id : (linkedInvoicesQuery.data?.[0]?.id ?? null);

  const invoiceViewsQuery = trpc.views.forInvoice.useQuery(
    { invoiceId: invoiceId ?? '' },
    { enabled: !!invoiceId },
  );
  const invoiceEmailsQuery = trpc.emails.forInvoice.useQuery(
    { invoiceId: invoiceId ?? '' },
    { enabled: !!invoiceId },
  );

  const isLoading =
    (kind === 'proposal' &&
      (proposalViewsQuery.isLoading || proposalEmailsQuery.isLoading || linkedInvoicesQuery.isLoading)) ||
    (!!invoiceId && (invoiceViewsQuery.isLoading || invoiceEmailsQuery.isLoading));

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-[#878787]" />
      </div>
    );
  }

  const allEmails = [...(proposalEmailsQuery.data ?? []), ...(invoiceId ? (invoiceEmailsQuery.data ?? []) : [])];

  return (
    <>
      <SheetHeader className="border-b border-border px-6 py-4">
        <SheetTitle className="font-serif text-base">Activity</SheetTitle>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        {kind === 'proposal' ? (
          <ViewSection title="Digital Proposal" Icon={FileText} views={proposalViewsQuery.data ?? []} />
        ) : null}
        {invoiceId ? (
          <ViewSection title="Invoice" Icon={Receipt} views={invoiceViewsQuery.data ?? []} />
        ) : null}
        <EmailActivitySection emails={allEmails} />
      </div>
    </>
  );
}
