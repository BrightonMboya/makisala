import { pgTable, text, pgEnum, timestamp } from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm"


export const PageType = pgEnum("pageType", [
    'page',
    'blog'
])

export const PageStatus = pgEnum("pageStatus", [
    "published",
    "draft",
])
export const pages =pgTable("pages", {
    id: text().primaryKey().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    content: text().notNull(),
    excerpt: text(),
    featured_image_url: text(),
    meta_title: text(),
    meta_description: text(),
    meta_keywords: text(),
    page_type: PageType().default("page"),
    status: PageStatus().default("published"),
    createdAt: timestamp({ precision: 3, mode: "string" })
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp({ precision: 3, mode: "string" }).notNull(),
})