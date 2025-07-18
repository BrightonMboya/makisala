import { pgTable, text, pgEnum, timestamp, uuid, varchar, integer, } from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm"
import { relations } from 'drizzle-orm';

export const PageType = pgEnum("pageType", [
    'page',
    'blog'
])

export const PageStatus = pgEnum("pageStatus", [
    "published",
    "draft",
])
export const pages = pgTable("pages", {
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

export const tourPackages = pgTable('tour_packages', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 255 }).notNull(),
    numberOfDays: integer('number_of_days').notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    destination: varchar('destination', { length: 255 }).notNull(),
    overview: text('overview').notNull(),
    hero_image_url: text().notNull(),
    pricing_starts_from: varchar('pricing_starts_from', {length: 50}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itineraries = pgTable('itineraries', {
    id: uuid('id').primaryKey().defaultRandom(),
    tourPackageId: uuid('tour_package_id').references(() => tourPackages.id, { onDelete: 'cascade' }).notNull(),
    dayNumber: integer('day_number').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    estimatedDrivingDistance: varchar('estimated_driving_distance', { length: 50 }),
    activities: text('activities').notNull(),
    accommodation: varchar('accommodation', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const tourPackagesRelations = relations(tourPackages, ({ many }) => ({
    itineraries: many(itineraries),
}));

export const itinerariesRelations = relations(itineraries, ({ one }) => ({
    tourPackage: one(tourPackages, {
        fields: [itineraries.tourPackageId],
        references: [tourPackages.id],
    }),
}));

export type TourPackage = typeof tourPackages.$inferSelect;
export type NewTourPackage = typeof tourPackages.$inferInsert;
export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;