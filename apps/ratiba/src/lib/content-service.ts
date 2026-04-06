'use server'

import { db } from '@repo/db'
import { pages } from '@repo/db/schema'
import { and, desc, eq } from 'drizzle-orm'

export type Page = typeof pages.$inferSelect

export async function getPageBySlug(slug: string) {
  return db.query.pages.findFirst({
    where: and(eq(pages.slug, slug), eq(pages.app, 'ratiba'), eq(pages.status, 'published')),
  })
}

export async function getPagesByType(pageType: 'page' | 'blog') {
  return db
    .select()
    .from(pages)
    .where(and(eq(pages.app, 'ratiba'), eq(pages.page_type, pageType), eq(pages.status, 'published')))
    .orderBy(desc(pages.createdAt))
}

export async function getAllSlugs(pageType: 'page' | 'blog') {
  return db
    .select({ slug: pages.slug })
    .from(pages)
    .where(and(eq(pages.app, 'ratiba'), eq(pages.page_type, pageType), eq(pages.status, 'published')))
}
