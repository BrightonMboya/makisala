import { destinationCoordinates } from '@/app/stays/_components/data'
import type { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/constants'
import { duffel } from '@/lib/duffel'
import { slugify } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const urls: MetadataRoute.Sitemap = []

    for (const key of Object.keys(destinationCoordinates)) {
        urls.push({
            url: `${BASE_URL}/stays/${key}`,
            priority: 0.9,
            changeFrequency: 'weekly',
        })
    }

    await Promise.all(
        Object.keys(destinationCoordinates).map(async (key) => {
            const coordinates =
                destinationCoordinates[
                    key as keyof typeof destinationCoordinates
                ]
            const { data } = await duffel.stays.accommodation.list({
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                radius: 20,
                limit: 12,
            })

            data.forEach((stay) => {
                const slug = slugify(stay.name)

                urls.push({
                    url: `${BASE_URL}/stays/${key}/${slug}-${stay.id}`,
                    priority: 0.8,
                    changeFrequency: 'weekly',
                })
            })
        }),
    )

    return urls
}
