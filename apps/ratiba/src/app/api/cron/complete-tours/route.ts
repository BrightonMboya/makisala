import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { db } from '@repo/db';
import { sql } from 'drizzle-orm';
import { env } from '@/lib/env';
import { serializeError } from '@/lib/logger';

// This route mutates the database and must never be statically cached.
export const dynamic = 'force-dynamic';

/**
 * Nightly job (Vercel Cron) that auto-completes finished tours.
 *
 * A proposal is considered finished when its tour has fully elapsed:
 *   startDate + <number of itinerary days> < now
 * where the day count comes from the highest `day_number` in proposal_days.
 *
 * Only `booked` proposals are transitioned to `completed`. Draft / shared /
 * awaiting_payment / cancelled are intentionally left untouched, and proposals
 * without a startDate are skipped. The UPDATE is idempotent, so re-running the
 * job (or a Vercel retry) never double-processes a row.
 */
export const GET = withAxiom(async (req: AxiomRequest) => {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Reject anything else,
  // and fail closed if the secret was never configured.
  const authHeader = req.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const updated = await db.execute<{ id: string }>(sql`
      UPDATE proposals AS p
      SET status = 'completed', updated_at = now()
      WHERE p.status = 'booked'
        AND p.start_date IS NOT NULL
        AND p.start_date + (
          COALESCE(
            (SELECT MAX(pd.day_number) FROM proposal_days pd WHERE pd.proposal_id = p.id),
            0
          ) * interval '1 day'
        ) < now()
      RETURNING p.id
    `);

    const rows = Array.from(updated as unknown as Iterable<{ id: string }>);
    req.log.info('cron.complete-tours', { completed: rows.length });

    return NextResponse.json({ success: true, completed: rows.length });
  } catch (error) {
    req.log.error('cron.complete-tours failed', serializeError(error));
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
});
