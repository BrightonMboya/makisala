import {
  AlertTriangle,
  Check,
  Clock,
  Mail,
  MailOpen,
  MousePointerClick,
  Send,
} from 'lucide-react';

/**
 * Compact, single-line version of the share page's delivery timeline
 * (see EmailDeliveryStatus): just the furthest stage the latest send for a
 * proposal reached. `null` means nothing has been sent yet.
 *
 * Statuses come from email_messages.status ('sent' | 'delivered' | 'opened' |
 * 'clicked' | 'bounced' | 'complained' | 'failed' | 'delivery_delayed').
 */
export function EmailStatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex items-center gap-1 text-stone-400">
        <Mail className="h-3.5 w-3.5" />
        Not sent
      </span>
    );
  }

  const config: Record<string, { label: string; className: string; Icon: typeof Mail }> = {
    sent: { label: 'Sent', className: 'text-stone-500', Icon: Send },
    delivered: { label: 'Delivered', className: 'text-blue-600', Icon: Check },
    opened: { label: 'Opened', className: 'text-green-600', Icon: MailOpen },
    clicked: { label: 'Clicked link', className: 'text-emerald-600', Icon: MousePointerClick },
    delivery_delayed: { label: 'Delayed', className: 'text-amber-600', Icon: Clock },
    bounced: { label: 'Bounced', className: 'text-red-600', Icon: AlertTriangle },
    complained: { label: 'Marked spam', className: 'text-red-600', Icon: AlertTriangle },
    failed: { label: 'Failed', className: 'text-red-600', Icon: AlertTriangle },
  };
  const cfg = config[status] ?? { label: status, className: 'text-stone-500', Icon: Mail };
  const { label, className, Icon } = cfg;

  return (
    <span className={`inline-flex items-center gap-1 font-medium ${className}`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
