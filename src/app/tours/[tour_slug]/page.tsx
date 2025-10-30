import { getProgramaticTourBySlug } from '@/lib/cms-service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Calendar, Check, Cross, MapPin } from 'lucide-react'
import {
    DesktopNavigation,
    MobileNavigation,
} from '@/app/to_book/[slug]/_components/PageNavigation'
import { BASE_URL, exclusions, inclusions } from '@/lib/constants'
import { type Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema, ProductSchema } from '@/components/schema'
import { capitalize } from '@/lib/utils'
import ItineraryAccordion from '@/app/tours/[tour_slug]/_components/ItineraryAccordion'

interface Params {
    params: {
        tour_slug: string
    }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { tour_slug } = await params
    const tour = await getProgramaticTourBySlug(tour_slug)

    if (!tour) {
        return {
            title: 'Tour not found | Makisala Safaris',
        }
    }

    return {
        title: tour.tourName,
        openGraph: {
            title: tour.tourName,
            description: tour.overview,
            images: [
                {
                    url: tour.img_url,
                    width: 1200,
                    height: 630,
                    alt: tour.tourName,
                },
            ],
        },
    }
}

export default async function Page({ params }: Params) {
    const { tour_slug } = await params
    const tour = await getProgramaticTourBySlug(tour_slug)

    if (!tour) {
        return notFound()
    }
    return (
        <>
            <Script
                type={'application/ld+json'}
                strategy={'lazyOnload'}
                id="schema"
            >
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `${capitalize(tour.country)} Safaris`,
                                url: `${BASE_URL}`,
                            },
                            {
                                name: `${tour.tourName}`,
                                url: `${BASE_URL}/tours/${tour_slug}`,
                            },
                        ],
                    }),
                    ProductSchema({
                        name: tour.tourName,
                        imgUrl: tour.img_url,
                        description: tour.overview,
                        price: tour.pricing,
                        tour_slug: tour.slug!,
                        tour_id: tour.id,
                    }),
                ])}
            </Script>
            <div className="from-background to-accent/20 min-h-screen bg-gradient-to-br">
                {/* Hero Section */}
                <div className="relative h-[60vh] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${tour.img_url})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>

                    <div className="relative flex h-full items-end">
                        <div className="container mx-auto px-6 pb-12">
                            <div className="max-w-4xl">
                                <div className="mb-4 flex items-center gap-2">
                                    <Badge className="border-white/30 bg-white/20 text-white capitalize">
                                        {`From $${tour.pricing}`}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white"
                                    >
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {tour.number_of_days} Days
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white capitalize"
                                    >
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {tour.country}
                                    </Badge>
                                </div>

                                <h1 className="text-3xl leading-tight font-bold text-white md:text-6xl">
                                    {tour.tourName}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col lg:flex-row">
                    {/* Navigation - Horizontal on mobile, sidebar on desktop */}
                    <div className="lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:overflow-y-auto">
                        {/* Mobile horizontal navigation */}
                        <div className="bg-card/95 border-border border-b backdrop-blur-lg lg:hidden">
                            <div className="container mx-auto px-6 py-4">
                                <div className="grid grid-cols-2 gap-2 pb-4 md:hidden">
                                    <MobileNavigation />
                                </div>
                            </div>
                        </div>

                        {/* Desktop sidebar navigation */}
                        <DesktopNavigation />
                    </div>
                    <div>
                        {tour.days.map((day, index) => (
                            <ItineraryAccordion
                                key={day.id}
                                dayNumber={day.dayNumber}
                                dayTitle={day.dayTitle!}
                                overview={day.overview!}
                                itineraryAccommodations={
                                    day.itineraryAccommodations
                                }
                                mealPlan={
                                    day.dayNumber === 1
                                        ? ['Breakfast', 'Lunch', 'Dinner']
                                        : undefined
                                }
                            />
                        ))}

                        <section className="mx-auto mt-20 grid max-w-4xl grid-cols-1 gap-12 px-4 md:grid-cols-2">
                            <div>
                                <div className="mb-4 flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
                                        <Check className="text-white" />
                                    </div>
                                    <h5 className="text-3xl">Cost Includes</h5>
                                </div>
                                <ul className="flex list-inside list-disc flex-col gap-3">
                                    {inclusions.map((item: string) => (
                                        <li
                                            key={item}
                                            className="ml-4 list-item"
                                        >
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <div className="mb-4 flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600">
                                        <Cross className="text-white" />
                                    </div>
                                    <h5 className="text-3xl">Cost Excludes</h5>
                                </div>
                                <ul className="flex list-inside list-disc flex-col gap-3">
                                    {exclusions.map((item: string) => (
                                        <li
                                            key={item}
                                            className="ml-4 list-item"
                                        >
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    )
}
