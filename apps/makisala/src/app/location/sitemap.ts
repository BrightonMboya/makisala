import type { MetadataRoute } from 'next'
import { db, pages } from '@repo/db'
import { and, eq } from 'drizzle-orm'
import { BASE_URL } from '@/lib/constants'

export default async function generateSitemaps(): Promise<MetadataRoute.Sitemap> {
    // Google's limit is 50,000 URLs per sitemap
    const pages_slugs = await db
        .select({ slug: pages.slug, updatedAt: pages.updatedAt })
        .from(pages)
        .where(and(eq(pages.app, 'makisala'), eq(pages.page_type, 'page')))

    return pages_slugs.map((pages) => ({
        url: `${BASE_URL}/location/${pages.slug}`,
        lastModified: new Date(pages.updatedAt).toISOString(),
    }))
}
