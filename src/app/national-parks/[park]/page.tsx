import { IParams } from '@/app/national-parks/[park]/type'
import { getNPInfo } from '@/lib/cms-service'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import {
    BreadcrumbSchema,
    ParkSchema,
    TouristAttractionSchema,
    TouristDestinationSchema,
} from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import type { Metadata } from 'next'
import { NavigationSidebar } from '@/app/national-parks/_components/navigation'
import TourCard from '@/app/safaris/[country]/[modifier]/_components/TourCard'

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    const { park } = await params
    const { page } = await getNPInfo(park, 'overview_page_id')

    if (!page) {
        return {
            title: 'Page not found',
            description: 'The requested page could not be found.',
        }
    }

    return {
        title: page.meta_title,
        description: page.meta_description,
        openGraph: {
            title: page.title,
            description: page.meta_description!,
            images: page.featured_image_url!,
        },
    }
}

export default async function page({ params }: IParams) {
    const { park } = await params
    const { park: np, page, tours } = await getNPInfo(park, 'overview_page_id')

    if (!page) {
        return notFound()
    }

    return (
        <main>
            <Script
                type={'application/ld+json'}
                strategy={'lazyOnload'}
                id="schema-script"
            >
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `${capitalize(np.country)} National Parks`,
                                url: `${BASE_URL}/safaris/${np.country}/where-to-go`,
                            },
                            {
                                name: `${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/safaris/${np.name}/`,
                            },
                            {
                                name: `Best time to visit ${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/national-parks/${np.name}/`,
                            },
                        ],
                    }),
                    TouristDestinationSchema({
                        name: capitalize(np.name),
                        description: page.meta_description || '',
                        url: `${BASE_URL}/national-parks/${np.name}/`,
                        image: page.featured_image_url!,
                        country: capitalize(np.country),
                    }),
                    TouristAttractionSchema({
                        name: capitalize(np.name),
                        description: page.meta_description || '',
                        image: page.featured_image_url!,
                        url: `${BASE_URL}/national-parks/${np.name}/`,
                    }),
                    ParkSchema({
                        name: capitalize(np.name),
                        description: page.meta_description || '',
                        image: page.featured_image_url!,
                        url: `${BASE_URL}/national-parks/${np.name}/`,
                        address: {
                            addressCountry: capitalize(np.country),
                        },
                    }),
                ])}
            </Script>

            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat object-cover"
                    style={{
                        backgroundImage: `url(${page.featured_image_url})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="relative flex h-full items-end">
                    <div className="container mx-auto px-6 pb-12">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl leading-tight font-bold text-white md:text-6xl">
                                {page.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-auto mt-[20px] max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <NavigationSidebar park_name={park} />
                    <section className="flex-1 lg:max-w-4xl">
                        <MarkdownRenderer content={page.content} />
                    </section>
                </div>
            </div>

            {tours && (
                <section>
                    <h2 className="pt-10 text-center text-4xl font-bold text-black">
                        {`${capitalize(np.name)} Safaris to inspire your journey.`}
                    </h2>

                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {tours.slice(0, 6).map((tour) => (
                                <TourCard key={tour.id} tour={tour} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    )
}
