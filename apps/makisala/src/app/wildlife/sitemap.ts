import type { MetadataRoute } from 'next'
import { db, nationalParks, wildlife, wildlifeParkOverrides } from '@/db'
import { eq, isNotNull } from 'drizzle-orm'
import { BASE_URL } from '@/lib/constants'

export default async function generateWildlifeSitemap(): Promise<MetadataRoute.Sitemap> {
    const sitemap: MetadataRoute.Sitemap = []

    // 1️⃣ Fetch all wildlife
    const allWildlife = await db.query.wildlife.findMany({
        columns: { name: true },
    })

    // 2️⃣ Fetch all overrides with linked parks
    const allOverrides = await db
        .select({
            animalName: wildlife.name,
            parkName: nationalParks.name,
        })
        .from(wildlife)
        .leftJoin(wildlifeParkOverrides, eq(wildlife.id, wildlifeParkOverrides.wildlife_id))
        .leftJoin(nationalParks, eq(wildlifeParkOverrides.national_park_id, nationalParks.id))
        .where(isNotNull(wildlifeParkOverrides.national_park_id))
        .execute()

    // 3️⃣ Add /wildlife/[animal]/[destination] URLs
    for (const override of allOverrides) {
        if (!override.parkName) continue // skip null parks
        const animalSlug = override.animalName.toLowerCase().replace(/\s+/g, '-')
        const parkSlug = override.parkName.toLowerCase().replace(/\s+/g, '-')
        sitemap.push({
            url: `${BASE_URL}/wildlife/${animalSlug}/${parkSlug}`,
            lastModified: new Date().toISOString(), // placeholder, could be wildlife.updatedAt
        })
    }

    return sitemap
}
