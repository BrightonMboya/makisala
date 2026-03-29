import { fetchAllNps } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const parks = await fetchAllNps()

    return parks.map((park) => ({
        url: `${BASE_URL}/national-parks/${park.name}`,
        changeFrequency: 'weekly',
        priority: 0.9,
    }))
}
