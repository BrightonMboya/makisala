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
    const description = `Discover the best ${modifier.replace('-', ' ')} safari tours in ${country}. Tailored itineraries, expert guides, and unforgettable adventures.`
    return {
        title,
        description,
        openGraph: {
            title,
            description,
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
        // fetchAllNps(),
    ])
    // const countryParks = allParks.filter(p => p.country === country)

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
                            <p className="text-muted-foreground">
                                {safariDescriptions[`${country}-${modifier}`]}
                            </p>
                        </div>
                    </div>

                    {/*{countryParks.length > 0 && (*/}
                    {/*    <div className="container mx-auto px-4 py-6">*/}
                    {/*        <h2 className="mb-3 text-lg font-semibold">{`Explore ${capitalize(country)} National Parks`}</h2>*/}
                    {/*        <div className="flex flex-wrap gap-2">*/}
                    {/*            {countryParks.map(p => (*/}
                    {/*                <Link*/}
                    {/*                    key={p.name}*/}
                    {/*                    href={`/national-parks/${p.name}`}*/}
                    {/*                    className="bg-card hover:bg-primary/10 border-border rounded-full border px-4 py-1.5 text-sm font-medium transition-colors"*/}
                    {/*                >*/}
                    {/*                    {capitalize(p.name)}*/}
                    {/*                </Link>*/}
                    {/*            ))}*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {/* Tours Grid */}
                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {tours.map(tour => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}
