import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type * as schema from './schema';
import { emailMessages } from './schema';

type Database = PostgresJsDatabase<typeof schema>;

export type OutboundEmailType = 'proposal_share' | 'invoice_share';

export interface RecordSentEmailInput {
  /** Resend message id returned from resend.emails.send. */
  resendId: string;
  type: OutboundEmailType;
  toEmail: string;
  subject?: string | null;
  organizationId?: string | null;
  proposalId?: string | null;
  invoiceId?: string | null;
}

/**
 * Persists a send-time row for an outbound email so its delivery timeline can be
 * stamped later by Resend webhook events. Idempotent on resendId: a duplicate
 * record (e.g. a retried request) is a no-op rather than an error.
 *
 * Best-effort by design: callers should not let a logging failure block the send,
 * so wrap the call and swallow errors at the call site.
 */
export async function recordSentEmail(db: Database, input: RecordSentEmailInput): Promise<void> {
  const now = new Date().toISOString();
  await db
    .insert(emailMessages)
    .values({
      resendId: input.resendId,
      type: input.type,
      toEmail: input.toEmail,
      subject: input.subject ?? null,
      organizationId: input.organizationId ?? null,
      proposalId: input.proposalId ?? null,
      invoiceId: input.invoiceId ?? null,
      status: 'sent',
      sentAt: now,
      lastEventAt: now,
    })
    .onConflictDoNothing({ target: emailMessages.resendId });
}

// Resend webhook event type -> the timestamp column it stamps.
const EVENT_COLUMN: Record<string, keyof typeof emailMessages.$inferSelect> = {
  'email.sent': 'sentAt',
  'email.delivered': 'deliveredAt',
  'email.delivery_delayed': 'deliveryDelayedAt',
  'email.opened': 'openedAt',
  'email.clicked': 'clickedAt',
  'email.bounced': 'bouncedAt',
  'email.complained': 'complainedAt',
  'email.failed': 'failedAt',
};

// Furthest-along ranking so an out-of-order event can't downgrade the status
// (e.g. a late `sent` after `opened` must not reset status back to sent).
const STATUS_RANK: Record<string, number> = {
  sent: 1,
  delivery_delayed: 2,
  delivered: 3,
  opened: 4,
  clicked: 5,
  bounced: 6,
  failed: 6,
  complained: 7,
};

export interface ApplyResendWebhookEventInput {
  /** Full Resend event type, e.g. "email.opened". */
  type: string;
  /** Resend message id from data.email_id. */
  emailId: string;
  /** ISO timestamp of the event (event.created_at); defaults to now. */
  occurredAt?: string | null;
}

/**
 * Applies a single Resend webhook event to the matching email row.
 *
 * - Each per-event timestamp is set once (COALESCE keeps the first arrival), so
 *   duplicate deliveries are safe.
 * - status only advances to a higher-ranked value, so events arriving out of
 *   order never regress it.
 * Returns whether a row matched (unknown ids, e.g. internal emails we don't log,
 * simply return matched:false).
 */
export async function applyResendWebhookEvent(
  db: Database,
  input: ApplyResendWebhookEventInput,
): Promise<{ matched: boolean }> {
  const columnKey = EVENT_COLUMN[input.type];
  if (!columnKey) return { matched: false };

  const statusKey = input.type.replace('email.', '');
  const rank = STATUS_RANK[statusKey] ?? 0;
  const column = emailMessages[columnKey];
  const isOpen = statusKey === 'opened';
  const isClick = statusKey === 'clicked';

  // Normalize the event timestamp; fall back to now if missing/invalid.
  let ts: string;
  const parsed = input.occurredAt ? new Date(input.occurredAt) : new Date();
  ts = Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();

  const rows = await db
    .update(emailMessages)
    .set({
      [columnKey]: sql`COALESCE(${column}, ${ts})`,
      ...(isOpen ? { openCount: sql`${emailMessages.openCount} + 1` } : {}),
      ...(isClick ? { clickCount: sql`${emailMessages.clickCount} + 1` } : {}),
      status: sql`CASE WHEN ${rank} >= (CASE ${emailMessages.status}
        WHEN 'sent' THEN 1
        WHEN 'delivery_delayed' THEN 2
        WHEN 'delivered' THEN 3
        WHEN 'opened' THEN 4
        WHEN 'clicked' THEN 5
        WHEN 'bounced' THEN 6
        WHEN 'failed' THEN 6
        WHEN 'complained' THEN 7
        ELSE 0 END) THEN ${statusKey} ELSE ${emailMessages.status} END`,
      lastEventAt: sql`GREATEST(COALESCE(${emailMessages.lastEventAt}, ${ts}), ${ts})`,
      updatedAt: sql`CURRENT_TIMESTAMP`,
    })
    .where(eq(emailMessages.resendId, input.emailId))
    .returning({ id: emailMessages.id });

  return { matched: rows.length > 0 };
}
