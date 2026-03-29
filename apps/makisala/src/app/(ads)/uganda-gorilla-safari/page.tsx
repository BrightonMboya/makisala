import {
    Binoculars,
    Check,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Mountain,
    Quote,
    Shield,
    Star,
    TreePine,
    Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import LandingNav from '@/components/landing-nav'
import UgandaGorillaSafariForm from '@/app/(ads)/uganda-gorilla-safari/_components/uganda-gorilla-safari-form'
import StickyMobileCTA from '@/app/(ads)/uganda-gorilla-safari/_components/sticky-mobile-cta'
import { BreadcrumbSchema, FAQSchema, TouristTripSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import { BASE_URL } from '@/lib/constants'
import Image from 'next/image'

const faqs = [
    {
        question: 'How much does a Uganda gorilla safari cost?',
        answer: 'Trips start from $2,000 per person depending on duration and lodge level. The $800 gorilla permit is included. Tell us your budget and we will build something that fits.',
    },
    {
        question: 'Is Uganda safe for tourists?',
        answer: 'Yes. Uganda is one of the safest countries in East Africa for tourism. National parks are well-managed with professional rangers and guides. We handle all logistics and are on the ground with you.',
    },
    {
        question: 'When is the best time to go?',
        answer: 'Year-round. Dry seasons (June-September, December-February) are best for trekking. Wet seasons have fewer crowds and lower rates.',
    },
    {
        question: 'How hard is gorilla trekking?',
        answer: 'Treks range from 1 to 6 hours through forest at altitude. Porters are available. Reasonable fitness is recommended but no prior trekking experience needed.',
    },
    {
        question: 'How far ahead should I book?',
        answer: 'We recommend 3-6 months in advance for peak season. Gorilla permits are limited. We can sometimes get last-minute spots but early booking guarantees your dates.',
    },
]

const testimonials = [
    {
        name: 'Rachel & Tom W.',
        location: 'New York, USA',
        initials: 'RT',
        text: 'Gorillas in Bwindi and tree-climbing lions on the same trip. Makisala planned everything perfectly. Uganda exceeded every expectation.',
        rating: 5,
    },
    {
        name: 'David M.',
        location: 'San Francisco, USA',
        initials: 'DM',
        text: "Gorillas, chimps, and a safari in Queen Elizabeth, all in one trip. Best travel decision I've ever made.",
        rating: 5,
    },
    {
        name: 'Lisa & Mark H.',
        location: 'Chicago, USA',
        initials: 'LM',
        text: 'One hour sitting with gorillas in the forest felt like a lifetime. Makisala handled every detail so we could just be present.',
        rating: 5,
    },
]

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Uganda Safari — Gorillas, Wildlife & More | From $2,000',
        description:
            'Custom Uganda safari packages: gorilla trekking, wildlife game drives, chimpanzee tracking, boat cruises. All-inclusive with a local East Africa operator. Get a free quote.',
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Uganda Safari — Gorillas, Wildlife & More | From $2,000',
            description:
                'Custom Uganda safari packages: gorilla trekking, wildlife game drives, chimpanzee tracking, boat cruises. All-inclusive with a local East Africa operator.',
            images: [
                {
                    url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/w_1200,h_630,c_fill,q_80/v1753389413/Gorilla-Chimpanzee-Safari-_ls4ffr.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Mountain gorilla in Uganda',
                },
            ],
        },
    }
}

export default function UgandaSafariV2Page() {
    const heroImage =
        'https://assets.makisala.com/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1773308528666-pexels-magda-ehlers-pexels-789628.webp'

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
                                    name: 'Uganda Gorilla Safari',
                                    url: `${BASE_URL}/uganda-gorilla-safari`,
                                },
                            ],
                        }),
                        FAQSchema({ faqs }),
                        TouristTripSchema({
                            name: 'Uganda Gorilla Safari',
                            description:
                                'Custom Uganda safari packages including gorilla trekking, wildlife game drives, and chimpanzee tracking with local expert guides.',
                            url: `${BASE_URL}/uganda-gorilla-safari`,
                            pricingStartsFrom: '2000',
                            itineraryItems: [
                                {
                                    name: 'Arrive in Entebbe',
                                    description: 'Airport pickup. Transfer to Bwindi.',
                                },
                                {
                                    name: 'Gorilla Trekking',
                                    description:
                                        'Trek to spend one hour with a gorilla family.',
                                },
                                {
                                    name: 'Queen Elizabeth Safari',
                                    description:
                                        'Game drive and Kazinga Channel boat cruise.',
                                },
                            ],
                        }),
                    ]),
                }}
            />

            <style>{`html > footer { display: none !important; } .woot-widget-bubble, .woot-widget-holder, .woot--bubble-holder { display: none !important; }`}</style>
            <LandingNav ctaText="Get a Free Quote" />
            <StickyMobileCTA />

            <div className="bg-background min-h-screen">
                {/* ============================================================
                    SECTION 1 — HERO: WhatsApp-first on mobile, form on desktop
                    ============================================================ */}
                <section id="inquiry-form" className="relative min-h-[90vh] lg:min-h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src={heroImage}
                            alt="Mountain gorilla in Uganda's Bwindi Impenetrable Forest"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/75" />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-24 pb-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-28 lg:pb-16">
                        {/* Left: Copy */}
                        <div className="flex-1 lg:pr-4">
                            {/* Trust signals ABOVE the headline */}
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-white/80">
                                    Rated 5/5 by past travelers
                                </span>
                            </div>

                            <h1 className="mb-5 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                                Your Uganda Safari, Built from Scratch — Starting at $2,000
                            </h1>

                            <p className="mb-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                                Gorilla trekking, wildlife game drives, chimpanzee tracking,
                                boat cruises — all in one trip. Tell us what you want and{' '}
                                <span className="font-semibold text-white">
                                    we build your perfect itinerary.
                                </span>
                            </p>

                            {/* Proof points */}
                            <div className="mb-6 flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
                                <span className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-white/60" />
                                    Gorilla permit included
                                </span>
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-white/60" />
                                    Local East Africa operator
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white/60" />
                                    Reply within hours
                                </span>
                            </div>

                            {/* MOBILE: WhatsApp CTA as primary action */}
                            <div className="flex flex-col gap-3 lg:hidden">
                                <a
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%20saw%20your%20Uganda%20gorilla%20safari%20page.%20I%27d%20love%20to%20get%20a%20quote!"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-green-700"
                                >
                                    <MessageCircle className="h-6 w-6" />
                                    Get a Quote on WhatsApp
                                </a>
                                <a
                                    href="#bottom-form"
                                    className="text-center text-sm text-white/70 underline underline-offset-2"
                                >
                                    Or fill out the form below
                                </a>
                            </div>

                            {/* DESKTOP: Secondary WhatsApp link */}
                            <a
                                href="https://wa.me/255788323254?text=Hi%2C%20I%20saw%20your%20Uganda%20gorilla%20safari%20page.%20I%27d%20love%20to%20get%20a%20quote!"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hidden items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700 lg:inline-flex"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Prefer WhatsApp? Chat with us now
                            </a>
                        </div>

                        {/* Right: Form — visible on desktop, hidden on mobile */}
                        <div className="hidden w-full shrink-0 lg:block lg:w-[400px]">
                            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl md:p-8">
                                <h2 className="mb-1 text-xl font-bold text-gray-900">
                                    Get a Free Quote
                                </h2>
                                <p className="text-muted-foreground mb-5 text-sm">
                                    We'll send you a personalized itinerary within hours.
                                </p>
                                <UgandaGorillaSafariForm />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 2 — SOCIAL PROOF BAR
                    ============================================================ */}
                <section className="border-b bg-white py-6">
                    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-6 sm:grid-cols-3 lg:grid-cols-5">
                        {[
                            {
                                icon: <MapPin className="text-primary h-5 w-5" />,
                                text: 'East Africa-based',
                            },
                            {
                                icon: <Users className="text-primary h-5 w-5" />,
                                text: 'Local expert guides',
                            },
                            {
                                icon: <Shield className="text-primary h-5 w-5" />,
                                text: 'Permits secured',
                            },
                            {
                                icon: <Heart className="text-primary h-5 w-5" />,
                                text: '100% custom trips',
                            },
                            {
                                icon: <Check className="text-primary h-5 w-5" />,
                                text: 'No hidden fees',
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
                    SECTION 3 — TESTIMONIALS (moved up for faster social proof)
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-3 text-center text-3xl font-bold md:text-4xl">
                            What Our Travelers Say
                        </h2>
                        <p className="text-muted-foreground mb-10 text-center text-lg">
                            Real experiences from real travelers
                        </p>
                        <div className="grid gap-6 md:grid-cols-3">
                            {testimonials.map((t, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-center gap-1">
                                        {[...Array(t.rating)].map((_, j) => (
                                            <Star
                                                key={j}
                                                className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                            />
                                        ))}
                                    </div>
                                    <Quote className="text-primary/20 mb-2 h-6 w-6" />
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        {t.text}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                            {t.initials}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{t.name}</p>
                                            <p className="text-muted-foreground text-sm">
                                                {t.location}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 4 — WHAT YOU'LL EXPERIENCE
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-5 text-3xl font-bold md:text-4xl">
                                    One Trip, Four Incredible Experiences
                                </h2>
                                <div className="space-y-5">
                                    {[
                                        {
                                            icon: <Mountain className="text-primary h-6 w-6" />,
                                            title: 'Mountain Gorilla Trekking',
                                            desc: 'Trek into Bwindi Impenetrable Forest — home to half the world\'s remaining mountain gorillas — for one hour with a habituated family.',
                                        },
                                        {
                                            icon: <TreePine className="text-primary h-6 w-6" />,
                                            title: 'Chimpanzee Tracking',
                                            desc: 'Follow chimps through Kibale Forest, the primate capital of the world.',
                                        },
                                        {
                                            icon: <Binoculars className="text-primary h-6 w-6" />,
                                            title: 'Tree-Climbing Lions',
                                            desc: 'Game drive in Queen Elizabeth National Park to see the famous Ishasha tree-climbing lions.',
                                        },
                                        {
                                            icon: <Heart className="text-primary h-6 w-6" />,
                                            title: 'Kazinga Channel Cruise',
                                            desc: 'Boat cruise past hippos, elephants, and hundreds of bird species.',
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="shrink-0 pt-1">{item.icon}</div>
                                            <div>
                                                <h3 className="mb-1 font-semibold">{item.title}</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                                    <Image
                                        src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753389413/Gorilla-Chimpanzee-Safari-_ls4ffr.jpg"
                                        alt="Mountain gorilla in Bwindi Impenetrable Forest"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 50vw, 25vw"
                                    />
                                </div>
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                                    <Image
                                        src="https://assets.makisala.com/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1773308514798-pexels-iurii-ivashchenko-1886156-3498323.webp"
                                        alt="Wildlife in Queen Elizabeth National Park"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 50vw, 25vw"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    MID-PAGE CTA — WhatsApp on mobile, form anchor on desktop
                    ============================================================ */}
                <section className="bg-primary py-10">
                    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 text-center sm:flex-row sm:text-left">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white sm:text-2xl">
                                Ready? It takes 2 minutes.
                            </h3>
                            <p className="mt-1 text-sm text-white/80">
                                Send us a message and we'll build your personalized itinerary.
                            </p>
                        </div>
                        {/* Mobile: WhatsApp */}
                        <a
                            href="https://wa.me/255788323254?text=Hi%2C%20I%20saw%20your%20Uganda%20gorilla%20safari%20page.%20I%27d%20love%20to%20get%20a%20quote!"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 lg:hidden"
                        >
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            WhatsApp Us
                        </a>
                        {/* Desktop: form anchor */}
                        <a
                            href="#inquiry-form"
                            className="hidden shrink-0 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100 lg:inline-flex"
                        >
                            Get a Free Quote
                        </a>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 5 — WHAT'S INCLUDED
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-4 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                                One Price. Everything Included.
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                                No hidden fees. No surprises. No middlemen.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: <Mountain className="text-primary h-6 w-6" />,
                                    title: 'Gorilla Permit ($800)',
                                    desc: 'Secured and included. We handle all permit logistics.',
                                    value: 'Included',
                                },
                                {
                                    icon: <Heart className="text-primary h-6 w-6" />,
                                    title: 'Accommodation',
                                    desc: 'Hand-picked lodges near the parks. Mid-range to luxury.',
                                },
                                {
                                    icon: <Shield className="text-primary h-6 w-6" />,
                                    title: 'Expert Guides',
                                    desc: 'English-speaking local guides with years of park experience.',
                                },
                                {
                                    icon: <MapPin className="text-primary h-6 w-6" />,
                                    title: 'All Transport',
                                    desc: 'Airport pickup, 4WD transfers, domestic flights if needed.',
                                },
                                {
                                    icon: <Check className="text-primary h-6 w-6" />,
                                    title: 'Park & Activity Fees',
                                    desc: 'All entrance fees, boat cruises, and activities covered.',
                                },
                                {
                                    icon: <Clock className="text-primary h-6 w-6" />,
                                    title: 'All Meals',
                                    desc: 'Full board — breakfast, lunch, and dinner throughout.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                                    <div className="mb-3 flex items-center justify-between">
                                        {item.icon}
                                        {'value' in item && item.value && (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                                                {item.value}
                                            </span>
                                        )}
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
                    SECTION 6 — WHY MAKISALA (shorter)
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
                            Why Travelers Choose Makisala
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            {[
                                {
                                    title: "We're Based in East Africa",
                                    desc: 'Direct relationships with parks, lodges, and guides. No middlemen, no markups.',
                                },
                                {
                                    title: 'We Secure Your Permits',
                                    desc: 'Gorilla permits sell out months ahead. We coordinate directly with UWA.',
                                },
                                {
                                    title: 'Talk to a Real Person',
                                    desc: 'WhatsApp, email, or phone — you talk to the people who will host you.',
                                },
                                {
                                    title: 'Built Around You',
                                    desc: 'No set packages. Your dates, your interests, your budget. We build it from scratch.',
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
                    SECTION 7 — BOTTOM FORM + CONTACT
                    ============================================================ */}
                <section id="bottom-form" className="bg-gray-900 py-16 lg:py-20">
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                                Start Planning Your Trip
                            </h2>
                            <p className="text-lg text-gray-300">
                                Drop us your name and WhatsApp. We'll message you with a
                                personalized itinerary — no obligation.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <UgandaGorillaSafariForm />
                        </div>
                        <div className="mt-8 text-center">
                            <p className="mb-4 text-sm text-gray-400">
                                Prefer to reach us directly?
                            </p>
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <a
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%20saw%20your%20Uganda%20gorilla%20safari%20page.%20I%27d%20love%20to%20get%20a%20quote!"
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
