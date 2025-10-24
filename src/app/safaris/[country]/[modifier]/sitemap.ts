import { countries, modifiers } from '@/lib/p_seo_info'
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/constants'

// Generate all country-modifier combinations for sitemap
const safariUrls = countries.flatMap(country =>
    modifiers.map(modifier => `${BASE_URL}/safaris/${country}/${modifier}`)
)

export default function sitemap(): MetadataRoute.Sitemap {
    const today = new Date('2025-10-17')

    return safariUrls.map(url => ({
        url,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.9,
    }))
}
