import { BreadcrumbSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import Script from 'next/script'
import { notFound } from 'next/navigation'
import { countries, countryDescriptions } from '@/lib/p_seo_info'
import { getToursByCountry } from '@/lib/cms-service'
import ToursPage from './_components/tour-page'
import { Suspense } from 'react'
import Nav from './_components/Nav'

interface Params {
    params: {
        country: string
    }
}

export async function generateMetadata({ params }: Params) {
    const { country } = await params
    return {
        title: `${capitalize(country)} Safaris | Makisala Safaris`,
        description: `Discover the best safaris in ${capitalize(country)} offered by Makisala Safaris`,
    }
}

export async function generateStaticParams() {
    return countries.map(country => ({
        country,
    }))
}

export default async function Page({ params }: Params) {
    const { country } = await params
    const tours = await getToursByCountry(country)

    if (!tours) {
        return notFound()
    }
    return (
        <main>
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema-tours">
                {JSON.stringify([
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
                ])}
            </Script>
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
                    <Suspense>
                        <ToursPage initialCountry={country} />
                    </Suspense>
                </div>
            </section>
        </main>
    )
}
