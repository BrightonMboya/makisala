import { duffel } from '@/lib/duffel'
import Stay from '@/app/stays/_components/Stay'
import { destinationCoordinates } from '@/app/stays/_components/data'
import { slugify } from '@/lib/utils'
import Link from 'next/link'

interface IParams {
    params: {
        destination: string
    }
}

export async function generateMetadata({ params }: IParams): Promise<any> {
    const { destination } = await params
    const coordinates =
        destinationCoordinates[destination.toLowerCase() as keyof typeof destinationCoordinates]

    if (!coordinates) {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        }
    }

    return {
        title: `Best places to stay in ${coordinates.name}`,
        destination: `Find best places to stay in ${coordinates.name} and compare rates, and plan your trip accordingly`,
        openGraph: {
            title: `Best places to stay in ${coordinates.name}`,
            destination: `Find best places to stay in ${coordinates.name} and compare rates, and plan your trip accordingly`,
            images: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759052000/097c409587dd45988315dbbeabe0e603_hcmxv5.jpg',
        },
    }
}

export default async function Page({ params }: IParams) {
    const { destination } = await params
    const coordinates =
        destinationCoordinates[destination.toLowerCase() as keyof typeof destinationCoordinates]

    if (!coordinates) {
        return (
            <main className="mt-[100px] text-center">
                <h1 className="text-3xl font-semibold mb-4">Destination not found</h1>
                <p className="text-gray-600">
                    Sorry, we don’t have data for <strong>{destination}</strong> yet.
                </p>
            </main>
        )
    }

    const { data } = await duffel.stays.accommodation.list({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        radius: 20,
        limit: 12,
    })

    return (
        <main className="mt-[100px]">
            <h1 className="font-bold text-xl lg:text-3xl text-center pb-10">{`Best Places to Stay in ${coordinates.name}`}</h1>
            <section className="grid grid-cols-1 container mx-auto px-4 lg:grid-cols-3 gap-10 mb-10">
                {data.map(stay => (
                    <Link
                        href={`/stays/${destination}/${slugify(stay.name)}-${stay.id}`}
                        key={stay.id}
                    >
                        <Stay stay={stay} />
                    </Link>
                ))}
            </section>
        </main>
    )
}
