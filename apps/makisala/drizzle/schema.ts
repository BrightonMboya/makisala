import { pgTable, text, timestamp, json, foreignKey, uuid, unique, integer, varchar, boolean, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const experienceType = pgEnum("experienceType", ['mid-range', 'high-end', 'top-end'])
export const flightAssistance = pgEnum("flightAssistance", ['yes', 'no'])
export const pageStatus = pgEnum("pageStatus", ['published', 'draft'])
export const pageType = pgEnum("pageType", ['page', 'blog'])


export const pages = pgTable("pages", {
	id: text().primaryKey().notNull(),
	title: text().notNull(),
	slug: text().notNull(),
	content: text().notNull(),
	excerpt: text(),
	featuredImageUrl: text("featured_image_url"),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	metaKeywords: text("meta_keywords"),
	pageType: pageType("page_type").default('page'),
	status: pageStatus().default('published'),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	faqs: json(),
});

export const wildlifeParkOverrides = pgTable("wildlife_park_overrides", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	wildlifeId: uuid("wildlife_id").notNull(),
	nationalParkId: uuid("national_park_id").notNull(),
	whereToSeeTitle: text("where_to_see_title").notNull(),
	whereToSeeDescription: text("where_to_see_description").notNull(),
	createdAt: timestamp("created_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	metaTitle: text("meta_title"),
	metaDescription: text("meta_description"),
	faqs: json(),
}, (table) => [
	foreignKey({
			columns: [table.nationalParkId],
			foreignColumns: [nationalParks.id],
			name: "wildlife_park_overrides_national_park_id_national_parks_id_fk"
		}),
	foreignKey({
			columns: [table.wildlifeId],
			foreignColumns: [wildlife.id],
			name: "wildlife_park_overrides_wildlife_id_wildlife_id_fk"
		}),
]);

export const destinations = pgTable("destinations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	overallPageUrl: text("overall_page_url").notNull(),
	bestTimeToVisit: text("best_time_to_visit").notNull(),
	travelAdvice: text("travel_advice").notNull(),
	destinationCosts: text("destination_costs"),
	whereToGo: text("where_to_go"),
});

export const session = pgTable("session", {
	id: text().primaryKey().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	token: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "session_user_id_user_id_fk"
		}).onDelete("cascade"),
	unique("session_token_unique").on(table.token),
]);

export const itineraries = pgTable("itineraries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tourPackageId: uuid("tour_package_id").notNull(),
	dayNumber: integer("day_number").notNull(),
	title: varchar({ length: 255 }).notNull(),
	estimatedDrivingDistance: text("estimated_driving_distance"),
	activities: text().notNull(),
	accommodation: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.tourPackageId],
			foreignColumns: [tourPackages.id],
			name: "itineraries_tour_package_id_tour_packages_id_fk"
		}).onDelete("cascade"),
]);

export const tourPackages = pgTable("tour_packages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	numberOfDays: integer("number_of_days").notNull(),
	country: varchar({ length: 100 }).notNull(),
	destination: varchar({ length: 255 }).notNull(),
	overview: text().notNull(),
	heroImageUrl: text("hero_image_url").notNull(),
	pricingStartsFrom: varchar("pricing_starts_from", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
	slug: text(),
});

export const verification = pgTable("verification", {
	id: text().primaryKey().notNull(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
});

export const wildlife = pgTable("wildlife", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	excerpt: text().notNull(),
	description: text().notNull(),
	quickFacts: json("quick_facts"),
	whereToSeeDescription: text("where_to_see_description").notNull(),
	whereToSeeTitle: text("where_to_see_title"),
});

export const user = pgTable("user", {
	id: text().primaryKey().notNull(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: boolean("email_verified").notNull(),
	image: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	unique("user_email_unique").on(table.email),
]);

export const account = pgTable("account", {
	id: text().primaryKey().notNull(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull(),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at", { mode: 'string' }),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { mode: 'string' }),
	scope: text(),
	password: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "account_user_id_user_id_fk"
		}).onDelete("cascade"),
]);

export const inquiries = pgTable("inquiries", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	countryOfResidence: varchar("country_of_residence", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	numberOfNights: varchar("number_of_nights", { length: 255 }).notNull(),
	numberOfAdults: varchar("number_of_adults", { length: 255 }).notNull(),
	numberOfChildren: varchar("number_of_children", { length: 255 }).notNull(),
	flightAssistance: flightAssistance().default('no'),
	experienceType: experienceType().default('mid-range'),
	comments: text(),
	consent: boolean(),
	url: text(),
	fullName: text().notNull(),
});

export const nationalParks = pgTable("national_parks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	country: text().notNull(),
	overviewPageId: text("overview_page_id"),
	wildlifePageId: text("wildlife_page_id"),
	weatherPageId: text("weather_page_id"),
	malariaSafetyPageId: text("malaria_safety_page_id"),
	howToGetTherePageId: text("how_to_get_there_page_id"),
	wildlifeHighlights: json("wildlife_highlights"),
	parkOverview: json("park_overview"),
	createdAt: timestamp({ precision: 3, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
	bestTimeToVisitId: text("best_time_to_visit_id"),
	destinationId: uuid("destination_id"),
}, (table) => [
	foreignKey({
			columns: [table.bestTimeToVisitId],
			foreignColumns: [pages.id],
			name: "national_parks_best_time_to_visit_id_pages_id_fk"
		}),
	foreignKey({
			columns: [table.destinationId],
			foreignColumns: [destinations.id],
			name: "national_parks_destination_id_destinations_id_fk"
		}),
	foreignKey({
			columns: [table.howToGetTherePageId],
			foreignColumns: [pages.id],
			name: "national_parks_how_to_get_there_page_id_pages_id_fk"
		}),
	foreignKey({
			columns: [table.malariaSafetyPageId],
			foreignColumns: [pages.id],
			name: "national_parks_malaria_safety_page_id_pages_id_fk"
		}),
	foreignKey({
			columns: [table.overviewPageId],
			foreignColumns: [pages.id],
			name: "national_parks_overview_page_id_pages_id_fk"
		}),
	foreignKey({
			columns: [table.weatherPageId],
			foreignColumns: [pages.id],
			name: "national_parks_weather_page_id_pages_id_fk"
		}),
	foreignKey({
			columns: [table.wildlifePageId],
			foreignColumns: [pages.id],
			name: "national_parks_wildlife_page_id_pages_id_fk"
		}),
]);

export const tours = pgTable("tours", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tourName: text("tour_name").notNull(),
	overview: text().notNull(),
	pricing: numeric({ precision: 12, scale:  2 }).notNull(),
	country: text().notNull(),
	sourceUrl: text("source_url").notNull(),
	activities: json().notNull(),
	topFeatures: json("top_features").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	imgUrl: text("img_url").notNull(),
	numberOfDays: integer("number_of_days").notNull(),
	tags: text().array().notNull(),
	slug: text(),
}, (table) => [
	unique("tours_tour_name_unique").on(table.tourName),
	unique("tours_slug_unique").on(table.slug),
]);

export const itineraryDays = pgTable("itinerary_days", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tourId: uuid("tour_id").notNull(),
	dayNumber: integer("day_number").notNull(),
	itineraryDayTitle: text("itinerary_day_title"),
	overview: text(),
	nationalParkId: uuid("national_park_id"),
}, (table) => [
	foreignKey({
			columns: [table.nationalParkId],
			foreignColumns: [nationalParks.id],
			name: "itinerary_days_national_park_id_national_parks_id_fk"
		}),
	foreignKey({
			columns: [table.tourId],
			foreignColumns: [tours.id],
			name: "itinerary_days_tour_id_tours_id_fk"
		}).onDelete("cascade"),
]);

export const accommodations = pgTable("accommodations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	url: text(),
	overview: text(),
});

export const accommodationImages = pgTable("accommodation_images", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	accommodationId: uuid("accommodation_id").notNull(),
	imageUrl: text("image_url").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accommodationId],
			foreignColumns: [accommodations.id],
			name: "accommodation_images_accommodation_id_accommodations_id_fk"
		}).onDelete("cascade"),
]);

export const itineraryAccommodations = pgTable("itinerary_accommodations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itineraryDayId: uuid("itinerary_day_id").notNull(),
	accommodationId: uuid("accommodation_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.accommodationId],
			foreignColumns: [accommodations.id],
			name: "itinerary_accommodations_accommodation_id_accommodations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.itineraryDayId],
			foreignColumns: [itineraryDays.id],
			name: "itinerary_accommodations_itinerary_day_id_itinerary_days_id_fk"
		}).onDelete("cascade"),
]);

export const modifiers = pgTable("modifiers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	key: text().notNull(),
	value: text().notNull(),
	description: text().notNull(),
});
