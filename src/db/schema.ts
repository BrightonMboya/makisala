import {
    pgTable,
    text,
    pgEnum,
    timestamp,
    uuid,
    varchar,
    integer,
    boolean,
    json,
    numeric
} from "drizzle-orm/pg-core";
import {sql} from "drizzle-orm"
import {relations} from 'drizzle-orm';
import {FAQItem} from "@/components/faq";

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
    faqs: json("faqs").$type<FAQItem[]>(),
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
    fullName: text().notNull(),
    countryOfResidence: varchar('country_of_residence', {length: 255}).notNull(),
    phoneNumber: varchar('phone_number', {length: 255}).notNull(),
    email: varchar('email', {length: 255}).notNull(),
    numberOfNights: varchar('number_of_nights', {length: 255}).notNull(),
    numberOfAdults: varchar('number_of_adults', {length: 255}).notNull(),
    numberOfChildren: varchar('number_of_children', {length: 255}).notNull(),
    flightAssistance: FlightAssistance().default("no"),
    experienceType: ExperienceType().default("mid-range"),
    comments: text(),
    consent: boolean(),
    url: text()
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

// the following tables are for p_seo, some tables looks duplicated
// reason is i want to rollback this feature if it doesnt provide values

// ---------- TOURS ----------
export const tours = pgTable("tours", {
    id: uuid("id").defaultRandom().primaryKey(),
    tourName: text("tour_name").notNull(),                      // data.tour_name
    overview: text("overview"),                                 // data.overview
    pricing: numeric("pricing", {precision: 12, scale: 2}),   // data.pricing
    country: text("country"),                                   // if you scrape it
    sourceUrl: text("source_url"),                              // optional: where you scraped from
    activities: json("activities"),                             // [{title: "...", activity_name: "..."}]
    topFeatures: json("top_features"),                          // [{title: "...", description: "..."}]
    img_url: text("img_url"),
    number_of_days: integer("number_of_days"),
    tags: text("tags").array(),  // eg ['family', 'group', 'luxury']
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).defaultNow(),
});

export const toursRelations = relations(tours, ({many}) => ({
    days: many(itineraryDays),
}));

// ---------- ITINERARY DAYS ----------
export const itineraryDays = pgTable("itinerary_days", {
    id: uuid("id").defaultRandom().primaryKey(),
    tourId: uuid("tour_id").notNull().references(() => tours.id, {onDelete: "cascade"}),
    dayNumber: integer("day_number").notNull(),                 // day.day_number
    dayTitle: text("itinerary_day_title"),                      // day.itinerary_day_title
    overview: text("overview"),                                 // day.overview
});

export const itineraryDaysRelations = relations(itineraryDays, ({one, many}) => ({
    tour: one(tours, {fields: [itineraryDays.tourId], references: [tours.id]}),
    itineraryAccommodations: many(itineraryAccommodations),
}));

// ---------- DEDUPED ACCOMMODATIONS (MASTER) ----------
export const accommodations = pgTable("accommodations", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    url: text("url"),                                           // e.g. https://www.melia.com/...
    overview: text("overview"),                                 // scraped accommodation overview
});

export const accommodationsRelations = relations(accommodations, ({many}) => ({
    images: many(accommodationImages),
    itineraryAccommodations: many(itineraryAccommodations),
}));

// ---------- ACCOMMODATION IMAGES (per master accommodation) ----------
export const accommodationImages = pgTable("accommodation_images", {
    id: uuid("id").defaultRandom().primaryKey(),
    accommodationId: uuid("accommodation_id").notNull().references(() => accommodations.id, {onDelete: "cascade"}),
    imageUrl: text("image_url").notNull(),                      // img.image_url
});

export const accommodationImagesRelations = relations(accommodationImages, ({one}) => ({
    accommodation: one(accommodations, {
        fields: [accommodationImages.accommodationId],
        references: [accommodations.id]
    }),
}));

// ---------- JOIN: WHICH ACCOMMODATION IS USED ON WHICH DAY ----------
export const itineraryAccommodations = pgTable("itinerary_accommodations", {
    id: uuid("id").defaultRandom().primaryKey(),
    itineraryDayId: uuid("itinerary_day_id").notNull().references(() => itineraryDays.id, {onDelete: "cascade"}),
    accommodationId: uuid("accommodation_id").notNull().references(() => accommodations.id, {onDelete: "cascade"}),
});

export const itineraryAccommodationsRelations = relations(itineraryAccommodations, ({one}) => ({
    day: one(itineraryDays, {fields: [itineraryAccommodations.itineraryDayId], references: [itineraryDays.id]}),
    accommodation: one(accommodations, {
        fields: [itineraryAccommodations.accommodationId],
        references: [accommodations.id]
    }),
}));

// these are the modifiers used for the pseo pages
export const modifiers = pgTable("modifiers", {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text().notNull(), // category: comfort, type, accommodation, other
    value: text().notNull(), //-- e.g. "luxury", "family", "camping"
    description: text().notNull(), // -- SEO text
})

export const destinations = pgTable("destinations", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text().notNull(),
    overall_page_url: text().notNull(),
    best_time_to_visit: text().notNull(),
    travel_advice: text().notNull(),
    destination_costs: text(),
    where_to_go: text()
})

interface WildlifeHighlights {
    name: string;
    abundance: 'Abundant' | 'common' | 'occasional' | 'rare'
}

interface JsonOverview {
    name: string;
    description: string;
}

export const nationalParks = pgTable("national_parks", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text().notNull(),
    country: text().notNull(),
    overview_page_id: text().references(() => pages.id),
    wildlife_page_id: text().references(() => pages.id),
    best_time_to_visit_id: text().references(() => pages.id),
    // birds_page_id: text().references(() => pages.id),
    weather_page_id: text().references(() => pages.id),
    malaria_safety_page_id: text().references(() => pages.id),
    how_to_get_there_page_id: text().references(() => pages.id),
    wildlife_highlights: json('wildlife_highlights').$type<WildlifeHighlights[]>(),
    park_overview: json('park_overview').$type<JsonOverview[]>(),
    createdAt: timestamp({precision: 3, mode: "string"})
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp({precision: 3, mode: "string"}).notNull(),
});

export const wildlife = pgTable("wildlife", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text().notNull(),
    excerpt: text().notNull(),
    description: text().notNull(),
    quick_facts: json('quick_facts').$type<{ fact: string; label: string; }[]>(),
    where_to_see_description: text().notNull(),
    where_to_see_title: text()
})

export const wildlifeParkOverrides = pgTable("wildlife_park_overrides", {
    id: uuid("id").defaultRandom().primaryKey(),
    wildlife_id: uuid()
        .notNull()
        .references(() => wildlife.id),
    national_park_id: uuid()
        .notNull()
        .references(() => nationalParks.id),
    where_to_see_title: text().notNull(),
    where_to_see_description: text().notNull(),
    meta_title: text(),    // SEO title
    meta_description: text(), // SEO description
    faqs: json('faqs').$type<FAQItem[]>(), // optional FAQ schema
    createdAt: timestamp("created_at", {precision: 3, mode: "string"})
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
    updatedAt: timestamp("updated_at", {precision: 3, mode: "string"})
        .default(sql`CURRENT_TIMESTAMP`)
        .notNull(),
});


export type TourPackage = typeof tourPackages.$inferSelect;
export type NewTourPackage = typeof tourPackages.$inferInsert;
export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;
export type NewInquiries = typeof inquiries.$inferInsert;
export type Inquiries = typeof inquiries.$inferSelect;