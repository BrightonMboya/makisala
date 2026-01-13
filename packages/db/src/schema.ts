import {
  boolean,
  integer,
  json,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface WildlifeHighlights {
  name: string;
  abundance: 'Abundant' | 'common' | 'occasional' | 'rare';
}

export interface JsonOverview {
  name: string;
  description: string;
}

export const PageType = pgEnum('pageType', ['page', 'blog']);

export const PageStatus = pgEnum('pageStatus', ['published', 'draft']);
export const CommentStatus = pgEnum('commentStatus', ['open', 'resolved']);

// User role enum for team management
export const UserRole = pgEnum('user_role', ['admin', 'member']);

// Invitation status enum
export const InvitationStatus = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'revoked',
]);
export const pages = pgTable('pages', {
  id: text().primaryKey().notNull(),
  title: text().notNull(),
  slug: text().notNull(),
  content: text().notNull(),
  excerpt: text(),
  featured_image_url: text(),
  meta_title: text(),
  meta_description: text(),
  meta_keywords: text(),
  faqs: json('faqs').$type<FAQItem[]>(),
  page_type: PageType().default('page'),
  status: PageStatus().default('published'),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const inquiries = pgTable('inquiries', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text().notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  countryOfResidence: varchar('country_of_residence', {
    length: 255,
  }).notNull(),
  comments: text(),
  numberOfTravellers: integer('number_of_travellers').notNull(),
  startDate: timestamp('start_date').notNull(),
  url: text(),
});

export const tourPackages = pgTable('tour_packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  numberOfDays: integer('number_of_days').notNull(),
  slug: text('slug'),
  country: varchar('country', { length: 100 }).notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  overview: text('overview').notNull(),
  hero_image_url: text().notNull(),
  pricing_starts_from: varchar('pricing_starts_from', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const itineraries = pgTable('itineraries', {
  id: uuid('id').primaryKey().defaultRandom(),
  tourPackageId: uuid('tour_package_id')
    .references(() => tourPackages.id, { onDelete: 'cascade' })
    .notNull(),
  dayNumber: integer('day_number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  estimatedDrivingDistance: text('estimated_driving_distance'),
  activities: text('activities').notNull(),
  accommodation: text('accommodation'),
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

// ---------- ORGANIZATIONS ----------
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  primaryColor: text('primary_color').default('#15803d'), // Default green
  notificationEmail: text('notification_email'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(user),
  proposals: many(proposals),
  clients: many(clients),
  invitations: many(teamInvitations),
}));

// ---------- CLIENTS ----------
export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  countryOfResidence: text('country_of_residence'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clientsRelations = relations(clients, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [clients.organizationId],
    references: [organizations.id],
  }),
  proposals: many(proposals),
}));

// Better auth schemas
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  role: UserRole('role').default('admin').notNull(), // First user of org is admin
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()),
});

// ---------- TEAM INVITATIONS ----------
export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: UserRole('role').default('member').notNull(),
  token: text('token').notNull().unique(),
  invitedBy: text('invited_by')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  status: InvitationStatus('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at'),
});

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [teamInvitations.organizationId],
    references: [organizations.id],
  }),
  inviter: one(user, {
    fields: [teamInvitations.invitedBy],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [user.organizationId],
    references: [organizations.id],
  }),
  sentInvitations: many(teamInvitations),
}));

// the following tables are for p_seo, some tables looks duplicated
// reason is i want to rollback this feature if it doesnt provide values

// ---------- TOURS ----------
export const tours = pgTable('tours', {
  id: uuid('id').defaultRandom().primaryKey(),
  tourName: text('tour_name').notNull().unique(), // data.tour_name
  slug: text().unique(),
  overview: text('overview').notNull(), // data.overview
  pricing: numeric('pricing', { precision: 12, scale: 2 }).notNull(), // data.pricing
  country: text('country').notNull(), // if you scrape it
  sourceUrl: text('source_url').notNull(), // optional: where you scraped from
  activities: json('activities').notNull(), // [{title: "...", activity_name: "..."}]
  topFeatures: json('top_features').notNull(), // [{title: "...", description: "..."}]
  img_url: text('img_url').notNull(),
  number_of_days: integer('number_of_days').notNull(),
  tags: text('tags').array().notNull(), // eg ['family', 'group', 'luxury']
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const toursRelations = relations(tours, ({ many }) => ({
  days: many(itineraryDays),
}));

// ---------- ITINERARY DAYS ----------
export const itineraryDays = pgTable('itinerary_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  tourId: uuid('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(), // day.day_number
  dayTitle: text('itinerary_day_title'), // day.itinerary_day_title
  overview: text('overview'), // day.overview
  national_park_id: uuid('national_park_id').references(() => nationalParks.id),
});

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  tour: one(tours, {
    fields: [itineraryDays.tourId],
    references: [tours.id],
  }),
  itineraryAccommodations: many(itineraryAccommodations),
}));

// ---------- DEDUPED ACCOMMODATIONS (MASTER) ----------
export const accommodations = pgTable('accommodations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  url: text('url'), // e.g. https://www.melia.com/...
  overview: text('overview'), // scraped accommodation overview
  description: text('description'),
  latitude: numeric('latitude', { precision: 10, scale: 7 }),
  longitude: numeric('longitude', { precision: 10, scale: 7 }),
});

export const accommodationsRelations = relations(accommodations, ({ many }) => ({
  images: many(accommodationImages),
  itineraryAccommodations: many(itineraryAccommodations),
}));

// ---------- ACCOMMODATION IMAGES (per master accommodation) ----------
export const accommodationImages = pgTable('accommodation_images', {
  id: uuid('id').defaultRandom().primaryKey(),
  accommodationId: uuid('accommodation_id')
    .notNull()
    .references(() => accommodations.id, { onDelete: 'cascade' }),
  bucket: text('bucket').notNull(),
  key: text('key').notNull(),
});

export const accommodationImagesRelations = relations(accommodationImages, ({ one }) => ({
  accommodation: one(accommodations, {
    fields: [accommodationImages.accommodationId],
    references: [accommodations.id],
  }),
}));

// ---------- JOIN: WHICH ACCOMMODATION IS USED ON WHICH DAY ----------
export const itineraryAccommodations = pgTable('itinerary_accommodations', {
  id: uuid('id').defaultRandom().primaryKey(),
  itineraryDayId: uuid('itinerary_day_id')
    .notNull()
    .references(() => itineraryDays.id, { onDelete: 'cascade' }),
  accommodationId: uuid('accommodation_id')
    .notNull()
    .references(() => accommodations.id, { onDelete: 'cascade' }),
});

export const itineraryAccommodationsRelations = relations(itineraryAccommodations, ({ one }) => ({
  day: one(itineraryDays, {
    fields: [itineraryAccommodations.itineraryDayId],
    references: [itineraryDays.id],
  }),
  accommodation: one(accommodations, {
    fields: [itineraryAccommodations.accommodationId],
    references: [accommodations.id],
  }),
}));

// these are the modifiers used for the pseo pages
export const modifiers = pgTable('modifiers', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text().notNull(), // category: comfort, type, accommodation, other
  value: text().notNull(), //-- e.g. "luxury", "family", "camping"
  description: text().notNull(), // -- SEO text
});

export const destinations = pgTable('destinations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  overall_page_url: text().notNull(),
  best_time_to_visit: text().notNull(),
  travel_advice: text().notNull(),
  destination_costs: text(),
  where_to_go: text(),
});

export const nationalParks = pgTable('national_parks', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  // TODO: this country field should be removed
  country: text().notNull(),
  destination_id: uuid().references(() => destinations.id),
  overview_page_id: text().references(() => pages.id),
  wildlife_page_id: text().references(() => pages.id),
  best_time_to_visit_id: text().references(() => pages.id),
  // birds_page_id: text().references(() => pages.id),
  weather_page_id: text().references(() => pages.id),
  malaria_safety_page_id: text().references(() => pages.id),
  how_to_get_there_page_id: text().references(() => pages.id),
  wildlife_highlights: json('wildlife_highlights').$type<WildlifeHighlights[]>(),
  park_overview: json('park_overview').$type<JsonOverview[]>(),
  createdAt: timestamp({ precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp({ precision: 3, mode: 'string' }).notNull(),
});

export const nationalParksRelations = relations(nationalParks, ({ one }) => ({
  destination: one(destinations, {
    fields: [nationalParks.destination_id],
    references: [destinations.id],
  }),
}));

export const destinationsRelations = relations(destinations, ({ many }) => ({
  nationalParks: many(nationalParks),
}));

export const wildlife = pgTable('wildlife', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text().notNull(),
  excerpt: text().notNull(),
  description: text().notNull(),
  quick_facts: json('quick_facts').$type<{ fact: string; label: string }[]>(),
  where_to_see_description: text().notNull(),
  where_to_see_title: text(),
});

export const wildlifeParkOverrides = pgTable('wildlife_park_overrides', {
  id: uuid('id').defaultRandom().primaryKey(),
  wildlife_id: uuid()
    .notNull()
    .references(() => wildlife.id),
  national_park_id: uuid()
    .notNull()
    .references(() => nationalParks.id),
  where_to_see_title: text().notNull(),
  where_to_see_description: text().notNull(),
  meta_title: text(), // SEO title
  meta_description: text(), // SEO description
  faqs: json('faqs').$type<FAQItem[]>(), // optional FAQ schema
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------- PROPOSALS ----------
export const ProposalStatus = pgEnum('proposal_status', ['draft', 'shared']);

export const proposals = pgTable('proposals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  tourId: uuid('tour_id')
    .notNull()
    .references(() => tours.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  tourTitle: text('tour_title'),
  tourType: text('tour_type'),
  theme: text('theme').default('minimalistic'),
  heroImage: text('hero_image'),
  startDate: timestamp('start_date', { precision: 3, mode: 'string' }),
  startCity: text('start_city'),
  endCity: text('end_city'),
  pickupPoint: text('pickup_point'),
  transferIncluded: text('transfer_included'),
  // Pricing data stored as JSON for flexibility
  pricingRows:
    json('pricing_rows').$type<
      Array<{ id: string; count: number; type: string; unitPrice: number }>
    >(),
  extras:
    json('extras').$type<Array<{ id: string; name: string; price: number; selected: boolean }>>(),
  travelerGroups:
    json('traveler_groups').$type<Array<{ id: string; count: number; type: string }>>(),
  inclusions: text('inclusions').array(),
  exclusions: text('exclusions').array(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  status: ProposalStatus('status').default('draft').notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp('updated_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------- PROPOSAL DAYS ----------
export const proposalDays = pgTable('proposal_days', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalId: text('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number').notNull(),
  title: text('title'),
  description: text('description'),
  previewImage: text('preview_image'),
  nationalParkId: uuid('national_park_id').references(() => nationalParks.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------- PROPOSAL ACCOMMODATIONS (join table) ----------
export const proposalAccommodations = pgTable('proposal_accommodations', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalDayId: uuid('proposal_day_id')
    .notNull()
    .references(() => proposalDays.id, { onDelete: 'cascade' }),
  accommodationId: uuid('accommodation_id')
    .notNull()
    .references(() => accommodations.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------- PROPOSAL ACTIVITIES ----------
export const proposalActivities = pgTable('proposal_activities', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalDayId: uuid('proposal_day_id')
    .notNull()
    .references(() => proposalDays.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location'),
  moment: text('moment').notNull(), // 'Morning', 'Afternoon', 'Evening', 'Half Day', 'Full Day', 'Night'
  isOptional: boolean('is_optional').default(false).notNull(),
  imageUrl: text('image_url'),
  time: text('time'), // Optional: specific time like "08:00"
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// ---------- PROPOSAL MEALS ----------
export const proposalMeals = pgTable('proposal_meals', {
  id: uuid('id').defaultRandom().primaryKey(),
  proposalDayId: uuid('proposal_day_id')
    .notNull()
    .references(() => proposalDays.id, { onDelete: 'cascade' })
    .unique(), // One meal record per day
  breakfast: boolean('breakfast').default(false).notNull(),
  lunch: boolean('lunch').default(false).notNull(),
  dinner: boolean('dinner').default(false).notNull(),
  createdAt: timestamp('created_at', { precision: 3, mode: 'string' })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// Relations
export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  tour: one(tours, {
    fields: [proposals.tourId],
    references: [tours.id],
  }),
  organization: one(organizations, {
    fields: [proposals.organizationId],
    references: [organizations.id],
  }),
  client: one(clients, {
    fields: [proposals.clientId],
    references: [clients.id],
  }),
  days: many(proposalDays),
  comments: many(comments),
}));

export const proposalDaysRelations = relations(proposalDays, ({ one, many }) => ({
  proposal: one(proposals, {
    fields: [proposalDays.proposalId],
    references: [proposals.id],
  }),
  nationalPark: one(nationalParks, {
    fields: [proposalDays.nationalParkId],
    references: [nationalParks.id],
  }),
  accommodations: many(proposalAccommodations),
  activities: many(proposalActivities),
  meals: one(proposalMeals, {
    fields: [proposalDays.id],
    references: [proposalMeals.proposalDayId],
  }),
}));

export const proposalAccommodationsRelations = relations(proposalAccommodations, ({ one }) => ({
  proposalDay: one(proposalDays, {
    fields: [proposalAccommodations.proposalDayId],
    references: [proposalDays.id],
  }),
  accommodation: one(accommodations, {
    fields: [proposalAccommodations.accommodationId],
    references: [accommodations.id],
  }),
}));

export const proposalActivitiesRelations = relations(proposalActivities, ({ one }) => ({
  proposalDay: one(proposalDays, {
    fields: [proposalActivities.proposalDayId],
    references: [proposalDays.id],
  }),
}));

export const proposalMealsRelations = relations(proposalMeals, ({ one }) => ({
  proposalDay: one(proposalDays, {
    fields: [proposalMeals.proposalDayId],
    references: [proposalDays.id],
  }),
}));

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: text('proposal_id').notNull(),
  userId: text('user_id').references(() => user.id),
  userName: text('user_name'),
  content: text('content').notNull(),
  posX: numeric('pos_x', { precision: 5, scale: 2 }).notNull(),
  posY: numeric('pos_y', { precision: 5, scale: 2 }).notNull(),
  width: numeric('width', { precision: 5, scale: 2 }),
  height: numeric('height', { precision: 5, scale: 2 }),
  status: CommentStatus('status').default('open').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const commentReplies = pgTable('comment_replies', {
  id: uuid('id').primaryKey().defaultRandom(),
  commentId: uuid('comment_id')
    .references(() => comments.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').references(() => user.id),
  userName: text('user_name'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments Relations
export const commentsRelations = relations(comments, ({ one, many }) => ({
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
  replies: many(commentReplies),
}));

export const commentRepliesRelations = relations(commentReplies, ({ one }) => ({
  comment: one(comments, {
    fields: [commentReplies.commentId],
    references: [comments.id],
  }),
  user: one(user, {
    fields: [commentReplies.userId],
    references: [user.id],
  }),
}));




export type Tours = typeof tours.$inferSelect;
export type NewTourPackage = typeof tourPackages.$inferInsert;
export type Itinerary = typeof itineraries.$inferSelect;
export type NewItinerary = typeof itineraries.$inferInsert;
export type NewInquiries = typeof inquiries.$inferInsert;
export type IWildlife = typeof wildlife.$inferSelect;
export type IWildlifeParkOverrides = typeof wildlifeParkOverrides.$inferSelect;
export type IPage = typeof pages.$inferSelect;

export type Proposal = typeof proposals.$inferSelect;
export type NewProposal = typeof proposals.$inferInsert;
export type ProposalDay = typeof proposalDays.$inferSelect;
export type NewProposalDay = typeof proposalDays.$inferInsert;
export type ProposalAccommodation = typeof proposalAccommodations.$inferSelect;
export type NewProposalAccommodation = typeof proposalAccommodations.$inferInsert;
export type ProposalActivity = typeof proposalActivities.$inferSelect;
export type NewProposalActivity = typeof proposalActivities.$inferInsert;
export type ProposalMeal = typeof proposalMeals.$inferSelect;
export type NewProposalMeal = typeof proposalMeals.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type User = typeof user.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type NewTeamInvitation = typeof teamInvitations.$inferInsert;
