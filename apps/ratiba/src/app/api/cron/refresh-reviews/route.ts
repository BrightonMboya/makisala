import { NextResponse } from 'next/server';
import { withAxiom, type AxiomRequest } from 'next-axiom';
import { db } from '@repo/db';
import { organizations, type ReviewLink } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';
import { getPlaceDetails, PlacesNotConfiguredError } from '@/lib/places';
import { serializeError } from '@/lib/logger';

// This route mutates the database and calls an external API; never cache it.
export const dynamic = 'force-dynamic';
// Allow headroom for sequential Places lookups across many orgs.
export const maxDuration = 60;

/**
 * Weekly job (Vercel Cron) that refreshes Google-connected review badges.
 *
 * For every organization with a Google-sourced review link that carries a
 * place_id, we re-fetch the current rating + total review count from the Places
 * API and write them back. Manual badges (SafariBookings / Tripadvisor) and rows
 * without a place_id are left untouched.
 *
 * Google's terms allow storing the place_id indefinitely but expect rating/count
 * to be refreshed rather than frozen — this job is that refresh. A listing that
 * can no longer be found keeps its last known value (we don't drop the badge).
 * Calls are sequential to keep well under the Places free tier and avoid bursts.
 */
export const GET = withAxiom(async (req: AxiomRequest) => {
  const authHeader = req.headers.get('authorization');
  if (!env.CRON_SECRET || authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!env.GOOGLE_MAPS_API_KEY) {
    // No key configured — nothing to refresh, but this isn't an error.
    return NextResponse.json({ success: true, skipped: 'places-not-configured' });
  }

  try {
    const orgs = await db
      .select({ id: organizations.id, reviewLinks: organizations.reviewLinks })
      .from(organizations);

    let orgsUpdated = 0;
    let badgesRefreshed = 0;

    for (const org of orgs) {
      const links = org.reviewLinks;
      if (!links || links.length === 0) continue;

      const googleLinks = links.filter((l) => l.source === 'google' && l.placeId);
      if (googleLinks.length === 0) continue;

      let changed = false;
      const next: ReviewLink[] = [];

      for (const link of links) {
        if (link.source !== 'google' || !link.placeId) {
          next.push(link);
          continue;
        }
        try {
          const place = await getPlaceDetails(link.placeId);
          if (place) {
            badgesRefreshed++;
            const rating = place.rating ?? link.rating;
            const reviewCount = place.reviewCount ?? link.reviewCount;
            if (rating !== link.rating || reviewCount !== link.reviewCount) changed = true;
            next.push({ ...link, rating, reviewCount });
          } else {
            // Listing not found: keep the last known values rather than blanking.
            next.push(link);
          }
        } catch (error) {
          if (error instanceof PlacesNotConfiguredError) throw error;
          // One org's failure shouldn't abort the whole run; keep the old value.
          req.log.warn('cron.refresh-reviews place failed', {
            orgId: org.id,
            placeId: link.placeId,
            ...serializeError(error),
          });
          next.push(link);
        }
      }

      if (changed) {
        await db
          .update(organizations)
          .set({ reviewLinks: next, updatedAt: new Date() })
          .where(eq(organizations.id, org.id));
        orgsUpdated++;
      }
    }

    req.log.info('cron.refresh-reviews', { orgsUpdated, badgesRefreshed });
    return NextResponse.json({ success: true, orgsUpdated, badgesRefreshed });
  } catch (error) {
    req.log.error('cron.refresh-reviews failed', serializeError(error));
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
});
