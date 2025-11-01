import { duffel } from '@/lib/duffel'
import PropertyDetails from '@/app/stays/[destination]/[propertyName]/_components/PropertyDetails'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

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
    const { propertyName } = await params

    const id = propertyName.split('-').pop()

    if (!id) {
        return notFound()
    }
    const { data } = await duffel.stays.accommodation.get(id)
    const { data: reviews } = await duffel.stays.accommodation.reviews(id)

    return (
        <main>
            <PropertyDetails propertyData={data} reviews={reviews.reviews} />
        </main>
    )
}
