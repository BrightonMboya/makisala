"use server"
import {
    db,
    inquiries,
    nationalParks,
    tours,
    wildlife,
    wildlifeParkOverrides,
    tourPackages,
    itineraries,
    NewTourPackage,
    NewItinerary,
    NewInquiries,
    destinations
} from "../db";
import {pages} from "@/db/schema";
import {and, desc, eq, or, sql} from "drizzle-orm";
import cuid from "cuid";
import {modifiers} from "@/lib/p_seo_info";

import type {InferInsertModel, InferSelectModel} from "drizzle-orm";

// Types
export type Page = InferSelectModel<typeof pages>;
export type NewPage = Omit<InferInsertModel<typeof pages>, "id" | "createdAt" | "updatedAt">;

/* ------------------------------------------------------------------ */
/*  CREATE                                                            */

/* ------------------------------------------------------------------ */
export async function createPage(data: NewPage): Promise<Page> {
    const [inserted] = await db
        .insert(pages)
        .values({
            id: cuid(), // ✅ generate here
            updatedAt: new Date().toISOString(),
            ...data,
        })
        .returning();

    return inserted;
}

/* ------------------------------------------------------------------ */
/*  UPDATE                                                            */

/* ------------------------------------------------------------------ */
export async function updatePage(id: string, data: Partial<Page>): Promise<Page> {
    const [updated] = await db
        .update(pages)
        .set({
            ...data,
            updatedAt: new Date().toISOString(), // ✅ keep updatedAt consistent
        })
        .where(eq(pages.id, id))
        .returning();

    return updated;
}

/* ------------------------------------------------------------------ */
/*  GET ALL                                                           */

/* ------------------------------------------------------------------ */
export async function getPages(page_type: "blog" | "page"): Promise<Page[]> {
    return await db
        .select()
        .from(pages)
        .where(eq(pages.page_type, page_type))
}

export async function getPageSlugs(page_type: "blog" | "page") {
    return await db
        .select({slug: pages.slug})
        .from(pages)
        .where(eq(pages.page_type, page_type))
}

/* ------------------------------------------------------------------ */
/*  GET BY ID                                                         */

/* ------------------------------------------------------------------ */
export async function getPageById(id: string): Promise<Page | null> {
    const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.id, id))
        .limit(1);

    return page ?? null;
}

/* ------------------------------------------------------------------ */
/*  GET BY SLUG                                                       */

/* ------------------------------------------------------------------ */
export async function getPageBySlug(slug: string): Promise<Page | null> {
    const [page] = await db
        .select()
        .from(pages)
        .where(eq(pages.slug, slug))
        .limit(1);

    return page ?? null;
}

/* ------------------------------------------------------------------ */
/*  DELETE                                                            */

/* ------------------------------------------------------------------ */
export async function deletePage(id: string): Promise<Page | null> {
    const [deleted] = await db
        .delete(pages)
        .where(eq(pages.id, id))
        .returning();

    return deleted ?? null;
}

export interface CreateTourPackageData {
    title: string;
    numberOfDays: number;
    country: string;
    destination: string;
    overview: string;
    hero_image_url: string;
    slug: string;
    pricing_starts_from: string
    itineraries: Array<{
        title: string;
        estimatedDrivingDistance?: string;
        activities: string;
        accommodation?: string;
    }>;
}

export async function createTourPackage(data: CreateTourPackageData) {
    try {
        // Insert the tour package
        const tourPackageData: NewTourPackage = {
            title: data.title,
            numberOfDays: data.numberOfDays,
            country: data.country,
            destination: data.destination,
            overview: data.overview,
            hero_image_url: data.hero_image_url,
            slug: data.slug,
            pricing_starts_from: data.pricing_starts_from,
            updatedAt: new Date(),
        };

        const [newTourPackage] = await db
            .insert(tourPackages)
            .values(tourPackageData)
            .returning();

        // Insert itineraries
        const itineraryData: NewItinerary[] = data.itineraries.map((itinerary, index) => ({
            tourPackageId: newTourPackage.id,
            dayNumber: index + 1,
            title: itinerary.title,
            estimatedDrivingDistance: itinerary.estimatedDrivingDistance || null,
            activities: itinerary.activities,
            accommodation: itinerary.accommodation || null,
        }));

        const newItineraries = await db
            .insert(itineraries)
            .values(itineraryData)
            .returning();

        return {
            tourPackage: newTourPackage,
            itineraries: newItineraries,
        };
    } catch (error) {
        console.error('Error creating tour package:', error);
        throw new Error('Failed to create tour package');
    }
}

export async function getTourPackages() {
    try {
        return await db.query.tourPackages.findMany({
            with: {
                itineraries: {
                    orderBy: (itineraries, {asc}) => [asc(itineraries.dayNumber)],
                },
            },
            orderBy: (tourPackages, {desc}) => [desc(tourPackages.createdAt)],
        });
    } catch (error) {
        console.error('Error fetching tour packages:', error);
        throw new Error('Failed to fetch tour packages');
    }
}

export async function getTourPackageById(id: string) {
    try {
        return await db.query.tourPackages.findFirst({
            where: eq(tourPackages.id, id),
            with: {
                itineraries: {
                    orderBy: (itineraries, {asc}) => [asc(itineraries.dayNumber)],
                },
            },
        });
    } catch (error) {
        console.error('Error fetching tour package:', error);
        throw new Error('Failed to fetch tour package');
    }
}

export async function getTourPackagesByLocation(locationName: string) {
    const locationTerm = `%${locationName.toLowerCase()}%`;

    return await db.query.tourPackages.findMany({
        where: or(
            sql`LOWER(
            ${tourPackages.slug}
            )
            ILIKE
            ${locationTerm}`,
            sql`LOWER(
            ${tourPackages.destination}
            )
            ILIKE
            ${locationTerm}`,
            sql`LOWER(
            ${tourPackages.overview}
            )
            ILIKE
            ${locationTerm}`
        ),
        with: {
            itineraries: {
                orderBy: (itineraries, {asc}) => [asc(itineraries.dayNumber)],
            },
        },
    });
}

export async function getTourPackageBySlug(slug: string) {
    try {
        return await db.query.tourPackages.findFirst({
            where: eq(tourPackages.slug, slug),
            with: {
                itineraries: {
                    orderBy: (itineraries, {asc}) => [asc(itineraries.dayNumber)],
                },
            },
        });
    } catch (error) {
        console.error('Error fetching tour package:', error);
        throw new Error('Failed to fetch tour package');
    }
}

export async function getTourPackagesSlugs() {
    return db.select({
        slug: tourPackages.slug
    })
        .from(tourPackages)
}

export async function deleteTourPackage(id: string) {
    try {
        await db.delete(tourPackages).where(eq(tourPackages.id, id));
    } catch (error) {
        console.error('Error deleting tour package:', error);
        throw new Error('Failed to delete tour package');
    }
}

export async function createInquiry(data: NewInquiries) {
    const [newInquiry] = await db
        .insert(inquiries)
        .values(data);

    return newInquiry;

}

export async function getTours(country: string, modifier: string) {
    const whereClauses: any[] = [eq(tours.country, country)];

    if (modifiers.includes(modifier)) {
        const durationMatch = modifier.match(/^(\d+)-day$/);
        if (durationMatch) {
            // Filter by number_of_days
            whereClauses.push(
                eq(tours.number_of_days, parseInt(durationMatch[1], 10))
            );
        } else {
            // Filter by tags array containing the modifier
            whereClauses.push(
                sql`${modifier}
                = ANY(
                ${tours.tags}
                )`
            );
        }
    }

    return db.query.tours.findMany({
        where: and(...whereClauses),
    });
}

export const getToursByCountry = async (country: string) => {
    return db.select().from(tours).where(eq(tours.country, country))
        .orderBy(desc(tours.pricing))
}

export const getProgramaticTourById = async (tour_id: string) => {
    return db.query.tours.findFirst({
        where: eq(tours.id, tour_id),
        with: {
            days: {
                with: {
                    itineraryAccommodations: {
                        with: {
                            accommodation: {
                                with: {
                                    images: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}

export const getProgramaticTourBySlug = async (slug: string) => {
    return db.query.tours.findFirst({
        where: eq(tours.slug, slug),
        with: {
            days: {
                with: {
                    itineraryAccommodations: {
                        with: {
                            accommodation: {
                                with: {
                                    images: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })
}

export const getBestTimeToVisit = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            best_time_to_visit: true
        }
    })

    return await db.query.pages.findFirst({
        where: eq(pages.id, country?.best_time_to_visit!)
    })
}

export const getDestinationOverview = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            overall_page_url: true,
        }
    })

    return await db.query.pages.findFirst({
        where: eq(pages.id, country?.overall_page_url!)
    })
}

export const getTravelAdvice = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            travel_advice: true
        }
    })

    return await db.query.pages.findFirst({
        where: eq(pages.id, country?.travel_advice!)
    })
}

export async function getNPInfo(name: string, pageColumn: keyof typeof nationalParks) {
    // Validate that the pageColumn exists
    const validPageColumns = [
        "overview_page_id",
        "wildlife_page_id",
        "best_time_to_visit_id",
        "weather_page_id",
        "malaria_safety_page_id",
        "how_to_get_there_page_id",
    ] as const;

    if (!validPageColumns.includes(pageColumn as any)) {
        throw new Error("Invalid page column");
    }

    // Alias for join
    const pageAlias = pages;

    // Single query with join
    const rows = await db
        .select({
            park: {
                name: nationalParks.name,
                country: nationalParks.country,
                wildlife_highlights: nationalParks.wildlife_highlights,
                park_overview: nationalParks.park_overview
            },
            page: pageAlias,
        })
        .from(nationalParks)
        // @ts-expect-error
        .leftJoin(pageAlias, eq(pageAlias.id, nationalParks[pageColumn]))
        .where(eq(nationalParks.name, name))
        .limit(1);

    return rows[0] ?? null;
}

export async function fetchAllNps() {
    return await db.select({
        name: nationalParks.name
    }).from(nationalParks)
}


export async function getWildlifeByNameAndPark(animalName: string, parkName: string) {
    const parkId = await db.query.nationalParks.findFirst({
        where: eq(nationalParks.name, parkName),
        columns: {
            id: true
        }
    })

    const result = await db
        .select({
            id: wildlife.id,
            name: wildlife.name,
            excerpt: wildlife.excerpt,
            description: wildlife.description,
            quick_facts: wildlife.quick_facts,
            where_to_see_title: sql`COALESCE(
            ${wildlifeParkOverrides.where_to_see_title},
            ${wildlife.where_to_see_title}
            )`,
            where_to_see_description: sql`COALESCE(
            ${wildlifeParkOverrides.where_to_see_description},
            ${wildlife.where_to_see_description}
            )`,
            meta_title: sql`${wildlifeParkOverrides.meta_title}
            ::text`,
            meta_description: sql`${wildlifeParkOverrides.meta_description}
            ::text`,
            faqs: sql`${wildlifeParkOverrides.faqs}
            ::json`,
        })
        .from(wildlife)
        .leftJoin(wildlifeParkOverrides, eq(wildlife.id, wildlifeParkOverrides.wildlife_id))
        .where(
            and(
                eq(wildlife.name, animalName),
                eq(wildlifeParkOverrides.national_park_id, parkId?.id)
            )
        )
        .limit(1)
        .execute();


    // fallback if no override exists
    if (!result.length) {
        return await db.query.wildlife.findFirst({
            where: eq(wildlife.name, animalName),
        });
    }

    return result[0];
}
