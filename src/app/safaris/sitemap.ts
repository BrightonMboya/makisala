import { countries } from '@/lib/p_seo_info'
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/constants'

const subpages = ['best-time-to-go', 'travel-advice', 'where-to-go', 'why-go']

export default function sitemap(): MetadataRoute.Sitemap {
    const urls: MetadataRoute.Sitemap = []

    countries.forEach((country) => {
        // Add main country page
        urls.push({
            url: `${BASE_URL}/safaris/${country}`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        })

        // Add subpages
        subpages.forEach((page) => {
            urls.push({
                url: `${BASE_URL}/safaris/${country}/${page}`,
                lastModified: new Date(),
                changeFrequency: 'weekly',
                priority: 0.8,
            })
        })
    })

    return urls
}
