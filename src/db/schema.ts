import {pgTable, text, pgEnum, timestamp, uuid, varchar, integer, boolean} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm"
import {relations} from 'drizzle-orm';

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
    createdAt: timestamp({precision: 3, mode: "string"})
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp({precision: 3, mode: "string"}).notNull(),
})

export const FlightAssistance = pgEnum("flightAssistance", ["yes", "no"])
export const ExperienceType = pgEnum("experienceType", ["mid-range", "high-end", "top-end"])

export const inquiries = pgTable("inquiries", {
    id: uuid('id').primaryKey().defaultRandom(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    countryOfResidence: varchar('country_of_residence', {length: 255}).notNull(),
    phoneNumber: varchar('phone_number', {length: 255}).notNull(),
    email: varchar('email', {length: 255}).notNull(),
    numberOfNights: varchar('number_of_nights', {length: 255}).notNull(),
    numberOfAdults: varchar('number_of_adults', {length: 255}).notNull(),
    numberOfChildren: varchar('number_of_children', {length: 255}).notNull(),
    flightAssistance: FlightAssistance().default("no"),
    experienceType: ExperienceType().default("mid-range"),
    comments: text(),
    contactMethod: text(),
    consent: boolean()
})

export const tourPackages = pgTable('tour_packages', {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', {length: 255}).notNull(),
    numberOfDays: integer('number_of_days').notNull(),
    slug: text('slug'),
    country: varchar('country', {length: 100}).notNull(),
    destination: varchar('destination', {length: 255}).notNull(),
    overview: text('overview').notNull(),
    hero_image_url: text().notNull(),
    pricing_starts_from: varchar('pricing_starts_from', {length: 50}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itineraries = pgTable('itineraries', {
    id: uuid('id').primaryKey().defaultRandom(),
    tourPackageId: uuid('tour_package_id').references(() => tourPackages.id, {onDelete: 'cascade'}).notNull(),
    dayNumber: integer('day_number').notNull(),
    title: varchar('title', {length: 255}).notNull(),
    estimatedDrivingDistance: text('estimated_driving_distance'),
    activities: text('activities').notNull(),
    accommodation: text('accommodation'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const tourPackagesRelations = relations(tourPackages, ({many}) => ({
    itineraries: many(itineraries),
}));

export const itinerariesRelations = relations(itineraries, ({one}) => ({
    tourPackage: one(tourPackages, {
        fields: [itineraries.tourPackageId],
        references: [tourPackages.id],
    }),
}));

// Better auth schemas
export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, {onDelete: "cascade"}),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
});

export type TourPackage = typeof tourPackages.$inferSelect;
export type NewTourPackage = typeof tourPackages.$inferInsert;
export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;
export type NewInquiries = typeof inquiries.$inferInsert;
export type Inquiries = typeof inquiries.$inferSelect;