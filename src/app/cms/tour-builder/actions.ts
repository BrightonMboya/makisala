'use server'

import {
    accommodations,
    destinations,
    itineraryAccommodations,
    itineraryDays,
    nationalParks,
    tours,
} from '@/db'
import { db } from '@/db'
import { revalidatePath } from 'next/cache'
import cloudinary from '@/lib/cloudinary'
import { uploadAccommodationImages } from '@/lib/cloudinary'
import { desc, eq, sql, and, ilike, gte, lte } from 'drizzle-orm'

export async function getNationalParks() {
    return await db.select().from(nationalParks)
}

export async function getDestinations() {
    return await db.select().from(destinations)
}

export async function getAccommodations() {
    return await db.select().from(accommodations)
}

export async function createNationalPark(data: {
    name: string
    country: string
    destination_id?: string
}) {
    const [newPark] = await db.insert(nationalParks).values({
        ...data,
        updatedAt: new Date().toISOString(),
    }).returning()
    revalidatePath('/cms/tour-builder')
    return newPark
}


// ... existing imports

export async function createAccommodation(data: {
    name: string
    url?: string
    overview?: string
    imageUrls?: string[]
}) {
    const [newAcc] = await db.insert(accommodations).values({
        name: data.name,
        url: data.url,
        overview: data.overview,
    }).returning()

    if (data.imageUrls && data.imageUrls.length > 0) {
        const imagesToUpload = data.imageUrls.map(url => ({ image_url: url }))
        await uploadAccommodationImages(newAcc.id, newAcc.name, imagesToUpload)
    }

    revalidatePath('/cms/tour-builder')
    return newAcc
}

// Helper to get images from a folder
export async function getCloudinaryImages(folder?: string) {
    try {
        // Use Search API to support Asset Folders (which don't necessarily match public_id prefix)
        // If folder is provided, search by folder. If not, search root (folder="")
        const expression = folder ? `folder:"${folder}"` : 'folder=""'

        const result = await cloudinary.search
            .expression(expression)
            .sort_by('created_at', 'desc')
            .max_results(50)
            .execute()

        return result.resources.map((r: any) => ({
            public_id: r.public_id,
            secure_url: r.secure_url,
        }))
    } catch (error) {
        console.error('Error fetching Cloudinary images:', error)
        return []
    }
}

// Helper to get folders
export async function getCloudinaryFolders(parent_folder?: string) {
    try {
        // If parent_folder is provided, list subfolders of that folder
        // Otherwise, list root folders
        const result = parent_folder 
            ? await cloudinary.api.sub_folders(parent_folder)
            : await cloudinary.api.root_folders()
            
        return result.folders
    } catch (error) {
        console.error('Error fetching Cloudinary folders:', error)
        return []
    }
}

export type CreateTourData = {
    tourName: string
    slug?: string
    overview: string
    pricing: string
    country: string
    // sourceUrl removed
    activities: { title: string; activity_name: string }[]
    topFeatures: { title: string; description: string }[]
    img_url: string
    number_of_days: number
    tags: string[]
    itineraries: {
        dayNumber: number
        title?: string
        overview?: string
        national_park_id?: string
        accommodation_id?: string
    }[]
}

export async function createTour(data: CreateTourData) {
    try {
        // 1. Create Tour
        const [newTour] = await db
            .insert(tours)
            .values({
                tourName: data.tourName,
                slug: data.slug, // Should generate if empty?
                overview: data.overview,
                pricing: data.pricing,
                country: data.country,
                sourceUrl: '', // Default empty string as it's required in DB but removed from form
                activities: data.activities,
                topFeatures: data.topFeatures,
                img_url: data.img_url,
                number_of_days: data.number_of_days,
                tags: data.tags,
            })
            .returning()

        // 2. Create Itinerary Days and Accommodations
        for (const day of data.itineraries) {
            const [newDay] = await db
                .insert(itineraryDays)
                .values({
                    tourId: newTour.id,
                    dayNumber: day.dayNumber,
                    dayTitle: day.title,
                    overview: day.overview,
                    national_park_id: day.national_park_id,
                })
                .returning()

            if (day.accommodation_id) {
                await db.insert(itineraryAccommodations).values({
                    itineraryDayId: newDay.id,
                    accommodationId: day.accommodation_id,
                })
            }
        }

        revalidatePath('/cms/tour-builder')
        return { success: true, tour: newTour }
    } catch (error) {
        console.error('Error creating tour:', error)
        return { success: false, error }
    }
}


export async function getAllTours(options?: {
    page?: number
    limit?: number
    query?: string
    country?: string
    minDays?: number
    maxDays?: number
}) {
    try {
        const page = options?.page || 1
        const limit = options?.limit || 15
        const offset = (page - 1) * limit

        const conditions = []

        if (options?.query) {
            conditions.push(ilike(tours.tourName, `%${options.query}%`))
        }

        if (options?.country && options.country !== 'all') {
            conditions.push(ilike(tours.country, `%${options.country}%`))
        }

        if (options?.minDays) {
            conditions.push(gte(tours.number_of_days, options.minDays))
        }

        if (options?.maxDays) {
            conditions.push(lte(tours.number_of_days, options.maxDays))
        }

        const whereClause = conditions.length > 0 ? and(...conditions) : undefined

        const [data, total] = await Promise.all([
            db.select({
                id: tours.id,
                tourName: tours.tourName,
                country: tours.country,
                pricing: tours.pricing,
                slug: tours.slug,
                updatedAt: tours.updatedAt,
                number_of_days: tours.number_of_days,
            })
            .from(tours)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(tours.updatedAt)),
            
            db.select({ count: sql<number>`count(*)` })
            .from(tours)
            .where(whereClause)
            .then(res => Number(res[0].count))
        ])

        return {
            tours: data,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        }
    } catch (error) {
        console.error('Error fetching all tours:', error)
        return {
            tours: [],
            pagination: {
                page: 1,
                limit: 15,
                total: 0,
                totalPages: 0
            }
        }
    }
}

export async function getTourById(id: string) {
    try {
        return await db.query.tours.findFirst({
            where: eq(tours.id, id),
            with: {
                days: {
                    with: {
                        itineraryAccommodations: true
                    },
                    orderBy: (days, { asc }) => [asc(days.dayNumber)],
                }
            }
        })
    } catch (error) {
        console.error('Error fetching tour by id:', error)
        return null
    }
}

export async function updateTour(id: string, data: CreateTourData) {
    try {
        // 1. Update Tour
        await db
            .update(tours)
            .set({
                tourName: data.tourName,
                slug: data.slug,
                overview: data.overview,
                pricing: data.pricing,
                country: data.country,
                activities: data.activities,
                topFeatures: data.topFeatures,
                img_url: data.img_url,
                number_of_days: data.number_of_days,
                tags: data.tags,
                updatedAt: new Date(),
            })
            .where(eq(tours.id, id))

        // 2. Delete existing itineraries and recreate them
        // This is a simple approach. For better performance/integrity, we could diff updates.
        // First, get all itinerary days for this tour
        const existingDays = await db.select({ id: itineraryDays.id }).from(itineraryDays).where(eq(itineraryDays.tourId, id))
        const dayIds = existingDays.map(d => d.id)

        // Delete accommodations for these days
        if (dayIds.length > 0) {
            await db.delete(itineraryAccommodations).where(sql`${itineraryAccommodations.itineraryDayId} IN ${dayIds}`)
        }
        
        // Delete days
        await db.delete(itineraryDays).where(eq(itineraryDays.tourId, id))

        // Re-create days and accommodations
        for (const day of data.itineraries) {
            const [newDay] = await db
                .insert(itineraryDays)
                .values({
                    tourId: id,
                    dayNumber: day.dayNumber,
                    dayTitle: day.title,
                    overview: day.overview,
                    national_park_id: day.national_park_id,
                })
                .returning()

            if (day.accommodation_id) {
                await db.insert(itineraryAccommodations).values({
                    itineraryDayId: newDay.id,
                    accommodationId: day.accommodation_id,
                })
            }
        }

        revalidatePath('/cms/tour-builder')
        revalidatePath('/cms/tours')
        return { success: true }
    } catch (error) {
        console.error('Error updating tour:', error)
        return { success: false, error }
    }
}
