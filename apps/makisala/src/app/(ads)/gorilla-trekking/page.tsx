import {
    Check,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Mountain,
    Phone,
    Quote,
    Shield,
    Star,
    TreePine,
    Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import LandingNav from '@/components/landing-nav'
import GorillaTrekForm from '@/app/(ads)/gorilla-trekking/_components/gorilla-trek-form'
import StickyMobileCTA from '@/app/(ads)/gorilla-trekking/_components/sticky-mobile-cta'
import { BreadcrumbSchema, FAQSchema, TouristTripSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import { BASE_URL } from '@/lib/constants'
import Image from 'next/image'

const faqs = [
    {
        question: 'How physically demanding is gorilla trekking?',
        answer: 'Gorilla trekking involves hiking through dense forest at altitude (2,300-4,500m). Treks can range from 1 to 6 hours depending on gorilla locations. You should be able to walk on uneven terrain for several hours. We provide porters and walking sticks to assist you.',
    },
    {
        question: 'What is included in the $3,500 package?',
        answer: 'The package includes your gorilla trekking permit (worth $1,500 in Rwanda), all accommodation, meals, ground transport, an English-speaking guide, park fees, and airport transfers. International flights are not included.',
    },
    {
        question: 'How close do you get to the gorillas?',
        answer: 'You will be within 7 meters (about 23 feet) of a gorilla family. The encounter lasts one hour, during which you can observe and photograph them in their natural habitat.',
    },
    {
        question: 'When is the best time to go gorilla trekking?',
        answer: 'Gorilla trekking is possible year-round, but the dry seasons (June-September and December-February) offer the easiest trekking conditions. The wet season (March-May, October-November) has fewer visitors and lower rates, but trails can be muddy.',
    },
    {
        question: 'Is gorilla trekking safe?',
        answer: 'Yes. Mountain gorillas are habituated to human presence and are gentle by nature. You are accompanied by experienced trackers and armed rangers at all times. Rwanda has an excellent safety record for gorilla trekking.',
    },
    {
        question: 'How far in advance should I book?',
        answer: 'We recommend booking at least 3-6 months in advance, especially for peak season (June-September). Gorilla permits are limited to 8 visitors per gorilla family per day, so they sell out quickly.',
    },
]

const testimonials = [
    {
        name: 'Sarah & James K.',
        location: 'London, UK',
        initials: 'SJ',
        text: 'We saw a silverback with twin babies — our guide Joseph knew exactly where to find the Susa family. The hour we spent with them felt like five minutes. Worth every penny.',
        rating: 5,
    },
    {
        name: 'Michael T.',
        location: 'Toronto, Canada',
        initials: 'MT',
        text: 'Makisala handled everything flawlessly. Permits, transport, a beautiful lodge with volcano views. All we had to do was show up and trek. The gorilla encounter changed my perspective on wildlife forever.',
        rating: 5,
    },
    {
        name: 'Anna & David R.',
        location: 'Sydney, Australia',
        initials: 'AD',
        text: 'We compared five operators before choosing Makisala. Best decision — they secured our permits when everyone else said June was sold out. The experience itself was beyond words.',
        rating: 5,
    },
]

const itineraryDays = [
    {
        name: 'Arrival in Kigali',
        description:
            'Airport pickup and transfer to your hotel. Evening briefing and welcome dinner.',
    },
    {
        name: 'Transfer to Volcanoes National Park',
        description:
            'Scenic drive to the foothills of the Virunga Mountains. Afternoon cultural visit to a local community.',
    },
    {
        name: 'Gorilla Trekking Day',
        description:
            'Early morning briefing at park headquarters, then trek into the bamboo forest to meet a habituated gorilla family. One hour with the gorillas.',
    },
    {
        name: 'Golden Monkey Trek & Departure',
        description:
            'Optional golden monkey trek in the morning, then transfer back to Kigali for your departure flight.',
    },
]

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Gorilla Trekking in Rwanda | From $3,500 | Makisala Safaris',
        description:
            "Trek to see mountain gorillas in Rwanda's Volcanoes National Park. All-inclusive 4-day package from $3,500 including permits, accommodation, and expert guides. Book now.",
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Gorilla Trekking in Rwanda | From $3,500 | Makisala Safaris',
            description:
                "Trek to see mountain gorillas in Rwanda's Volcanoes National Park. All-inclusive 4-day package from $3,500 including permits, accommodation, and expert guides.",
            images: [
                {
                    url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/w_1200,h_630,c_fill,q_80/v1753389413/Gorilla-Chimpanzee-Safari-_ls4ffr.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Mountain gorilla in Rwanda',
                },
            ],
        },
    }
}

export default function GorillaTrekkingPage() {
    const heroImage =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753389413/Gorilla-Chimpanzee-Safari-_ls4ffr.jpg'

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
                                    name: 'Gorilla Trekking',
                                    url: `${BASE_URL}/gorilla-trekking`,
                                },
                            ],
                        }),
                        FAQSchema({ faqs }),
                        TouristTripSchema({
                            name: 'Gorilla Trekking in Rwanda',
                            description:
                                "Trek to see mountain gorillas in Rwanda's Volcanoes National Park. All-inclusive 4-day package with permits, accommodation, and expert guides.",
                            url: `${BASE_URL}/gorilla-trekking`,
                            pricingStartsFrom: '3500',
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
                <section id="inquiry-form" className="relative min-h-[90vh] lg:min-h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src={heroImage}
                            alt="Mountain gorilla in Rwanda's Volcanoes National Park"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/80" />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-24 pb-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-28 lg:pb-16">
                        {/* Left: Copy */}
                        <div className="flex-1 lg:pr-4">
                            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                                <Shield className="h-4 w-4" />
                                Only 96 permits issued per day — book early
                            </div>

                            <h1 className="mb-5 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                                Gorilla Trekking in Rwanda — Secure Your Permit Before They Sell Out
                            </h1>

                            <p className="mb-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                                Private gorilla trekking tours from{' '}
                                <span className="font-semibold text-white">$3,500 per person</span>{' '}
                                — including the $1,500 government permit, accommodation, guides, and
                                all transfers.
                            </p>

                            <div className="mb-6 flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-white/60" />
                                    Rwanda-based operator
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-white/60" />
                                    Personalized itineraries
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white/60" />
                                    Response within 24 hours
                                </span>
                            </div>

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
                                <span className="text-sm text-white/70">
                                    Rated 5/5 by past trekkers
                                </span>
                            </div>

                            {/* WhatsApp CTA */}
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                <a
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20gorilla%20trekking%20in%20Rwanda.%20Can%20you%20help%20me%20check%20permit%20availability%3F"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                                >
                                    <MessageCircle className="h-5 w-5" />
                                    Chat on WhatsApp — Get a Reply in Minutes
                                </a>
                                <a
                                    href="tel:+255788323254"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
                                >
                                    <Phone className="h-4 w-4" />
                                    Call Us
                                </a>
                            </div>
                        </div>

                        {/* Right: Form */}
                        <div className="w-full shrink-0 lg:w-[420px]">
                            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl md:p-8">
                                <h2 className="mb-1 text-xl font-bold text-gray-900">
                                    Check Permit Availability
                                </h2>
                                <p className="text-muted-foreground mb-5 text-sm">
                                    Tell us your dates — we'll confirm availability and send you a
                                    free, personalized quote. No commitment.
                                </p>
                                <GorillaTrekForm />
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
                                text: 'Rwanda-based operator',
                            },
                            {
                                icon: <Users className="text-primary h-5 w-5" />,
                                text: 'Local expert guides',
                            },
                            {
                                icon: <Shield className="text-primary h-5 w-5" />,
                                text: 'Gorilla permit included',
                            },
                            {
                                icon: <Heart className="text-primary h-5 w-5" />,
                                text: 'Custom itineraries',
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
                                    An Encounter You'll Never Forget
                                </h2>
                                <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
                                    <p>
                                        Trek through the misty bamboo forests of Volcanoes National
                                        Park to meet a habituated family of mountain gorillas. Sit
                                        just seven meters away as silverbacks, mothers, and playful
                                        juveniles go about their day — an hour-long encounter that
                                        most travelers describe as life-changing.
                                    </p>
                                    <p>
                                        Only 96 visitors per day are permitted. Small groups of 8
                                        are led by expert trackers and armed rangers. Your visit
                                        directly funds gorilla conservation and local communities.
                                    </p>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            icon: <TreePine className="h-5 w-5" />,
                                            text: 'Rainforest trekking',
                                        },
                                        {
                                            icon: <Users className="h-5 w-5" />,
                                            text: 'Max 8 per group',
                                        },
                                        {
                                            icon: <Clock className="h-5 w-5" />,
                                            text: '1 hour with gorillas',
                                        },
                                        {
                                            icon: <Heart className="h-5 w-5" />,
                                            text: 'Conservation impact',
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
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                                    <Image
                                        src="https://assets.makisala.com/destinations/rwanda/gorilla_trekking.jpg"
                                        alt="Silverback gorilla in Volcanoes National Park"
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 1024px) 50vw, 25vw"
                                    />
                                </div>
                                <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
                                    <Image
                                        src="https://assets.makisala.com/destinations/rwanda/mountain_gorilla.jpg"
                                        alt="Baby gorilla playing in the undergrowth"
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
                    SECTION 4 — WHAT'S INCLUDED
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-4 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                                Everything Included for $3,500 Per Person
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                                No hidden fees. No surprise costs. One price covers your entire
                                gorilla trekking experience.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: <Mountain className="text-primary h-6 w-6" />,
                                    title: 'Gorilla Trekking Permit',
                                    desc: 'Rwanda permit worth $1,500 included. We secure availability for your dates.',
                                    value: '$1,500 value',
                                },
                                {
                                    icon: <Heart className="text-primary h-6 w-6" />,
                                    title: 'Quality Accommodation',
                                    desc: '3 nights in selected lodges near the park with stunning volcano views.',
                                },
                                {
                                    icon: <Shield className="text-primary h-6 w-6" />,
                                    title: 'Professional Guide',
                                    desc: 'English-speaking guide with years of experience in Volcanoes National Park.',
                                },
                                {
                                    icon: <MapPin className="text-primary h-6 w-6" />,
                                    title: 'All Transportation',
                                    desc: 'Airport pickup, all transfers, and scenic drive through Rwanda.',
                                },
                                {
                                    icon: <Check className="text-primary h-6 w-6" />,
                                    title: 'Park Entry Fees',
                                    desc: 'All national park fees and conservation contributions covered.',
                                },
                                {
                                    icon: <Clock className="text-primary h-6 w-6" />,
                                    title: 'Full Board Meals',
                                    desc: 'All meals included — breakfast, lunch, and dinner throughout your trip.',
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
                    SECTION 5 — SAMPLE ITINERARY
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                            Your 4-Day Itinerary
                        </h2>
                        <p className="text-muted-foreground mb-10 text-lg">
                            A sample schedule — we customize every trip to your preferences.
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
                            Why Book with Makisala
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            {[
                                {
                                    title: 'Based in East Africa',
                                    desc: 'We operate from the ground with direct relationships with parks, lodges, and local guides. No middlemen.',
                                },
                                {
                                    title: 'Permit Secured Directly',
                                    desc: 'We coordinate directly with the Rwanda Development Board to lock your permit as soon as dates are confirmed.',
                                },
                                {
                                    title: 'Direct Communication',
                                    desc: 'You talk to the people who will host you — not a call center. WhatsApp, email, or phone — however you prefer.',
                                },
                                {
                                    title: 'Itinerary Built Around You',
                                    desc: 'Want to extend with a Serengeti safari or Zanzibar beach? We customize around your confirmed permit dates.',
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
                    SECTION 7 — SOCIAL PROOF (TESTIMONIALS)
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-3 text-center text-3xl font-bold md:text-4xl">
                            What Our Trekkers Say
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
                    SECTION 8 — SECOND FORM + CONTACT OPTIONS
                    ============================================================ */}
                <section id="bottom-form" className="bg-gray-900 py-16 lg:py-20">
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                                Check If Your Dates Are Available
                            </h2>
                            <p className="text-lg text-gray-300">
                                Permits sell out months ahead. Tell us when you want to go and we'll
                                confirm availability within 24 hours — no commitment.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <GorillaTrekForm />
                        </div>
                        <div className="mt-8 text-center">
                            <p className="mb-4 text-sm text-gray-400">
                                Prefer to reach us directly?
                            </p>
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <a
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20gorilla%20trekking%20in%20Rwanda.%20Can%20you%20help%20me%20check%20permit%20availability%3F"
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
