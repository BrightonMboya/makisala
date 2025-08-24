"use server"
import {db, inquiries, tours} from "../db";
import {pages} from "@/db/schema";
import {and, desc, eq, or, sql} from "drizzle-orm";
import cuid from "cuid";
import {tourPackages, itineraries, NewTourPackage, NewItinerary, NewInquiries} from "../db";
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

// getTours.ts
// export async function getTours(country: string, modifier: string) {
//     const whereClauses = [eq(tours.country, country)];
//
//     // duration case (e.g. "3-day")
//     const durationMatch = modifier.match(/(\d+)-day/);
//     if (durationMatch) {
//         whereClauses.push(eq(tours.number_of_days, parseInt(durationMatch[1], 10)));
//     }
//
//     return db.query.tours.findMany({
//         where: and(...whereClauses),
//     });
// }

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