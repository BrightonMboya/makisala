import { db } from '@/db'
import {
    accommodationImages,
    accommodations,
    itineraryAccommodations,
    itineraryDays,
    tours,
} from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { v2 as cloudinary } from 'cloudinary'
import type { TourData } from '@/app/scraper/_components/types'
import crypto from 'crypto'
import { env } from '@/lib/env'

const firecrawl_schema = {
    type: 'object',
    required: [],
    properties: {
        price: {
            type: 'number',
        },
        tour_name: {
            type: 'string',
        },
        country: {
            type: 'string',
        },
        source_url: {
            type: 'string',
        },
        img_url: {
            type: 'string',
        },
        overview: {
            type: 'string',
        },
        itinerary: {
            type: 'array',
            items: {
                type: 'object',
                required: [],
                properties: {
                    itinerary_day_title: {
                        type: 'string',
                    },
                    overview: {
                        type: 'string',
                    },
                    day_number: {
                        type: 'number',
                    },
                    accomodation: {
                        type: 'object',
                        required: [],
                        properties: {
                            accomodation_name: {
                                type: 'string',
                            },
                            accomodation_url: {
                                type: 'string',
                            },
                            accomodation_overview: {
                                type: 'string',
                            },
                            img_urls: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    required: [],
                                    properties: {
                                        img_url: {
                                            type: 'string',
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        activities: {
            type: 'array',
            items: {
                type: 'object',
                required: [],
                properties: {
                    activity_name: {
                        type: 'string',
                    },
                },
            },
        },
        top_features: {
            type: 'array',
            items: {
                type: 'object',
                required: [],
                properties: {
                    title: {
                        type: 'string',
                    },
                    description: {
                        type: 'string',
                    },
                },
            },
        },
        number_of_days: {
            type: 'number',
        },
    },
}
const firecrwal_prompt = `extract the tour information from this url, on the overview (both the itinerary_overview and the overall overview)  make sure its at least a paragraph, add as much context as you can on the overview as the user needs to know wheat they will do. the data is meant to be used to create a travel marketplace`

// ---- Cloudinary init ----
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
})

/**
 * Inserts a tour with itinerary & accommodations.
 * - Dedupes accommodations by (name, url)
 * - Uploads accommodation images to Cloudinary (folder: "accomodations/<slug>")
 * - Links days to accommodations via itinerary_accommodations
 */

// ---- saveTourData.ts ----
export async function saveTourData(tour: TourData) {
    return db.transaction(async (tx) => {
        // 1) Insert tour

        let coverUrl: string | null = null
        if (tour.img_url) {
            coverUrl = await uploadTourCoverImage(tour.img_url)
        }
        const [tourRow] = await tx
            .insert(tours)
            .values({
                tourName: tour.tourName,
                overview: tour.overview ?? null,
                pricing: tour.pricing != null ? String(tour.pricing) : null,
                country: tour.country ?? null,
                sourceUrl: tour.sourceUrl ?? null,
                activities: tour.activities?.length ? tour.activities : null,
                topFeatures: tour.topFeatures?.length ? tour.topFeatures : null,
                img_url: coverUrl,
                number_of_days: tour.number_of_days,
            })
            .returning()

        // 2) Itinerary & accommodations
        const accomCache = new Map<string, string>()

        for (const day of tour.itinerary ?? []) {
            // 2a) Insert itinerary day
            const [dayRow] = await tx
                .insert(itineraryDays)
                .values({
                    tourId: tourRow.id,
                    dayNumber: day.day_number,
                    dayTitle: day.itinerary_day_title ?? null,
                    overview: day.overview ?? null,
                })
                .returning()

            // 2b) Handle accommodation
            const rawName = day.accomodation?.accomodation_name?.trim() || ''
            const rawUrl = day.accomodation?.accomodation_url?.trim() || ''
            const accomOverview = day.accomodation?.overview ?? null
            const accomKey = `${rawName}|||${rawUrl}`

            let accomId = accomCache.get(accomKey)

            if (!accomId) {
                // Try existing by (name, url)
                const existing = await tx
                    .select()
                    .from(accommodations)
                    .where(
                        and(
                            eq(accommodations.name, rawName),
                            eq(accommodations.url, rawUrl),
                        ),
                    )
                    .limit(1)

                if (existing.length) {
                    accomId = existing[0].id

                    // If it exists but has no images, upload from this payload
                    const existingImgs = await tx
                        .select()
                        .from(accommodationImages)
                        .where(eq(accommodationImages.accommodationId, accomId))

                    if (
                        existingImgs.length === 0 &&
                        day.accomodation?.img_urls?.length
                    ) {
                        await uploadAccommodationImages(
                            tx,
                            accomId,
                            rawName,
                            day.accomodation.img_urls,
                        )
                    }
                } else {
                    // Create accommodation with overview
                    const [createdAccom] = await tx
                        .insert(accommodations)
                        .values({
                            name: rawName,
                            url: rawUrl || null,
                            overview: accomOverview,
                        })
                        .returning()

                    accomId = createdAccom.id

                    // Upload images for this new accommodation
                    if (day.accomodation?.img_urls?.length) {
                        await uploadAccommodationImages(
                            tx,
                            accomId,
                            rawName,
                            day.accomodation.img_urls,
                        )
                    }
                }

                accomCache.set(accomKey, accomId!)
            }

            // 2c) Link day <-> accommodation
            await tx.insert(itineraryAccommodations).values({
                itineraryDayId: dayRow.id,
                accommodationId: accomId!,
            })
        }

        return tourRow
    })
}

// ---- utilities.ts ----
function slugify(str: string) {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
}

function hashUrl(url: string) {
    return crypto.createHash('md5').update(url).digest('hex')
}

async function uploadAccommodationImages(
    tx: any,
    accommodationId: string,
    rawName: string,
    images: { image_url: string }[],
) {
    if (!images || images.length === 0) return []

    // Fetch existing images in DB for dedupe
    const existingImgs = await tx
        .select()
        .from(accommodationImages)
        .where(eq(accommodationImages.accommodationId, accommodationId))

    const existingUrls = new Set(existingImgs.map((img) => img.imageUrl))
    const uploadedImgs = []

    for (const img of images) {
        if (!img.image_url || existingUrls.has(img.image_url)) continue

        const publicId = `${slugify(rawName)}/${hashUrl(img.image_url)}`

        const res = await cloudinary.uploader.upload(img.image_url, {
            folder: `accommodations/${slugify(rawName)}`,
            public_id: publicId,
            unique_filename: false,
            overwrite: false, // don’t replace if same public_id already exists
        })

        const [newImg] = await tx
            .insert(accommodationImages)
            .values({
                accommodationId,
                imageUrl: res.secure_url,
                publicId: res.public_id,
            })
            .returning()

        uploadedImgs.push(newImg)
    }

    return uploadedImgs
}

async function uploadTourCoverImage(imageUrl: string) {
    if (!imageUrl) return null

    // Use a common folder for all tour cover images
    const publicId = hashUrl(imageUrl) // ensures unique filename

    const res = await cloudinary.uploader.upload(imageUrl, {
        folder: `tours_cover_images`,
        public_id: publicId,
        unique_filename: false,
        overwrite: false, // skip if image already exists
    })

    return res.secure_url
}
