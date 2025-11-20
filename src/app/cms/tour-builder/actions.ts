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
