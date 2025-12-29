import { duffel } from '@/lib/duffel'
import PropertyDetails from './_components/PropertyDetails'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AccomodationSchema, BreadcrumbSchema } from '@/components/schema'
import Script from 'next/script'
import { BASE_URL } from '@/lib/constants'
import { slugify } from '@/lib/utils'

interface IParams {
    params: {
        destination: string
        propertyName: string
    }
}

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    const { destination, propertyName } = await params

    const id = propertyName.split('-').pop()

    if (!id) {
        return notFound()
    }
    const { data } = await duffel.stays.accommodation.get(id)

    return {
        title: `${data.name} | Best Stays in ${destination}`,
        description: `Stay at ${data.name} in ${destination}. Explore top-rated stays, compare prices, and plan your perfect trip to ${destination}.`,
        openGraph: {
            title: `${data.name} – Stay in ${destination}`,
            description: `Stay at ${data.name} in ${destination}. Explore top-rated stays, compare prices, and plan your perfect trip to ${destination}.`,
            images: data.photos && data.photos[0].url,
        },
    }
}

export default async function Page({ params }: IParams) {
    const { destination, propertyName } = await params

    const id = propertyName.split('-').pop()

    if (!id) {
        return notFound()
    }
    const { data } = await duffel.stays.accommodation.get(id)
    const { data: reviews } = await duffel.stays.accommodation.reviews(id)

    return (
        <main>
            <Script type="application/ld+json" strategy="lazyOnload" id="schema-script">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `Best Stays in ${destination}`,
                                url: `${BASE_URL}/stays/${destination}`,
                            },
                            {
                                name: data.name,
                                url: `${BASE_URL}/stays/${destination}/${slugify(data.name)}-${data.id}`,
                            },
                        ],
                    }),
                    AccomodationSchema({
                        name: data.name,
                        description: data.description || '',
                        telephone: data.phone_number || '',
                        url: `${BASE_URL}/stays/${destination}/${slugify(data.name)}-${data.id}`,
                        location: data.location,
                        ratings: data.ratings,
                        review_count: data.review_count || 100,
                        amenities: data.amenities,
                    }),
                ])}
            </Script>
            <PropertyDetails propertyData={data} reviews={reviews.reviews} />
        </main>
    )
}
