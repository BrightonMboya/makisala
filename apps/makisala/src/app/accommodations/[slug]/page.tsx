import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

import {
    getAccommodationBySlug,
    getToursFeaturingAccommodation,
} from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'
import {
    BreadcrumbSchema,
    LodgingBusinessSchema,
} from '@/components/schema'
import { InquiryDialog } from '@/components/enquire-dialog-button'
import { Button } from '@repo/ui/button'
import ImageCard from '@/components/home/image-card'
import C2A from '@/components/home/call-to-action'
import AccommodationGallery from './_components/AccommodationGallery'

interface Params {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { slug } = await params
    const accommodation = await getAccommodationBySlug(slug)
    if (!accommodation) {
        return { title: 'Accommodation not found | Makisala Safaris' }
    }

    const description = truncate(
        accommodation.enhancedDescription ||
            accommodation.overview ||
            accommodation.description ||
            `Stay at ${accommodation.name} on your Makisala safari.`,
        160
    )
    const image = accommodation.images[0]?.imageUrl

    return {
        title: `${accommodation.name} | Makisala Safaris`,
        description,
        alternates: { canonical: `${BASE_URL}/accommodations/${slug}` },
        openGraph: {
            title: `${accommodation.name} | Makisala Safaris`,
            description,
            url: `${BASE_URL}/accommodations/${slug}`,
            images: image ? [{ url: image, alt: accommodation.name }] : [],
        },
    }
}

export default async function Page({ params }: Params) {
    const { slug } = await params
    const accommodation = await getAccommodationBySlug(slug)
    if (!accommodation) notFound()

    const relatedTours = await getToursFeaturingAccommodation(accommodation.id)
    const url = `${BASE_URL}/accommodations/${slug}`
    const amenityItems = (accommodation.amenities || []).flatMap(a => a.items).slice(0, 20)

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                { name: 'Accommodations', url: `${BASE_URL}/accommodations` },
                                { name: accommodation.name, url },
                            ],
                        }),
                        LodgingBusinessSchema({
                            name: accommodation.name,
                            description:
                                accommodation.enhancedDescription ||
                                accommodation.overview ||
                                accommodation.description ||
                                '',
                            image: accommodation.images.map(i => i.imageUrl).slice(0, 8),
                            url,
                            country: accommodation.country || undefined,
                            latitude: accommodation.latitude || undefined,
                            longitude: accommodation.longitude || undefined,
                            amenityFeatures: amenityItems,
                        }),
                    ]),
                }}
            />

            <div className="mx-auto max-w-7xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
                <nav className="mb-4 text-sm text-gray-500">
                    <Link href="/" className="hover:underline">
                        Home
                    </Link>
                    <span className="mx-2">/</span>
                    <Link href="/accommodations" className="hover:underline">
                        Accommodations
                    </Link>
                    {accommodation.country && (
                        <>
                            <span className="mx-2">/</span>
                            <span>{accommodation.country}</span>
                        </>
                    )}
                </nav>

                <header className="mb-6">
                    <h1 className="font-heading text-4xl font-bold text-gray-900 md:text-5xl">
                        {accommodation.name}
                    </h1>
                    {accommodation.country && (
                        <p className="mt-2 text-lg text-gray-600">{accommodation.country}</p>
                    )}
                </header>

                <AccommodationGallery
                    images={accommodation.images}
                    accommodationName={accommodation.name}
                />

                <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
                    <article className="space-y-12">
                        {(accommodation.enhancedDescription ||
                            accommodation.overview ||
                            accommodation.description) && (
                            <section>
                                <h2 className="font-heading mb-4 text-2xl font-bold">About this stay</h2>
                                <div className="space-y-4 text-gray-700 whitespace-pre-line leading-relaxed">
                                    {accommodation.enhancedDescription ||
                                        accommodation.overview ||
                                        accommodation.description}
                                </div>
                            </section>
                        )}

                        {accommodation.locationHighlights &&
                            accommodation.locationHighlights.length > 0 && (
                                <section>
                                    <h2 className="font-heading mb-4 text-2xl font-bold">
                                        Location highlights
                                    </h2>
                                    <ul className="grid gap-2 md:grid-cols-2">
                                        {accommodation.locationHighlights.map((h, i) => (
                                            <li
                                                key={i}
                                                className="flex gap-2 text-gray-700"
                                            >
                                                <span className="text-amber-600">•</span>
                                                <span>{h}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </section>
                            )}

                        {accommodation.amenities && accommodation.amenities.length > 0 && (
                            <section>
                                <h2 className="font-heading mb-4 text-2xl font-bold">Amenities</h2>
                                <div className="grid gap-6 md:grid-cols-2">
                                    {accommodation.amenities.map((group, i) => (
                                        <div key={i}>
                                            <h3 className="mb-2 font-semibold text-gray-900">
                                                {group.category}
                                            </h3>
                                            <ul className="space-y-1 text-gray-700">
                                                {group.items.map((item, j) => (
                                                    <li key={j} className="flex gap-2">
                                                        <span className="text-amber-600">✓</span>
                                                        <span>{item}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {accommodation.roomTypes && accommodation.roomTypes.length > 0 && (
                            <section>
                                <h2 className="font-heading mb-4 text-2xl font-bold">
                                    Rooms &amp; suites
                                </h2>
                                <div className="space-y-4">
                                    {accommodation.roomTypes.map((room, i) => (
                                        <div
                                            key={i}
                                            className="rounded-lg border border-gray-200 p-5"
                                        >
                                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                                                <h3 className="font-heading text-xl font-semibold">
                                                    {room.name}
                                                </h3>
                                                {room.capacity && (
                                                    <span className="text-sm text-gray-600">
                                                        {room.capacity}
                                                    </span>
                                                )}
                                            </div>
                                            {room.description && (
                                                <p className="mt-2 text-gray-700">
                                                    {room.description}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </article>

                    <aside className="lg:sticky lg:top-24 lg:self-start">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="font-heading mb-2 text-xl font-bold">
                                Plan a stay here
                            </h3>
                            <p className="mb-4 text-sm text-gray-600">
                                Our team can build a custom safari itinerary that includes{' '}
                                {accommodation.name}.
                            </p>
                            <InquiryDialog>
                                <Button size="lg" className="w-full">
                                    Enquire now
                                </Button>
                            </InquiryDialog>
                        </div>
                    </aside>
                </div>

                {relatedTours.length > 0 && (
                    <section className="mt-20">
                        <h2 className="font-heading mb-6 text-3xl font-bold">
                            Safaris that include {accommodation.name}
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                            {relatedTours.map(tour => (
                                <Link key={tour.id} href={`/tours/${tour.slug}`}>
                                    <ImageCard
                                        title={tour.tourName}
                                        img_url={tour.img_url || '/placeholder.svg'}
                                        alt={tour.tourName}
                                        description={tour.overview}
                                        truncate
                                    />
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </div>
            <C2A />
        </>
    )
}

function truncate(s: string, n: number) {
    if (s.length <= n) return s
    return s.slice(0, n - 3).replace(/\s+\S*$/, '') + '...'
}
