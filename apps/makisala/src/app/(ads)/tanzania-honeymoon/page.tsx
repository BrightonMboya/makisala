import {
    Camera,
    Check,
    Heart,
    MapPin,
    MessageCircle,
    Palmtree,
    Plane,
    Shield,
    Sparkles,
    Star,
    Users,
    Utensils,
    Waves,
} from 'lucide-react'
import type { Metadata } from 'next'
import LandingNav from '@/components/landing-nav'
import LandingInquiryForm, {
    type LandingInquiryFormProps,
} from '@/app/(ads)/_components/landing-inquiry-form'
import StickyMobileCTA from '@/app/(ads)/tanzania-honeymoon/_components/sticky-mobile-cta'
import { BreadcrumbSchema, FAQSchema, TouristTripSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import { BASE_URL } from '@/lib/constants'
import Image from 'next/image'

const PRICE_FROM = '3,450'
const WHATSAPP_LINK =
    'https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20a%20Tanzania%20safari%20and%20Zanzibar%20beach%20trip%20for%20two.%20Can%20you%20help%20me%20plan%20it%3F'

const HERO_IMAGE = 'https://assets.makisala.com/randoms/couples_in_the_wild.jpg'
const OG_IMAGE = 'https://assets.makisala.com/randoms/couples_in_the_wild.jpg'
const SERENGETI_IMAGE = 'https://assets.makisala.com/randoms/couples_in_serengeti.jpg'
const BEACH_IMAGE = 'https://assets.makisala.com/randoms/couples_in_zanzibar.jpg'

const inquiryFormProps: LandingInquiryFormProps = {
    variant: 'detailed',
    conversionSendTo: 'AW-17982843958/-dtZCP2xirMcELbY8f5C',
    logLabel: 'Honeymoon form submission failed',
    commentPrefix: '[Tanzania Honeymoon LP] ',
    submitLabel: 'Get My Free Quote',
    messagePlaceholder: 'Travel dates, the occasion, dream lodges, anything special...',
    showRiskReducer: true,
}

const faqs = [
    {
        question: 'How many days do I need for a Tanzania safari and Zanzibar beach trip?',
        answer: 'Most couples spend 7 to 10 days: around 4 days on safari in the Serengeti and Ngorongoro, then 3 to 4 days unwinding on the beach in Zanzibar. We tailor the length to your time and budget.',
    },
    {
        question: 'When is the best time for a Tanzania safari and Zanzibar trip?',
        answer: 'Tanzania is a year-round destination. June to October offers classic dry-season game viewing and the Great Migration in the northern Serengeti. December to February is warm and green with excellent wildlife. Zanzibar is beautiful in all of these windows.',
    },
    {
        question: 'Is everything handled, including the flight to Zanzibar?',
        answer: 'Yes. We arrange your private safari with guide and vehicle, the internal flight from the Serengeti to Zanzibar, your beach resort, all park fees, and every transfer. You book your international flights, we handle everything once you land.',
    },
    {
        question: 'Can you make it special for a honeymoon or anniversary?',
        answer: 'That is what we love to do. Think private game drives, a sundowner in the bush, an optional hot-air balloon over the Serengeti at dawn, a romantic dinner under the stars, and a barefoot beachfront suite in Zanzibar. Whether it is a honeymoon, an anniversary, or just the two of you, tell us your dream and we build around it.',
    },
    {
        question: 'How much does a Tanzania safari and Zanzibar trip cost?',
        answer: `Our tailor-made safari and Zanzibar trips for two start from $${PRICE_FROM} per person and scale with your choice of lodges and length of stay. Every quote is custom, with no hidden fees. Tell us your dates and we will send a personalized quote.`,
    },
    {
        question: 'How far in advance should we book?',
        answer: 'We recommend 3 to 6 months ahead, especially for peak season and the best beach resorts, which fill up early. If your dates are sooner, message us and we will tell you honestly what is still available.',
    },
]

const fallbackReviews = [
    {
        author_name: 'Tatu Msuya',
        text: "Makisala organized my gorilla trekking trip and it was extraordinary from start to finish. The logistics were seamless, permits ready, early pickup, a skilled driver, and a guide who genuinely cared about everyone's comfort. The actual trek was breathtaking, and Makisala made it feel safe, well-planned, and deeply meaningful.",
        rating: 5,
        profile_photo_url:
            'https://lh3.googleusercontent.com/a-/ALV-UjWeEeflHottpvGo6wG1MsBa9JievmHTqZl14xVry4dDr88R_GAY=w144-h144-p-rp-mo-br100',
    },
    {
        author_name: 'Lightness Benedict',
        text: 'I travelled with Makisala on a two day Gorilla trekking in Rwanda, and was pleased with how they handled everything. The vehicle was comfortable, accommodation matched what I was told, and the guide offered helpful local insights. They also took care to respect safety and gave clear instructions all along. If you want a trustworthy tour operator in Rwanda, Makisala is a good pick.',
        rating: 5,
        profile_photo_url: null,
    },
    {
        author_name: 'Tony Rite',
        text: 'Makisala delivered an incredible Big Five safari. Our guide was skilled at spotting wildlife and gave us so much insight about the animals and the parks. The accommodations and vehicle were very comfortable, and every day felt like a new adventure. Would definitely travel with them again.',
        rating: 5,
        profile_photo_url:
            'https://lh3.googleusercontent.com/a-/ALV-UjUzYuj_-z7ic5_yYApqM7EdC-EiuxVmlTe5sdSQLXCK-hneYNx2yw=w144-h144-p-rp-mo-ba2-br100',
    },
]

const itineraryDays = [
    {
        name: 'Arrival in Tanzania',
        description:
            'Land at Kilimanjaro Airport. Private transfer to Arusha for a relaxed first night and a trip briefing over dinner.',
    },
    {
        name: 'Tarangire National Park',
        description:
            'Game drive among giant baobabs and large elephant herds, then check in to a comfortable lodge or tented camp.',
    },
    {
        name: 'Ngorongoro Crater',
        description:
            'Descend into the crater for a full day of game viewing, with a strong chance of the Big Five in one stunning bowl.',
    },
    {
        name: 'Serengeti National Park',
        description:
            'Endless plains, big cats, and the Great Migration in season. Private game drives by day, a sundowner as the sun goes down.',
    },
    {
        name: 'Serengeti at Leisure',
        description:
            'An optional hot-air balloon safari at dawn followed by a champagne bush breakfast, then more time with the wildlife.',
    },
    {
        name: 'Fly to Zanzibar',
        description:
            'Scenic flight from the Serengeti to the Indian Ocean. Transfer to your beachfront resort and trade the bush for the sand.',
    },
    {
        name: 'Zanzibar Beach',
        description:
            'Days at leisure on white-sand beaches. Optional dhow sunset cruise, Stone Town stroll, or a spice farm tour for two.',
    },
    {
        name: 'Departure',
        description:
            'A final morning by the ocean before your transfer to Zanzibar Airport for your onward flight home.',
    },
]

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Tanzania Safari + Zanzibar Beach for Two | Honeymoons & Romantic Escapes | Makisala`,
        description: `A tailor-made trip for two: private Serengeti safari then white-sand Zanzibar beaches. Honeymoons, anniversaries, and romantic escapes, planned by a Tanzania-based team. From $${PRICE_FROM} per person. Get a free quote.`,
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Tanzania Safari + Zanzibar Beach for Two | Makisala',
            description:
                'A tailor-made trip for two: private Serengeti safari then white-sand Zanzibar beaches, planned by a Tanzania-based team.',
            images: [
                {
                    url: OG_IMAGE,
                    width: 1200,
                    height: 630,
                    alt: 'Safari and Zanzibar beach trip for two in Tanzania',
                },
            ],
        },
    }
}

export default function TanzaniaHoneymoonPage() {
    const reviews = fallbackReviews
    const rating = 5.0
    const totalReviews = 3

    return (
        <main>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                {
                                    name: 'Tanzania Safari & Zanzibar Beach',
                                    url: `${BASE_URL}/tanzania-honeymoon`,
                                },
                            ],
                        }),
                        FAQSchema({ faqs }),
                        TouristTripSchema({
                            name: 'Tanzania Safari and Zanzibar Beach for Two',
                            description:
                                'A tailor-made trip for two combining a private Serengeti and Ngorongoro safari with white-sand beaches in Zanzibar. Ideal for honeymoons, anniversaries, and romantic escapes.',
                            url: `${BASE_URL}/tanzania-honeymoon`,
                            pricingStartsFrom: PRICE_FROM.replace(',', ''),
                            itineraryItems: itineraryDays,
                        }),
                    ]),
                }}
            />

            <LandingNav />
            <StickyMobileCTA />

            <div className="bg-background min-h-screen">
                {/* ============================================================
                    SECTION 1 — HERO WITH INLINE FORM (ABOVE THE FOLD)
                    ============================================================ */}
                <section id="inquiry-form" className="relative lg:min-h-screen">
                    {/* Desktop: full-bleed image behind the copy and form. Hidden
                        on mobile, where the photo becomes a top banner instead so
                        it never fights the text. */}
                    <div className="absolute inset-0 hidden lg:block">
                        <Image
                            src={HERO_IMAGE}
                            alt="Honeymoon safari couple in Tanzania"
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                        {/* Base dim + left-weighted gradient: keeps the white copy
                            legible while the photo and form area stay bright. */}
                        <div className="absolute inset-0 bg-black/50" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
                    </div>

                    {/* Mobile: photo banner with the headline AND a short subcopy
                        overlaid on the lower half, over a bottom-up gradient.
                        Only the rating + form sit below on the solid background. */}
                    <div className="relative flex h-[60vh] min-h-[400px] w-full items-end lg:hidden">
                        <Image
                            src={HERO_IMAGE}
                            alt="Honeymoon safari couple in Tanzania"
                            fill
                            className="object-cover"
                            priority
                            sizes="100vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        <div className="relative z-10 px-5 pb-7">
                            <h1 className="text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl">
                                Your Tanzania Safari and Zanzibar Beach, Made for Two
                            </h1>
                            <p className="mt-3 max-w-md text-base leading-relaxed text-white/90">
                                A private Serengeti safari, then white-sand Zanzibar beaches. From{' '}
                                <span className="font-semibold text-white">
                                    ${PRICE_FROM} per person
                                </span>
                                .
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-white/80">
                                    Rated 5/5 by the couples we host
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-8 pb-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-28 lg:pb-16">
                        {/* Left: Copy. Dark text on mobile (solid bg), white on
                            desktop (over the image). */}
                        <div className="hidden lg:block lg:flex-1 lg:pr-4">
                            {/* The whole text block is desktop-only here; on mobile it
                                lives on the banner image above, leaving just the form
                                below. */}
                            <h1 className="mb-5 hidden text-[3.25rem] leading-tight font-bold tracking-tight text-white lg:block">
                                Your Tanzania Safari and Zanzibar Beach, Made for Two
                            </h1>

                            <p className="mb-6 hidden max-w-xl text-lg leading-relaxed text-white/90 md:text-xl lg:block">
                                A private safari through the Serengeti and Ngorongoro, then
                                white-sand beaches in Zanzibar. Perfect for a honeymoon, an
                                anniversary, or just the two of you. From{' '}
                                <span className="font-semibold text-gray-900 lg:text-white">
                                    ${PRICE_FROM} per person
                                </span>
                                , including safari, internal flight, beach resort, and all
                                transfers.
                            </p>

                            {/* Social proof snippet */}
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500 lg:text-white/70">
                                    Rated 5/5 by the couples we host
                                </span>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="w-full shrink-0 lg:w-[420px]">
                            <div className="rounded-2xl border bg-white p-6 shadow-2xl md:p-8 lg:border-white/10">
                                <h2 className="mb-1 text-xl font-bold text-gray-900">
                                    Plan Your Trip for Two
                                </h2>
                                <p className="text-muted-foreground mb-5 text-sm">
                                    Tell us your dates and we will send a free, tailor-made quote
                                    for your safari and Zanzibar escape within 24 hours. No
                                    commitment.
                                </p>
                                <LandingInquiryForm {...inquiryFormProps} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 2 — TRUST SIGNALS
                    ============================================================ */}
                <section className="border-b bg-white py-6">
                    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 lg:grid-cols-5">
                        {[
                            {
                                icon: <MapPin className="text-primary h-5 w-5" />,
                                text: 'Tanzania-based operator',
                            },
                            {
                                icon: <Users className="text-primary h-5 w-5" />,
                                text: 'Private guide and vehicle',
                            },
                            {
                                icon: <Palmtree className="text-primary h-5 w-5" />,
                                text: 'Safari and beach in one',
                            },
                            {
                                icon: <Heart className="text-primary h-5 w-5" />,
                                text: 'Tailor-made for couples',
                            },
                            {
                                icon: <Check className="text-primary h-5 w-5" />,
                                text: 'Secure booking',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 text-sm font-medium text-gray-700"
                            >
                                {item.icon}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ============================================================
                    SECTION 3 — THE EXPERIENCE
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-5 text-3xl font-bold md:text-4xl">
                                    Two Trips in One Romantic Escape
                                </h2>
                                <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
                                    <p>
                                        Start in the Serengeti, where lions laze in the grass and
                                        the Great Migration thunders across the plains. Private game
                                        drives by day, a sundowner with your partner as the sky
                                        turns gold, and the option to drift over it all in a hot-air
                                        balloon at dawn.
                                    </p>
                                    <p>
                                        Then fly to Zanzibar and swap the bush for the beach. Warm
                                        Indian Ocean water, barefoot luxury, a dhow cruise at
                                        sunset. One seamless trip, planned end to end so you can
                                        simply be together.
                                    </p>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            icon: <Camera className="h-5 w-5" />,
                                            text: 'Private game drives',
                                        },
                                        {
                                            icon: <Sparkles className="h-5 w-5" />,
                                            text: 'Sunrise balloon option',
                                        },
                                        {
                                            icon: <Waves className="h-5 w-5" />,
                                            text: 'White-sand beaches',
                                        },
                                        {
                                            icon: <Heart className="h-5 w-5" />,
                                            text: 'Romantic touches',
                                        },
                                    ].map((item, i) => (
                                        <div
                                            key={i}
                                            className="text-muted-foreground flex items-center gap-2 text-sm font-medium"
                                        >
                                            <span className="text-primary">{item.icon}</span>
                                            {item.text}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                                    <Image
                                        src={SERENGETI_IMAGE}
                                        alt="Hot-air balloon over the Serengeti at dawn"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                    />
                                </div>
                                <div className="relative aspect-[3/2] overflow-hidden rounded-xl">
                                    <Image
                                        src={BEACH_IMAGE}
                                        alt="Romantic honeymoon escape in Tanzania and Zanzibar"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 4 — WHAT'S INCLUDED
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-4 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                                Everything Handled, From Plains to Beach
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                                One price, one team, zero hassle. Your whole trip is arranged before
                                you land.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: <Camera className="text-primary h-6 w-6" />,
                                    title: 'Private Safari',
                                    desc: 'Serengeti and Ngorongoro game drives in your own 4x4 with a private guide. No sharing with strangers.',
                                },
                                {
                                    icon: <Plane className="text-primary h-6 w-6" />,
                                    title: 'Internal Flight',
                                    desc: 'Scenic flight from the Serengeti to Zanzibar so you spend your time relaxing, not driving.',
                                },
                                {
                                    icon: <Palmtree className="text-primary h-6 w-6" />,
                                    title: 'Beach Resort',
                                    desc: 'Nights in a hand-picked beachfront resort on Zanzibar, chosen to match your style and budget.',
                                },
                                {
                                    icon: <Shield className="text-primary h-6 w-6" />,
                                    title: 'Park and Conservation Fees',
                                    desc: 'All national park entry and conservation fees are covered. No surprise costs on the ground.',
                                },
                                {
                                    icon: <MapPin className="text-primary h-6 w-6" />,
                                    title: 'All Transfers',
                                    desc: 'Airport pickups, lodge transfers, and every connection in between, handled for you.',
                                },
                                {
                                    icon: <Utensils className="text-primary h-6 w-6" />,
                                    title: 'Meals',
                                    desc: 'Full board on safari and daily breakfast at the beach, with romantic dining options on request.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                        {item.icon}
                                    </div>
                                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 5 — SAMPLE ITINERARY
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                            A Sample 8-Day Trip for Two
                        </h2>
                        <p className="text-muted-foreground mb-10 text-lg">
                            A sample flow. We customize every trip to your dates, pace, and budget.
                        </p>
                        <div className="space-y-0">
                            {itineraryDays.map((day, index) => (
                                <div key={index} className="relative flex gap-4 pb-8 last:pb-0">
                                    {/* Timeline line */}
                                    {index < itineraryDays.length - 1 && (
                                        <div className="bg-primary/20 absolute top-10 left-5 h-full w-px" />
                                    )}
                                    <div className="bg-primary relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                                        {index + 1}
                                    </div>
                                    <div className="rounded-xl border bg-white p-5 shadow-sm flex-1">
                                        <h3 className="mb-1 text-lg font-semibold">
                                            Day {index + 1}: {day.name}
                                        </h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {day.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 6 — WHY BOOK WITH MAKISALA
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
                            Why Couples Book with Makisala
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            {[
                                {
                                    title: 'Based in Tanzania',
                                    desc: 'We operate from the ground with direct relationships with parks, lodges, and Zanzibar resorts. No middlemen, better value.',
                                },
                                {
                                    title: 'One Trip, Zero Hassle',
                                    desc: 'Safari, internal flights, and beach are arranged as one seamless journey. You arrive, we have everything ready.',
                                },
                                {
                                    title: 'Talk to a Real Person',
                                    desc: 'You speak with the people who host you, not a call center. WhatsApp, email, or phone, whatever you prefer.',
                                },
                                {
                                    title: 'Built Around the Two of You',
                                    desc: 'Adventure-heavy or beach-heavy, lively or private, we shape the whole trip around your dates and budget.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <Check className="text-primary mt-1 h-6 w-6 shrink-0" />
                                    <div>
                                        <h3 className="mb-1 text-lg font-semibold">{item.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 7 — SOCIAL PROOF (REVIEWS)
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="mb-10 flex flex-col items-center gap-3 text-center">
                            <h2 className="text-3xl font-bold md:text-4xl">
                                Couples We Have Hosted
                            </h2>
                            <div className="flex items-center gap-2">
                                <Image
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                                    alt="Google"
                                    width={60}
                                    height={20}
                                    className="opacity-80"
                                    unoptimized={true}
                                />
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">
                                    {rating}/5 from {totalReviews}+ reviews
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {reviews.map((review, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-center gap-1">
                                        {[...Array(5)].map((_, j) => (
                                            <Star
                                                key={j}
                                                className={`h-4 w-4 ${j < (review.rating || 5) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                                        &ldquo;{review.text}&rdquo;
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {review.profile_photo_url ? (
                                            <img
                                                src={review.profile_photo_url}
                                                alt={review.author_name}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
                                                // unoptimized={true}
                                            />
                                        ) : (
                                            <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                                {review.author_name.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold">{review.author_name}</p>
                                            <p className="text-muted-foreground text-sm">
                                                Google Review
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 8 — SECOND FORM + CONTACT OPTIONS
                    ============================================================ */}
                <section id="bottom-form" className="bg-gray-900 py-16 lg:py-20">
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                                Start Planning Your Trip for Two
                            </h2>
                            <p className="text-lg text-gray-300">
                                Tell us your dates and what you dream of. We will send a free,
                                tailor-made quote within 24 hours. No commitment.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <LandingInquiryForm {...inquiryFormProps} />
                        </div>
                        <div className="mt-8 text-center">
                            <p className="mb-4 text-sm text-gray-400">
                                Prefer to reach us directly?
                            </p>
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <a
                                    href={WHATSAPP_LINK}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    WhatsApp Us
                                </a>
                                <a
                                    href="mailto:info@makisala.com"
                                    className="inline-flex items-center gap-2 rounded-full border border-gray-600 px-6 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800"
                                >
                                    info@makisala.com
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ */}
                <FAQ faqs={faqs} />
            </div>
        </main>
    )
}
