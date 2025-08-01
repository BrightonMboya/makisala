import type {MetadataRoute} from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://makisala.com',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 1,
        },
        {
            url: 'https://makisala.com/about',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://makisala.com/blog',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: 'https://makisala.com/who-is-travelling/family-safari',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: 'https://makisala.com/who-is-travelling/couples-and-honemooners',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        {
            url: 'https://makisala.com/contact',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.5,
        },
        // place additional dynamic sitemaps here
        {
            url: "https://makisala.com/to_book/sitemap.xml",
            lastModified: new Date(),
        },
        {
            url: "https://makisala.com/blog/sitemap.xml",
            lastModified: new Date(),
        },
        {
            url: "https://makisala.com/location/sitemap.xml",
            lastModified: new Date(),
        }
    ]
}