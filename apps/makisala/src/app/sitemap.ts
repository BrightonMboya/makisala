import type { MetadataRoute } from 'next'
import { BASE_URL } from '../lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: BASE_URL,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/blog`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/who-is-travelling/family-safari`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/who-is-travelling/couples-and-honemooners`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date('2025-09-05'),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        // place additional dynamic sitemaps here
        {
            url: `${BASE_URL}/to_book/sitemap.xml`,
            lastModified: new Date('2025-09-05'),
        },
        {
            url: `${BASE_URL}/blog/sitemap.xml`,
            lastModified: new Date(),
        },
        {
            url: `${BASE_URL}/location/sitemap.xml`,
            lastModified: new Date('2025-09-05'),
        },
        {
            url: `${BASE_URL}/where-to-go/sitemap.xml`,
            lastModified: new Date(),
        },
    ]
}
