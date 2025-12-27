import { v2 as cloudinary } from 'cloudinary'
import { env } from './env'
import { accommodationImages, db } from '@repo/db'
import { eq } from 'drizzle-orm'
import { hashUrl, slugify } from './utils'

cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME!,
    api_key: env.CLOUDINARY_API_KEY!,
    api_secret: env.CLOUDINARY_API_SECRET!,
})

export async function getImagesInFolder(folderName: string) {
    try {
        const res = await cloudinary.api.resources_by_asset_folder(folderName, {})

        return res.resources.map(r => ({
            public_id: r.public_id,
            url: r.secure_url,
            format: r.format,
            width: r.width,
            height: r.height,
        }))
    } catch (err) {
        console.error('Cloudinary fetch error:', err)
        return []
    }
}

export async function uploadAccommodationImages(
    accommodationId: string,
    rawName: string,
    images: { image_url: string }[]
) {
    if (!images || images.length === 0) return []

    // Fetch existing images in DB for dedupe, to avoid same urls of imgs in the db
    const existingImgs = await db
        .select()
        .from(accommodationImages)
        .where(eq(accommodationImages.accommodationId, accommodationId))

    const existingUrls = new Set(existingImgs.map(img => img.imageUrl))
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

        const [newImg] = await db
            .insert(accommodationImages)
            .values({
                accommodationId,
                imageUrl: res.secure_url,
            })
            .returning()

        uploadedImgs.push(newImg)
    }

    return uploadedImgs
}

export async function uploadTourCoverImage(imageUrl: string) {
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

export default cloudinary
