import type { MetadataRoute } from 'next'

import { getAccommodationSlugs } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'

export const revalidate = 3600
export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const rows = await getAccommodationSlugs()

    const entries: MetadataRoute.Sitemap = [
        {
            url: `${BASE_URL}/accommodations`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.6,
        },
    ]

    for (const r of rows) {
        if (!r.slug) continue
        entries.push({
            url: `${BASE_URL}/accommodations/${r.slug}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        })
    }

    return entries
}
