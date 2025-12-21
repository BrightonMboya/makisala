import type { MetadataRoute } from 'next'
import { db, tourPackages } from '@/db'
import { BASE_URL } from '@/lib/constants'

export default async function generateSitemaps({
    id,
}: {
    id: number
}): Promise<MetadataRoute.Sitemap> {
    // Google's limit is 50,000 URLs per sitemap
    const tours_slugs = await db
        .select({ slug: tourPackages.slug, updatedAt: tourPackages.updatedAt })
        .from(tourPackages)

    return tours_slugs.map(tour => ({
        url: `${BASE_URL}/to_book/${tour.slug}`,
        lastModified: new Date('2025-09-27').toISOString(),
        // lastModified: new Date(tour.updatedAt).toISOString()
    }))
}
