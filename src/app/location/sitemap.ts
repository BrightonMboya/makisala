import type { MetadataRoute } from 'next'
import { db, pages } from '@/db'
import { eq } from 'drizzle-orm'

export default async function generateSitemaps({
    id,
}: {
    id: number
}): Promise<MetadataRoute.Sitemap> {
    // Google's limit is 50,000 URLs per sitemap
    const pages_slugs = await db
        .select({ slug: pages.slug, updatedAt: pages.updatedAt })
        .from(pages)
        .where(eq(pages.page_type, 'page'))

    return pages_slugs.map(pages => ({
        url: `https://makisala.com/location/${pages.slug}`,
        lastModified: new Date(pages.updatedAt).toISOString(),
    }))
}
