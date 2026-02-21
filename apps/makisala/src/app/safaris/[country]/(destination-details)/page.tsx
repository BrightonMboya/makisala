import { BreadcrumbSchema, TouristDestinationSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import { notFound } from 'next/navigation'
import { countries, countryDescriptions } from '@/lib/p_seo_info'
import { getToursByCountry, fetchAllNps } from '@/lib/cms-service'
import ToursPage from './_components/tour-page'
import { Suspense } from 'react'
import Nav from './_components/Nav'
import Link from 'next/link'

interface Params {
    params: {
        country: string
    }
}

const countryOgImages: Record<string, string> = {
    tanzania: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1763039383/Serengeti-Wildebeest-Migration-Safari-10-Days-750x450_lflnpq.jpg',
    kenya: 'https://images.unsplash.com/photo-1612433085547-c2d550c90210?w=1200&auto=format&fit=crop&q=80',
    rwanda: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1763798673/volcanoes-national-park-750x450_wfupyl.jpg',
    zanzibar: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366308/honeymoon-safaris-tanzania_wsl3ys.jpg',
}

export async function generateMetadata({ params }: Params) {
    const { country } = await params
    return {
        title: `${capitalize(country)} Safaris | Makisala Safaris`,
        description: `Discover the best safaris in ${capitalize(country)} offered by Makisala Safaris`,
        openGraph: {
            title: `${capitalize(country)} Safaris | Makisala Safaris`,
            description: `Discover the best safaris in ${capitalize(country)} offered by Makisala Safaris`,
            images: countryOgImages[country] ? [{ url: countryOgImages[country], width: 1200, height: 630, alt: `${capitalize(country)} Safaris` }] : undefined,
        },
    }
}

export async function generateStaticParams() {
    return countries.map(country => ({
        country,
    }))
}

export default async function Page({ params }: Params) {
    const { country } = await params
    const [tours, allParks] = await Promise.all([
        getToursByCountry(country),
        fetchAllNps(),
    ])
    const countryParks = allParks.filter(p => p.country === country)

    if (!tours) {
        return notFound()
    }
    return (
        <main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            { name: 'All Safaris', url: `${BASE_URL}/safaris` },
                            {
                                name: `All ${capitalize(country)} Safaris`,
                                url: `${BASE_URL}/safaris/${country}`,
                            },
                        ],
                    }),
                    TouristDestinationSchema({
                        name: `${capitalize(country)} Safaris`,
                        description: countryDescriptions[country] || `Discover the best safaris in ${capitalize(country)} offered by Makisala Safaris`,
                        image: countryOgImages[country] || '',
                        url: `${BASE_URL}/safaris/${country}`,
                        country: country.toUpperCase().slice(0, 2),
                    }),
            ]) }} />
            <section className="lg:mt-[60px]">
                <Nav country={country} />
                <div className="min-h-screen">
                    <div className="from-safari-gold/10 to-safari-bronze/10 border-border border-b bg-gradient-to-r">
                        <div className="container mx-auto px-4 py-8">
                            <h1 className="text-safari-earth mb-2 text-4xl font-bold">{`${capitalize(country)} Safaris`}</h1>
                            <p className="text-muted-foreground">
                                {countryDescriptions[`${country}`]}
                            </p>
                        </div>
                    </div>
                    {countryParks.length > 0 && (
                        <div className="container mx-auto px-4 py-8">
                            <h2 className="mb-4 text-2xl font-bold">{`National Parks in ${capitalize(country)}`}</h2>
                            <div className="flex flex-wrap gap-3">
                                {countryParks.map(p => (
                                    <Link
                                        key={p.name}
                                        href={`/national-parks/${p.name}`}
                                        className="bg-card hover:bg-primary/10 border-border rounded-full border px-5 py-2 text-sm font-medium transition-colors"
                                    >
                                        {capitalize(p.name)}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                    <Suspense>
                        <ToursPage initialCountry={country} />
                    </Suspense>
                </div>
            </section>
        </main>
    )
}
