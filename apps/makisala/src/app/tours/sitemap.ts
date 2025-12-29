import type { MetadataRoute } from 'next'
import { AllToursSlugs } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const urls: MetadataRoute.Sitemap = []
    const tourSlugs = await AllToursSlugs()

    for (const slug of tourSlugs) {
        urls.push({
            url: `${BASE_URL}/tours/${slug.slug}`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'weekly',
            priority: 0.9,
        })
    }
    return urls
}
