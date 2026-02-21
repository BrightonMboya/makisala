import { AllToursSlugs, getProgramaticTourBySlug } from '@/lib/cms-service'
import { notFound } from 'next/navigation'
import { BASE_URL, exclusions, inclusions } from '@/lib/constants'
import { type Metadata } from 'next'
import { BreadcrumbSchema, ProductSchema, TouristTripSchema } from '@/components/schema'
import { capitalize } from '@/lib/utils'
import ItineraryAccordion from './_components/ItineraryAccordion'
import TourHero from './_components/TourHero'
import TourOverview from './_components/TourOverview'
import TourInclusions from './_components/TourInclusions'
import BookTourCard from './_components/BookTourCard'

interface Params {
    params: {
        tour_slug: string
    }
}

export async function generateStaticParams() {
    const tours = await AllToursSlugs()
    return tours.filter(t => t.slug).map(t => ({ tour_slug: t.slug! }))
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
        description: tour.overview,
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `${capitalize(tour.country)} Safaris`,
                                url: `${BASE_URL}/safaris/${tour.country}`,
                            },
                            {
                                name: `${tour.tourName}`,
                                url: `${BASE_URL}/tours/${tour_slug}`,
                            },
                        ],
                    }),
                    TouristTripSchema({
                        name: tour.tourName,
                        description: tour.overview,
                        url: `${BASE_URL}/tours/${tour_slug}`,
                        pricingStartsFrom: tour.pricing,
                        itineraryItems: tour.days.map(day => ({
                            name: day.dayTitle || '',
                            description: day.overview || '',
                        })),
                    }),
                    ProductSchema({
                        name: tour.tourName,
                        imgUrl: tour.img_url,
                        description: tour.overview,
                        price: tour.pricing,
                        tour_slug: tour.slug!,
                        tour_id: tour.id,
                    }),
                ]) }} />
            <div className="min-h-screen bg-gray-50/50 pb-20">
                <TourHero
                    imageUrl={tour.img_url}
                    title={tour.tourName}
                    price={tour.pricing}
                    days={tour.number_of_days}
                    country={tour.country}
                />

                {/* Mobile Booking Card */}
                <div className="relative z-10 container mx-auto -mt-8 px-4 lg:hidden">
                    <BookTourCard price={tour.pricing} />
                </div>

                <div className="container mx-auto mt-12 px-4 md:px-6">
                    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
                        {/* Main Content */}
                        <div className="space-y-16">
                            <TourOverview
                                overview={tour.overview}
                                country={tour.country}
                                days={tour.number_of_days}
                            />

                            <section>
                                <h2 className="font-heading mb-8 text-3xl font-bold text-gray-900">
                                    Itinerary
                                </h2>
                                <div className="space-y-4">
                                    {tour.days.map(day => (
                                        <ItineraryAccordion
                                            key={day.id}
                                            dayNumber={day.dayNumber}
                                            dayTitle={day.dayTitle!}
                                            overview={day.overview!}
                                            itineraryAccommodations={day.itineraryAccommodations.map(
                                                ia => ({
                                                    ...ia,
                                                    accommodation: {
                                                        ...ia.accommodation,
                                                        url: ia.accommodation.url || '',
                                                        overview: ia.accommodation.overview || '',
                                                    },
                                                })
                                            )}
                                            mealPlan={
                                                day.dayNumber === 1
                                                    ? ['Breakfast', 'Lunch', 'Dinner']
                                                    : undefined
                                            }
                                        />
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h2 className="font-heading mb-8 text-3xl font-bold text-gray-900">
                                    Included & Excluded
                                </h2>
                                <TourInclusions inclusions={inclusions} exclusions={exclusions} />
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="relative hidden lg:block">
                            <BookTourCard price={tour.pricing} />
                        </div>

                        {/* Mobile Sticky Bottom Bar (Optional, if needed) */}
                        {/* <div className="fixed bottom-0 left-0 right-0 z-50 bg-white p-4 shadow-2xl lg:hidden">
                            <Button size="lg" className="w-full">Book Now</Button>
                        </div> */}
                    </div>
                </div>
            </div>
        </>
    )
}
