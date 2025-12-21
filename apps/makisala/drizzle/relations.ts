import { relations } from "drizzle-orm/relations";
import { nationalParks, wildlifeParkOverrides, wildlife, user, session, tourPackages, itineraries, account, pages, destinations, itineraryDays, tours, accommodations, accommodationImages, itineraryAccommodations } from "./schema";

export const wildlifeParkOverridesRelations = relations(wildlifeParkOverrides, ({one}) => ({
	nationalPark: one(nationalParks, {
		fields: [wildlifeParkOverrides.nationalParkId],
		references: [nationalParks.id]
	}),
	wildlife: one(wildlife, {
		fields: [wildlifeParkOverrides.wildlifeId],
		references: [wildlife.id]
	}),
}));

export const nationalParksRelations = relations(nationalParks, ({one, many}) => ({
	wildlifeParkOverrides: many(wildlifeParkOverrides),
	page_bestTimeToVisitId: one(pages, {
		fields: [nationalParks.bestTimeToVisitId],
		references: [pages.id],
		relationName: "nationalParks_bestTimeToVisitId_pages_id"
	}),
	destination: one(destinations, {
		fields: [nationalParks.destinationId],
		references: [destinations.id]
	}),
	page_howToGetTherePageId: one(pages, {
		fields: [nationalParks.howToGetTherePageId],
		references: [pages.id],
		relationName: "nationalParks_howToGetTherePageId_pages_id"
	}),
	page_malariaSafetyPageId: one(pages, {
		fields: [nationalParks.malariaSafetyPageId],
		references: [pages.id],
		relationName: "nationalParks_malariaSafetyPageId_pages_id"
	}),
	page_overviewPageId: one(pages, {
		fields: [nationalParks.overviewPageId],
		references: [pages.id],
		relationName: "nationalParks_overviewPageId_pages_id"
	}),
	page_weatherPageId: one(pages, {
		fields: [nationalParks.weatherPageId],
		references: [pages.id],
		relationName: "nationalParks_weatherPageId_pages_id"
	}),
	page_wildlifePageId: one(pages, {
		fields: [nationalParks.wildlifePageId],
		references: [pages.id],
		relationName: "nationalParks_wildlifePageId_pages_id"
	}),
	itineraryDays: many(itineraryDays),
}));

export const wildlifeRelations = relations(wildlife, ({many}) => ({
	wildlifeParkOverrides: many(wildlifeParkOverrides),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	sessions: many(session),
	accounts: many(account),
}));

export const itinerariesRelations = relations(itineraries, ({one}) => ({
	tourPackage: one(tourPackages, {
		fields: [itineraries.tourPackageId],
		references: [tourPackages.id]
	}),
}));

export const tourPackagesRelations = relations(tourPackages, ({many}) => ({
	itineraries: many(itineraries),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const pagesRelations = relations(pages, ({many}) => ({
	nationalParks_bestTimeToVisitId: many(nationalParks, {
		relationName: "nationalParks_bestTimeToVisitId_pages_id"
	}),
	nationalParks_howToGetTherePageId: many(nationalParks, {
		relationName: "nationalParks_howToGetTherePageId_pages_id"
	}),
	nationalParks_malariaSafetyPageId: many(nationalParks, {
		relationName: "nationalParks_malariaSafetyPageId_pages_id"
	}),
	nationalParks_overviewPageId: many(nationalParks, {
		relationName: "nationalParks_overviewPageId_pages_id"
	}),
	nationalParks_weatherPageId: many(nationalParks, {
		relationName: "nationalParks_weatherPageId_pages_id"
	}),
	nationalParks_wildlifePageId: many(nationalParks, {
		relationName: "nationalParks_wildlifePageId_pages_id"
	}),
}));

export const destinationsRelations = relations(destinations, ({many}) => ({
	nationalParks: many(nationalParks),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({one, many}) => ({
	nationalPark: one(nationalParks, {
		fields: [itineraryDays.nationalParkId],
		references: [nationalParks.id]
	}),
	tour: one(tours, {
		fields: [itineraryDays.tourId],
		references: [tours.id]
	}),
	itineraryAccommodations: many(itineraryAccommodations),
}));

export const toursRelations = relations(tours, ({many}) => ({
	itineraryDays: many(itineraryDays),
}));

export const accommodationImagesRelations = relations(accommodationImages, ({one}) => ({
	accommodation: one(accommodations, {
		fields: [accommodationImages.accommodationId],
		references: [accommodations.id]
	}),
}));

export const accommodationsRelations = relations(accommodations, ({many}) => ({
	accommodationImages: many(accommodationImages),
	itineraryAccommodations: many(itineraryAccommodations),
}));

export const itineraryAccommodationsRelations = relations(itineraryAccommodations, ({one}) => ({
	accommodation: one(accommodations, {
		fields: [itineraryAccommodations.accommodationId],
		references: [accommodations.id]
	}),
	itineraryDay: one(itineraryDays, {
		fields: [itineraryAccommodations.itineraryDayId],
		references: [itineraryDays.id]
	}),
}));