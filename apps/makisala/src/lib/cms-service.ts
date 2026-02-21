'use server'
import {
    db,
    destinations,
    inquiries,
    nationalParks,
    type NewInquiries,
    tourPackages,
    tours,
    wildlife,
    wildlifeParkOverrides,
} from '@repo/db'
import { type JsonOverview, pages, type WildlifeHighlights } from '@repo/db/schema'
import {
    and,
    desc,
    eq,
    ilike,
    type InferInsertModel,
    type InferSelectModel,
    or,
    sql,
} from 'drizzle-orm'
import cuid from 'cuid'
import { modifiers } from './p_seo_info'
import type { FAQItem } from '@/components/faq'

// Types
export type Page = InferSelectModel<typeof pages>
export type NewPage = Omit<InferInsertModel<typeof pages>, 'id' | 'createdAt' | 'updatedAt'>

/* ------------------------------------------------------------------ */
/*  CREATE                                                            */

/* ------------------------------------------------------------------ */
export async function createPage(data: NewPage): Promise<Page> {
    const [inserted] = await db
        .insert(pages)
        .values({
            id: cuid(),
            updatedAt: new Date().toISOString(),
            ...data,
        })
        .returning()

    return inserted
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
        .returning()

    return updated
}

/* ------------------------------------------------------------------ */
/*  GET ALL                                                           */

/* ------------------------------------------------------------------ */
export async function fetchAllBlogs(page_type: 'blog' | 'page'): Promise<Page[]> {
    return await db
        .select()
        .from(pages)
        .where(eq(pages.page_type, page_type))
        .orderBy(desc(pages.createdAt))
}

export async function searchPagesByTitle({ query }: { query: string }) {
    const q = (query || '').trim()
    if (!q) {
        return db.select().from(pages).orderBy(desc(pages.createdAt))
    }

    // pattern for partial match
    const pattern = `%${q}%`

    // Use case-insensitive match (ILIKE)
    return db.select().from(pages).where(ilike(pages.title, pattern)) // or use your client's `ilike` equivalent
}

export async function getPageSlugs(page_type: 'blog' | 'page') {
    return await db.select({ slug: pages.slug }).from(pages).where(eq(pages.page_type, page_type))
}

/* ------------------------------------------------------------------ */
/*  GET BY ID                                                         */

/* ------------------------------------------------------------------ */
export async function getPageById(id: string): Promise<Page | null> {
    const [page] = await db.select().from(pages).where(eq(pages.id, id)).limit(1)

    return page ?? null
}

/* ------------------------------------------------------------------ */
/*  GET BY SLUG                                                       */

/* ------------------------------------------------------------------ */
export async function getPageBySlug(slug: string): Promise<Page | null> {
    const [page] = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1)

    return page ?? null
}

/* ------------------------------------------------------------------ */
/*  DELETE                                                            */

/* ------------------------------------------------------------------ */
export async function deletePage(id: string): Promise<Page | null> {
    const [deleted] = await db.delete(pages).where(eq(pages.id, id)).returning()

    return deleted ?? null
}

export interface CreateTourPackageData {
    title: string
    numberOfDays: number
    country: string
    destination: string
    overview: string
    hero_image_url: string
    slug: string
    pricing_starts_from: string
    itineraries: Array<{
        title: string
        estimatedDrivingDistance?: string
        activities: string
        accommodation?: string
        main_description: string
    }>
}

export async function getTourPackagesByLocation(locationName: string) {
    const locationTerm = `%${locationName.toLowerCase()}%`

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
                orderBy: (itineraries, { asc }) => [asc(itineraries.dayNumber)],
            },
        },
    })
}

export async function getTourPackageBySlug(slug: string) {
    try {
        return await db.query.tourPackages.findFirst({
            where: eq(tourPackages.slug, slug),
            with: {
                itineraries: {
                    orderBy: (itineraries, { asc }) => [asc(itineraries.dayNumber)],
                },
            },
        })
    } catch (error) {
        console.error('Error fetching tour package:', error)
        throw new Error('Failed to fetch tour package')
    }
}

export async function getTourPackagesSlugs() {
    return db
        .select({
            slug: tourPackages.slug,
        })
        .from(tourPackages)
}

export async function createInquiry(data: NewInquiries & { phoneNumber?: string }) {
    const { phoneNumber, ...dbData } = data
    const [newInquiry] = await db.insert(inquiries).values(dbData)

    // Send email notification (non-blocking — don't fail the inquiry if email fails)
    try {
        const { sendInquiryNotificationEmail } = await import('@repo/resend')
        await sendInquiryNotificationEmail({
            fullName: data.fullName,
            email: data.email,
            countryOfResidence: data.countryOfResidence,
            phoneNumber: phoneNumber || '',
            numberOfTravellers: data.numberOfTravellers,
            startDate: data.startDate,
            comments: data.comments || '',
            pageUrl: data.url || '',
        })
    } catch (error) {
        console.error('Failed to send inquiry notification email:', error)
    }

    return newInquiry
}

export async function getTours(country: string, modifier: string) {
    const whereClauses: any[] = [eq(tours.country, country)]

    if (modifiers.includes(modifier)) {
        const durationMatch = modifier.match(/^(\d+)-day$/)
        if (durationMatch) {
            // Filter by number_of_days
            whereClauses.push(eq(tours.number_of_days, parseInt(durationMatch[1], 10)))
        } else {
            // Filter by tags array containing the modifier
            whereClauses.push(
                sql`${modifier}
                = ANY(
                ${tours.tags}
                )`
            )
        }
    }

    return db.query.tours.findMany({
        where: and(...whereClauses),
    })
}

export const getToursByCountry = async (country: string) => {
    return db.select().from(tours).where(eq(tours.country, country)).orderBy(desc(tours.pricing))
}
export const getProgramaticTourBySlug = async (slug: string) => {
    return db.query.tours.findFirst({
        where: eq(tours.slug, slug),
        with: {
            days: {
                orderBy: (days, { asc }) => [asc(days.dayNumber)],
                with: {
                    itineraryAccommodations: {
                        with: {
                            accommodation: {
                                with: {
                                    images: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    })
}

export const getBestTimeToVisit = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            best_time_to_visit: true,
        },
    })

    if (!country) {
        return null
    }

    return await db.query.pages.findFirst({
        where: eq(pages.id, country.best_time_to_visit),
    })
}

export const getDestinationOverview = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            overall_page_url: true,
        },
    })

    if (!country) {
        return null
    }

    return await db.query.pages.findFirst({
        where: eq(pages.id, country.overall_page_url),
    })
}

export const getTravelAdvice = async (destination: string) => {
    const country = await db.query.destinations.findFirst({
        where: eq(destinations.name, destination),
        columns: {
            travel_advice: true,
        },
    })

    if (!country) {
        return null
    }

    return await db.query.pages.findFirst({
        where: eq(pages.id, country.travel_advice),
    })
}

export type TourCard = {
    id: string
    tourName: string
    overview: string
    slug: string
    country: string
    tags: string[]
    pricing: string
    img_url: string
    number_of_days: number
    parks?: string[]
    rating?: string
    reviews?: string
}

export async function getNPInfo(name: string, pageColumn: keyof typeof nationalParks) {
    // Validate that the pageColumn exists
    const validPageColumns = [
        'overview_page_id',
        'wildlife_page_id',
        'best_time_to_visit_id',
        'weather_page_id',
        'malaria_safety_page_id',
        'how_to_get_there_page_id',
    ] as const

    if (!validPageColumns.includes(pageColumn)) {
        throw new Error('Invalid page column')
    }

    // Alias for join
    const pageAlias = pages

    // Single query with join
    const rows = await db
        .select({
            park: {
                id: nationalParks.id,
                name: nationalParks.name,
                country: nationalParks.country,
                wildlife_highlights: nationalParks.wildlife_highlights,
                park_overview: nationalParks.park_overview,
            },
            page: pageAlias,
            tours: sql<TourCard[]>`
                (SELECT json_agg(jsonb_build_object(
                    'id', t.id,
                    'tourName', t.tour_name,
                    'slug', t.slug,
                    'country', t.country,
                    'overview', t.overview,
                    'tags', t.tags,
                    'pricing', t.pricing,
                    'img_url', t.img_url,
                    'number_of_days', t.number_of_days
                                 ))
                 FROM (SELECT DISTINCT
                       ON (t.id) t.*
                       FROM tours t
                           JOIN itinerary_days d
                       ON d.tour_id = t.id
                       WHERE d.national_park_id = national_parks.id
                           LIMIT 6) t)
            `.as('tours'),
        })
        .from(nationalParks)
        .leftJoin(pageAlias, eq(pageAlias.id, nationalParks[pageColumn]))
        .where(eq(nationalParks.name, name))
        .limit(1)

    return (
        (rows[0] as {
            park: {
                id: string
                name: string
                country: string
                wildlife_highlights: WildlifeHighlights[] | null
                park_overview: JsonOverview[] | null
            }
            page: Page | null
            tours: TourCard[] | null
        }) || null
    )
}

export async function fetchAllNps() {
    return await db
        .select({
            name: nationalParks.name,
            country: nationalParks.country,
        })
        .from(nationalParks)
}

export async function getWildlifeByNameAndPark(animalName: string, parkName: string) {
    const parkId = await db.query.nationalParks.findFirst({
        where: eq(nationalParks.name, parkName),
        columns: {
            id: true,
        },
    })

    if (!parkId) {
        return null
    }

    const result = await db
        .select({
            id: wildlife.id,
            name: wildlife.name,
            excerpt: wildlife.excerpt,
            description: wildlife.description,
            quick_facts: wildlife.quick_facts,
            where_to_see_title: sql<string>`COALESCE(
            ${wildlifeParkOverrides.where_to_see_title},
            ${wildlife.where_to_see_title}
            )`,
            where_to_see_description: sql<string>`COALESCE(
            ${wildlifeParkOverrides.where_to_see_description},
            ${wildlife.where_to_see_description}
            )`,
            meta_title: sql<string | null>`${wildlifeParkOverrides.meta_title}
            ::text`,
            meta_description: sql<string | null>`${wildlifeParkOverrides.meta_description}
            ::text`,
            faqs: sql<FAQItem[]>`${wildlifeParkOverrides.faqs}
            ::json`,
            tours: sql<TourCard[] | null>`
                (SELECT json_agg(jsonb_build_object(
                    'id', t.id,
                    'tourName', t.tour_name,
                    'slug', t.slug,
                    'country', t.country,
                    'tags', t.tags,
                    'pricing', t.pricing,
                    'img_url', t.img_url,
                    'number_of_days', t.number_of_days
                                 ))
                 FROM (SELECT DISTINCT
                       ON (t.id) t.*
                       FROM tours t
                           JOIN itinerary_days d
                       ON d.tour_id = t.id
                       WHERE d.national_park_id = ${parkId.id}
                           LIMIT 6) t)
            `.as('tours'),
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
        .execute()

    return result[0]
}

export async function getWildlifeByPark(parkName: string) {
    return await db
        .select({
            animalName: wildlife.name,
        })
        .from(wildlife)
        .leftJoin(wildlifeParkOverrides, eq(wildlife.id, wildlifeParkOverrides.wildlife_id))
        .leftJoin(nationalParks, eq(wildlifeParkOverrides.national_park_id, nationalParks.id))
        .where(eq(nationalParks.name, parkName))
}

export async function AllToursSlugs() {
    return await db
        .select({
            slug: tours.slug,
        })
        .from(tours)
}

export async function getWeekendDeals() {
    const rows = await db.execute(sql`
        SELECT DISTINCT
        ON (tags[1])
            t.id,
            t.tour_name,
            t.slug,
            t.country,
            t.pricing,
            t.img_url,
            t.number_of_days
        FROM tours t
        WHERE t.pricing >= 1800
        ORDER BY t.tags[1], t.pricing ASC
            LIMIT 4
    `)

    // Helper to generate stable random-ish numbers based on ID
    const getStableRandom = (seed: string, min: number, max: number, decimals: number = 0) => {
        let hash = 0
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash)
        }
        const normalized = (Math.abs(hash) % 100) / 100
        const val = min + normalized * (max - min)
        return val.toFixed(decimals)
    }

    return rows.map(row => ({
        ...row,
        rating: getStableRandom(row.id as string, 4.5, 5.0, 1),
        reviews: getStableRandom(row.id as string, 12, 150, 0),
    })) as TourCard[]
}
