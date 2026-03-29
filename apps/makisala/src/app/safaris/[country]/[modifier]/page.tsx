import { getTours } from '@/lib/cms-service'
import TourCard from './_components/TourCard'
import { countries, modifiers, safariDescriptions } from '@/lib/p_seo_info'
import { capitalize } from '@/lib/utils'
import { BreadcrumbSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { notFound } from 'next/navigation'
import { type Metadata } from 'next'

interface Params {
    params: {
        country: string
        modifier: string
    }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { country, modifier } = await params
    const title = `${capitalize(modifier.replace('-', ' '))} ${capitalize(country)} safaris | Makisala Safaris`
    const descriptionKey = `${country}-${modifier}`
    const description =
        safariDescriptions[descriptionKey] ||
        `Discover the best ${modifier.replace('-', ' ')} safari tours in ${country}. Tailored itineraries, expert guides, and unforgettable adventures.`
    const ogImages: Record<string, string> = {
        tanzania: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1763039383/Serengeti-Wildebeest-Migration-Safari-10-Days-750x450_lflnpq.jpg',
        rwanda: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1763798673/volcanoes-national-park-750x450_wfupyl.jpg',
    }
    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: ogImages[country]
                ? [{ url: ogImages[country], width: 1200, height: 630, alt: title }]
                : [],
        },
    }
}

export async function generateStaticParams() {
    return countries.flatMap(country => modifiers.map(modifier => ({ country, modifier })))
}

export default async function SafariPage({ params }: Params) {
    const { country, modifier } = await params
    if (!countries.includes(country) || !modifiers.includes(modifier)) {
        return notFound()
    }
    const [tours] = await Promise.all([
        getTours(country, modifier),
    ])

    const descriptionKey = `${country}-${modifier}`
    const description = safariDescriptions[descriptionKey]

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                { name: 'All Safaris', url: `${BASE_URL}/safaris` },
                                {
                                    name: `All ${capitalize(country)} Safaris`,
                                    url: `${BASE_URL}/safaris/${country}`,
                                },
                                {
                                    name: `${modifier} ${capitalize(country)} Safaris`,
                                    url: `${BASE_URL}/safaris/${country}/${modifier}`,
                                },
                            ],
                        }),
                    ]),
                }}
            />
            <main className="mt-[60px]">
                <div className="bg-background min-h-screen">
                    <div className="from-safari-gold/10 to-safari-bronze/10 border-border border-b bg-gradient-to-r">
                        <div className="container mx-auto px-4 py-8">
                            <h1 className="text-safari-earth mb-2 text-4xl font-bold">{`${capitalize(modifier.replace('-', ' '))} ${capitalize(country)}  Safaris`}</h1>
                            {description && (
                                <p className="text-muted-foreground max-w-3xl text-lg leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Tours Grid */}
                    <div className="container mx-auto px-4 py-8">
                        {tours.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {tours.map(tour => (
                                    <TourCard key={tour.id} tour={tour} />
                                ))}
                            </div>
                        ) : (
                            <div className="py-16 text-center">
                                <p className="text-lg text-gray-600">
                                    No {modifier.replace('-', ' ')} safaris in {capitalize(country)} available right now.
                                </p>
                                <p className="mt-2 text-gray-500">
                                    Contact us for a custom itinerary tailored to your needs.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    )
}
