import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'

import { listAccommodationsForIndex } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'
import { BreadcrumbSchema } from '@/components/schema'

export const metadata: Metadata = {
    title: 'Safari Lodges & Camps | Makisala Safaris',
    description:
        'Browse safari lodges, tented camps, and hotels across Tanzania, Rwanda, and beyond. Hand-picked stays for every Makisala itinerary.',
    alternates: { canonical: `${BASE_URL}/accommodations` },
    openGraph: {
        title: 'Safari Lodges & Camps | Makisala Safaris',
        description:
            'Browse safari lodges, tented camps, and hotels across Tanzania, Rwanda, and beyond.',
        url: `${BASE_URL}/accommodations`,
    },
}

const OTHER = 'Other destinations'

export default async function AccommodationsIndex() {
    const rows = await listAccommodationsForIndex()

    const groups = new Map<string, typeof rows>()
    for (const row of rows) {
        const key = row.country?.trim() || OTHER
        const list = groups.get(key) ?? []
        list.push(row)
        groups.set(key, list)
    }

    const countryOrder = Array.from(groups.keys()).sort((a, b) => {
        if (a === OTHER) return 1
        if (b === OTHER) return -1
        return a.localeCompare(b)
    })

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                { name: 'Accommodations', url: `${BASE_URL}/accommodations` },
                            ],
                        })
                    ),
                }}
            />
            <div className="mx-auto max-w-7xl px-4 pt-28 pb-20 sm:px-6 lg:px-8">
                <header className="mb-12">
                    <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
                        Safari lodges &amp; camps
                    </h1>
                    <p className="mt-4 max-w-3xl text-lg text-gray-600">
                        Hand-picked stays we use across our safari itineraries. From luxury
                        tented camps on the Serengeti to intimate lodges near the gorillas of
                        Volcanoes National Park.
                    </p>
                </header>

                {countryOrder.map(country => {
                    const list = groups.get(country) ?? []
                    return (
                        <section key={country} className="mb-16">
                            <h2 className="font-heading mb-6 text-2xl font-bold text-gray-900">
                                {country}{' '}
                                <span className="text-base font-normal text-gray-500">
                                    ({list.length})
                                </span>
                            </h2>
                            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {list.map(a => (
                                    <li key={a.id}>
                                        <Link
                                            href={`/accommodations/${a.slug}`}
                                            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                                        >
                                            <div className="relative h-44 w-full bg-gray-100">
                                                {a.imageUrl ? (
                                                    <Image
                                                        src={a.imageUrl}
                                                        alt={a.name}
                                                        fill
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-heading text-base font-semibold text-gray-900 group-hover:text-amber-700">
                                                    {a.name}
                                                </h3>
                                                {a.overview && (
                                                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                                        {a.overview}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )
                })}
            </div>
        </>
    )
}
