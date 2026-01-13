'use server'

import { accommodations, accommodationImages, db } from '@repo/db'
import { and, desc, eq, ilike, inArray, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { uploadToStorage } from '@/lib/storage'
import { compressImage, replaceExtension } from '@/lib/image-utils'

export async function getAccommodations(options?: {
    query?: string
    page?: number
    limit?: number
}) {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const offset = (page - 1) * limit

    const conditions = []
    if (options?.query) {
        conditions.push(ilike(accommodations.name, `%${options.query}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [data, total] = await Promise.all([
        db
            .select()
            .from(accommodations)
            .where(whereClause)
            .limit(limit)
            .offset(offset)
            .orderBy(desc(accommodations.name)),
        db
            .select({ count: sql<number>`count(*)` })
            .from(accommodations)
            .where(whereClause)
            .then(res => Number(res[0]?.count || 0)),
    ])

    // Fetch images for these accommodations
    const accIds = data.map(acc => acc.id)
    const images = accIds.length > 0 
        ? await db.select().from(accommodationImages).where(inArray(accommodationImages.accommodationId, accIds))
        : []

    const accommodationsWithImages = data.map(acc => ({
        ...acc,
        images: images.filter(img => img.accommodationId === acc.id),
    }))

    return {
        accommodations: accommodationsWithImages,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    }
}

export async function getAccommodationById(id: string) {
    if (!id || typeof id !== 'string') {
        return null
    }

    try {
        const [acc] = await db
            .select()
            .from(accommodations)
            .where(eq(accommodations.id, id))
            .limit(1)

        if (!acc) return null

        const images = await db
            .select()
            .from(accommodationImages)
            .where(eq(accommodationImages.accommodationId, id))

        return {
            ...acc,
            images,
        }
    } catch (error) {
        console.error('Database error in getAccommodationById:', error)
        return null
    }
}

export async function createAccommodation(data: {
    name: string
    url?: string
    overview?: string
    description?: string
    latitude?: string
    longitude?: string
    images?: { name: string; type: string; base64: string }[]
}) {
    const [newAcc] = await db
        .insert(accommodations)
        .values({
            name: data.name,
            url: data.url,
            overview: data.overview,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
        })
        .returning()

    if (!newAcc) {
        throw new Error('Failed to create accomodation')
    }

    if (data.images && data.images.length > 0) {
        for (const img of data.images) {
            const rawBuffer = Buffer.from(img.base64, 'base64')
            // Compress image to WebP format
            const compressed = await compressImage(rawBuffer)
            const compressedName = replaceExtension(img.name, compressed.extension)
            const key = `accommodations/${newAcc.id}/${Date.now()}-${compressedName}`
            const { bucket, key: storageKey, publicUrl } = await uploadToStorage({
                file: compressed.buffer,
                contentType: compressed.contentType,
                key,
                visibility: 'public',
            })

            await db.insert(accommodationImages).values({
                accommodationId: newAcc.id,
                bucket,
                key: storageKey,
            })
        }
    }

    revalidatePath('/accomodations')
    return { success: true, id: newAcc.id }
}

export async function updateAccommodation(
    id: string,
    data: {
        name: string
        url?: string
        overview?: string
        description?: string
        latitude?: string
        longitude?: string
        newImages?: { name: string; type: string; base64: string }[]
        removedImageIds?: string[]
    }
) {
    await db
        .update(accommodations)
        .set({
            name: data.name,
            url: data.url,
            overview: data.overview,
            description: data.description,
            latitude: data.latitude,
            longitude: data.longitude,
        })
        .where(eq(accommodations.id, id))

    if (data.removedImageIds && data.removedImageIds.length > 0) {
        await db.delete(accommodationImages).where(
            and(
                eq(accommodationImages.accommodationId, id),
                sql`${accommodationImages.id} IN ${data.removedImageIds}`
            )
        )
    }

    if (data.newImages && data.newImages.length > 0) {
        for (const img of data.newImages) {
            const rawBuffer = Buffer.from(img.base64, 'base64')
            // Compress image to WebP format
            const compressed = await compressImage(rawBuffer)
            const compressedName = replaceExtension(img.name, compressed.extension)
            const key = `accommodations/${id}/${Date.now()}-${compressedName}`
            const { bucket, key: storageKey } = await uploadToStorage({
                file: compressed.buffer,
                contentType: compressed.contentType,
                key,
                visibility: 'public',
            })

            await db.insert(accommodationImages).values({
                accommodationId: id,
                bucket,
                key: storageKey,
            })
        }
    }

    revalidatePath('/accomodations')
    revalidatePath(`/accomodations/${id}/edit`)
    return { success: true }
}

export async function deleteAccommodation(id: string) {
    await db.delete(accommodations).where(eq(accommodations.id, id))
    revalidatePath('/accomodations')
    return { success: true }
}
