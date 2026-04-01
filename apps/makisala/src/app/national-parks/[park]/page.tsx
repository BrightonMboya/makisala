import Image from 'next/image'
import Link from 'next/link'
import type { IParams } from './type'
import { fetchAllNps, getNPInfo, getWildlifeByPark } from '@/lib/cms-service'
import { notFound } from 'next/navigation'
import {
    BreadcrumbSchema,
    FAQSchema,
    ParkSchema,
    TouristAttractionSchema,
    TouristDestinationSchema,
} from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import type { Metadata } from 'next'
import { V2SidebarNav } from '../_components/v2-sidebar-nav'
import { V2Carousel } from '../_components/v2-carousel'
import { FaqAccordion } from '../_components/faq-accordion'
import TourCard from '../../safaris/[country]/[modifier]/_components/TourCard'
import { InquiryDialog } from '@/components/enquire-dialog-button'

/* ------------------------------------------------------------------ */
/*  HARDCODED (same across all destinations)                           */
/* ------------------------------------------------------------------ */

const processSteps = [
    {
        step: 1,
        title: "Let's connect",
        body: 'Whether you have a specific trip in mind or are looking for inspiration, get in touch with your travel preferences, and one of our specialists will kick off the planning.',
    },
    {
        step: 2,
        title: 'Detailed Brief',
        body: 'After a conversation to learn more about your trip, you will receive details on an adventure with us, including activities and accommodation options in the destinations.',
    },
    {
        step: 3,
        title: 'Customized Itinerary and Confirmation',
        body: 'Collaborate with your specialist to adjust and finalize the itinerary. A per-person trip cost is presented once the itinerary is confirmed.',
    },
    {
        step: 4,
        title: 'Support, Start to Finish',
        body: 'From the moment you arrive until your trip ends, our team is with you. Experienced guides, porters, and a 24/7 support line ensure your safety and enjoyment.',
    },
]

/* ------------------------------------------------------------------ */
/*  METADATA                                                           */
/* ------------------------------------------------------------------ */

export async function generateStaticParams() {
    const parks = await fetchAllNps()
    return parks.map(p => ({ park: p.name }))
}

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    const { park } = await params
    const result = await getNPInfo(park, 'overview_page_id')
    if (!result?.page) return { title: 'Page not found' }
    const { page } = result
    return {
        title: page.meta_title,
        description: page.meta_description,
        openGraph: {
            title: page.title,
            description: page.meta_description!,
            images: page.featured_image_url
                ? [{ url: page.featured_image_url, alt: page.title }]
                : [],
        },
    }
}

export default async function ParkPage({ params }: IParams) {
    const { park } = await params
    const result = await getNPInfo(park, 'overview_page_id')
    if (!result?.page) return notFound()

    const { park: np, page, tours } = result
    const wildlifeInPark = await getWildlifeByPark(park)

    const parkOverview = np.park_overview ?? []
    const highlights = np.highlights ?? []
    const tripInspiration = np.trip_inspiration ?? []
    const featuredStays = np.featured_stays ?? []
    const testimonials = np.testimonials ?? []
    const goodToKnow = np.good_to_know ?? []
    const faqs = page.faqs ?? []

    return (
        <main className="font-sans text-foreground">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                {
                                    name: `${capitalize(np.country)} Safaris`,
                                    url: `${BASE_URL}/safaris/${np.country}`,
                                },
                                {
                                    name: `${capitalize(np.name)} National Park`,
                                    url: `${BASE_URL}/national-parks/${np.name}`,
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
                            address: { addressCountry: capitalize(np.country) },
                        }),
                        ...(faqs.length > 0 ? [FAQSchema({ faqs })] : []),
                    ]),
                }}
            />

            {/* ===== HERO ===== */}
            <section className="relative flex h-[85vh] max-h-[850px] min-h-[500px] items-center justify-center text-white">
                <Image
                    src={page.featured_image_url || '/placeholder.svg'}
                    alt={page.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/35" />
                <div className="relative z-10 w-[90%] max-w-[1008px] text-center md:w-[70%]">
                    <p className="mb-2 font-serif text-[18px] italic leading-[30px] md:text-[22px] md:leading-[38px]">
                        {capitalize(np.country)}
                    </p>
                    <h1 className="font-serif text-[36px] font-light leading-[44px] md:text-[52px] md:leading-[62px] lg:text-[60px] lg:leading-[72px]">
                        {page.title}
                    </h1>
                    {np.hero_tagline && (
                        <p className="mt-3 text-[16px] leading-[24px] md:text-[20px] md:leading-[30px]">
                            {np.hero_tagline}
                        </p>
                    )}
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
                        <Link
                            href="#start-planning"
                            className="flex h-[45px] w-full items-center justify-center bg-primary px-6 text-[16px] font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
                        >
                            Start Planning
                        </Link>
                        <Link
                            href="#tours"
                            className="flex h-[45px] w-full items-center justify-center border border-white bg-white/10 px-6 text-[16px] font-medium text-white backdrop-blur-sm transition-opacity hover:bg-white/20 sm:w-auto"
                        >
                            View Safaris
                        </Link>
                    </div>
                </div>
            </section>

            {/* ===== QUICK FACTS ===== */}
            {parkOverview.length > 0 && (
                <section className="bg-[#F8F7F3]">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="grid grid-cols-2 gap-y-4 md:flex md:items-center md:justify-between">
                            {parkOverview.slice(0, 5).map((item, i, arr) => (
                                <div key={item.name} className="flex items-center">
                                    <div className="flex flex-col px-2 py-2 md:px-4 md:py-4">
                                        <p className="text-[13px] leading-[20px] md:text-[16px] md:leading-[24px]">
                                            {item.name}
                                        </p>
                                        <p className="font-serif text-[16px] font-light leading-[24px] md:text-[24px] md:leading-[36px]">
                                            {item.description}
                                        </p>
                                    </div>
                                    {i < Math.min(arr.length, 5) - 1 && (
                                        <div className="mx-4 hidden h-[96px] w-px bg-[rgb(130,129,129)] md:block" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ===== TWO-COLUMN LAYOUT ===== */}
            <div className="mx-auto max-w-7xl px-6">
                <div className="flex">
                    <div
                        className="hidden lg:block"
                        style={{ flexBasis: '20.833%', flexShrink: 0 }}
                    >
                        <V2SidebarNav />
                    </div>
                    <div className="lg:hidden">
                        <V2SidebarNav />
                    </div>

                    <div className="min-w-0 flex-1 lg:pl-8" style={{ flexBasis: '79.166%' }}>
                        {/* ===== OVERVIEW ===== */}
                        <section id="overview" className="pb-16 pt-10">
                            <nav className="mb-3 text-[14px] text-gray-400">
                                <span>Africa</span>
                                <span className="mx-2">/</span>
                                <span>{capitalize(np.country)}</span>
                                <span className="mx-2">/</span>
                                <span className="text-foreground">{capitalize(np.name)}</span>
                            </nav>

                            {np.intro_text && (
                                <p className="mb-12 font-serif text-[24px] font-light italic leading-[36px] md:text-[32px] md:leading-[46px]">
                                    {np.intro_text}
                                </p>
                            )}

                            {highlights.length > 0 && (
                                <div className="flex flex-col gap-10 md:flex-row">
                                    <div className="relative min-h-[350px] md:min-h-[400px] md:w-1/2">
                                        <Image
                                            src={page.featured_image_url || '/placeholder.svg'}
                                            alt={page.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="space-y-8 md:w-1/2">
                                        {highlights.map(h => (
                                            <div key={h.title}>
                                                <h4 className="font-serif text-[24px] leading-[36px]">
                                                    {h.title}
                                                </h4>
                                                <p className="mt-2 text-[16px] leading-[24px]">
                                                    {h.body}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ===== EXPERIENCE DESIGNER (hardcoded) ===== */}
                        <section id="trip-designer" className="border-t border-gray-200 py-16">
                            <h2 className="mb-10 text-center font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                Experience Designer
                            </h2>
                            <div className="overflow-hidden border border-gray-200">
                                <div className="flex flex-col md:flex-row">
                                    <div className="relative min-h-[300px] md:w-5/12">
                                        <Image
                                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
                                            alt="Safari specialist"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center p-8 md:w-7/12 md:p-10">
                                        <h3 className="font-serif text-[32px] font-light leading-[40px] md:text-[44px] md:leading-[52px]">
                                            James Mollel
                                        </h3>
                                        <div className="mt-6">
                                            <h6 className="text-[16px] font-semibold">
                                                Regions of Speciality:
                                            </h6>
                                            <p className="text-[16px]">
                                                Eastern Africa, Kilimanjaro, Northern Circuit
                                            </p>
                                        </div>
                                        <div className="mt-4">
                                            <h6 className="text-[16px] font-semibold">
                                                Mountain Guide &amp; Trip Designer
                                            </h6>
                                            <p className="mt-1 text-[16px] leading-[24px]">
                                                Born and raised in Moshi at the foot of Kilimanjaro,
                                                James has summited the mountain over 200 times
                                                across all six routes. He brings an intimate
                                                understanding of the mountain&apos;s moods and the
                                                best campsites for sunrise views.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ===== TRIP INSPIRATION ===== */}
                        {tripInspiration.length > 0 && (
                            <section id="inspiration" className="py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Trip Inspiration
                                </h2>
                                <div className="space-y-12">
                                    {tripInspiration.map(trip => (
                                        <div
                                            key={trip.name}
                                            className="border border-gray-200 bg-white"
                                        >
                                            <div className="relative h-[300px] md:h-[450px]">
                                                <Image
                                                    src={trip.image_url}
                                                    alt={trip.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                                    <p className="mb-2 text-[12px] uppercase tracking-[2px] text-white/70">
                                                        Snapshot of a Day
                                                    </p>
                                                    <p className="max-w-2xl font-serif text-[18px] font-light leading-[28px] text-white md:text-[20px] md:leading-[30px]">
                                                        {trip.day_snapshot}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="p-6 md:p-8">
                                                <p className="mb-1 text-[12px] uppercase tracking-[2px] text-gray-400">
                                                    Trip Inspiration
                                                </p>
                                                <div className="mt-4 flex flex-col gap-8 md:flex-row">
                                                    <div className="md:w-1/2">
                                                        <h4 className="font-serif text-[24px] leading-[36px]">
                                                            {trip.name}
                                                        </h4>
                                                        <p className="mt-3 text-[16px] leading-[24px]">
                                                            {trip.description}
                                                        </p>
                                                        <InquiryDialog>
                                                            <button className="mt-6 border border-primary bg-transparent px-6 py-3 text-[14px] font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                                                                Make This Trip Yours
                                                            </button>
                                                        </InquiryDialog>
                                                    </div>
                                                    <div className="space-y-4 md:w-1/2">
                                                        <div className="flex items-start gap-3">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                className="mt-0.5 h-6 w-6 shrink-0"
                                                            >
                                                                <circle cx="12" cy="12" r="10" />
                                                                <path d="M12 6v6l4 2" />
                                                            </svg>
                                                            <p className="text-[16px] leading-[24px]">
                                                                <strong>
                                                                    Recommended Duration:
                                                                </strong>{' '}
                                                                {trip.duration}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                className="mt-0.5 h-6 w-6 shrink-0"
                                                            >
                                                                <circle cx="12" cy="12" r="5" />
                                                                <line
                                                                    x1="12"
                                                                    y1="1"
                                                                    x2="12"
                                                                    y2="3"
                                                                />
                                                                <line
                                                                    x1="12"
                                                                    y1="21"
                                                                    x2="12"
                                                                    y2="23"
                                                                />
                                                                <line
                                                                    x1="1"
                                                                    y1="12"
                                                                    x2="3"
                                                                    y2="12"
                                                                />
                                                                <line
                                                                    x1="21"
                                                                    y1="12"
                                                                    x2="23"
                                                                    y2="12"
                                                                />
                                                            </svg>
                                                            <p className="text-[16px] leading-[24px]">
                                                                <strong>Best Time To Go:</strong>{' '}
                                                                {trip.best_time}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                className="mt-0.5 h-6 w-6 shrink-0"
                                                            >
                                                                <path d="M1 20l7-14 4 8 4-6 7 12" />
                                                            </svg>
                                                            <p className="text-[16px] leading-[24px]">
                                                                <strong>
                                                                    Things to See &amp; Do:
                                                                </strong>{' '}
                                                                {trip.activities}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-start gap-3">
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="1.5"
                                                                className="mt-0.5 h-6 w-6 shrink-0"
                                                            >
                                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                            </svg>
                                                            <p className="text-[16px] leading-[24px]">
                                                                <strong>
                                                                    Don&apos;t Miss Out On:
                                                                </strong>{' '}
                                                                {trip.dont_miss}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ===== FEATURED STAYS ===== */}
                        {featuredStays.length > 0 && (
                            <section id="stays" className="py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Featured stays
                                </h2>
                                <V2Carousel>
                                    {featuredStays.map(stay => (
                                        <div
                                            key={stay.name}
                                            className="flex flex-col border border-gray-200 bg-white"
                                        >
                                            <div className="relative h-[285px]">
                                                <Image
                                                    src={stay.image_url}
                                                    alt={stay.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div className="flex flex-1 flex-col p-4">
                                                <h4 className="font-serif text-[24px] leading-[36px]">
                                                    {stay.name}
                                                </h4>
                                                <p className="mt-1 text-[16px]">
                                                    <strong>Location:</strong> {stay.location}
                                                </p>
                                                <div className="mt-auto pt-4">
                                                    <button className="text-[16px] hover:underline">
                                                        Learn more ↗
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </V2Carousel>
                            </section>
                        )}

                        {/* ===== TESTIMONIALS ===== */}
                        {testimonials.length > 0 && (
                            <section id="testimonials" className="py-16">
                                <h2 className="mb-10 text-center font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Testimonials
                                </h2>
                                {testimonials.map((t, i) => (
                                    <div
                                        key={i}
                                        className="bg-[#F9F7F4] px-8 py-12 md:px-12 md:py-16"
                                    >
                                        <h4 className="font-serif text-[28px] font-normal italic leading-[42px] md:text-[40px] md:leading-[60px]">
                                            &ldquo;{t.quote}&rdquo;
                                        </h4>
                                        <div className="mx-auto mt-6 md:w-[70%]">
                                            <p className="text-[16px] italic leading-[24px]">
                                                {t.body}
                                            </p>
                                        </div>
                                        <p className="mt-6 text-center text-[14px] text-gray-500">
                                            — {t.attribution}
                                        </p>
                                    </div>
                                ))}
                            </section>
                        )}

                        {/* ===== PROCESS (hardcoded) ===== */}
                        <section id="process" className="py-16">
                            <h2 className="mb-10 text-center font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                Process
                            </h2>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {processSteps.map(s => (
                                    <div key={s.step} className="flex flex-col bg-[#F9F7F4] p-6">
                                        <p className="text-[16px]">Step {s.step}</p>
                                        <h4 className="mt-2 font-serif text-[24px] leading-[36px] md:text-[28px] md:leading-[42px]">
                                            {s.title}
                                        </h4>
                                        <p className="mt-3 text-[16px] leading-[24px]">{s.body}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* ===== GOOD TO KNOW ===== */}
                        {goodToKnow.length > 0 && (
                            <section id="good-to-know" className="py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Good to know
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-3">
                                    {goodToKnow.map((item, i) => (
                                        <div
                                            key={item.title}
                                            className={`flex flex-col p-4 ${i < goodToKnow.length - 1 ? 'border-b md:border-b-0 md:border-r' : ''} border-gray-200`}
                                        >
                                            <h6 className="font-serif text-[22px] leading-[38px]">
                                                {item.title}
                                            </h6>
                                            <p className="mt-2 text-[16px] leading-[24px]">
                                                {item.body}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ===== TOURS ===== */}
                        {tours && tours.length > 0 && (
                            <section id="tours" className="border-t border-gray-200 py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    {capitalize(np.name)} safaris
                                </h2>
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {tours.slice(0, 6).map(tour => (
                                        <TourCard key={tour.id} tour={tour} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ===== WILDLIFE ===== */}
                        {wildlifeInPark.length > 0 && (
                            <section className="border-t border-gray-200 py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Wildlife in {capitalize(np.name)}
                                </h2>
                                <div className="flex flex-wrap gap-3">
                                    {wildlifeInPark.map(w => (
                                        <Link
                                            key={w.animalName}
                                            href={`/wildlife/${w.animalName}/${park}`}
                                            className="rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                                        >
                                            {capitalize(w.animalName)}
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ===== FAQ ===== */}
                        {faqs.length > 0 && (
                            <section className="border-t border-gray-200 py-16">
                                <h2 className="mb-10 font-serif text-[40px] font-light leading-[48px] text-muted-foreground md:text-[52px] md:leading-[62px]">
                                    Frequently Asked Questions
                                </h2>
                                <div className="max-w-3xl">
                                    <FaqAccordion faqs={faqs} />
                                </div>
                            </section>
                        )}

                        {/* ===== CTA ===== */}
                        <section
                            id="start-planning"
                            className="border-t border-gray-200 py-16 text-center"
                        >
                            <h3 className="font-serif text-[32px] font-light leading-[40px] md:text-[40px] md:leading-[48px]">
                                Ready to plan your {capitalize(np.name)} adventure?
                            </h3>
                            <p className="mx-auto mt-4 max-w-xl text-[16px] leading-[24px] text-muted-foreground">
                                Tell us about your dream trip and we&apos;ll craft a bespoke
                                itinerary around your interests and timeline.
                            </p>
                            <Link
                                href="/contact"
                                className="mt-8 inline-flex h-[45px] items-center justify-center bg-primary px-8 text-[16px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                            >
                                Get In Touch
                            </Link>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    )
}
