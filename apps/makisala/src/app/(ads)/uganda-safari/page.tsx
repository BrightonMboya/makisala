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
import UgandaSafariForm from '@/app/(ads)/uganda-safari/_components/uganda-safari-form'
import StickyMobileCTA from '@/app/(ads)/uganda-safari/_components/sticky-mobile-cta'
import { BreadcrumbSchema, FAQSchema, TouristTripSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import { BASE_URL } from '@/lib/constants'
import Image from 'next/image'

const faqs = [
    {
        question: 'How much does a Uganda safari cost?',
        answer: 'Uganda safari packages typically range from $2,000-$5,000 per person depending on duration, accommodations, and activities. Gorilla trekking permits are $800 per person. We build custom itineraries for every budget. Tell us what you want and we will quote you a transparent, all-inclusive price.',
    },
    {
        question: 'Is Uganda safe for tourists?',
        answer: 'Yes. Uganda is one of the safest countries in East Africa for tourism. National parks are well-managed with professional rangers and guides. Tourist areas have excellent infrastructure. We handle all logistics and are on the ground with you throughout.',
    },
    {
        question: 'When is the best time to visit Uganda?',
        answer: 'Uganda is a year-round destination. The dry seasons (June-September and December-February) offer the best trekking conditions and wildlife viewing. The wet seasons have fewer tourists and lush green landscapes, great for photography and lower rates.',
    },
    {
        question: 'How physically demanding is gorilla trekking in Uganda?',
        answer: 'Gorilla trekking in Bwindi involves hiking through dense forest at altitude. Treks can range from 1 to 6 hours depending on gorilla family locations. Porters are available to assist you. A reasonable level of fitness is recommended but no prior trekking experience is needed.',
    },
    {
        question: 'What makes Uganda unique for gorilla trekking?',
        answer: "Uganda is home to over half the world's remaining mountain gorillas, primarily in Bwindi Impenetrable Forest, one of the oldest rainforests on Earth. Beyond gorillas, Uganda lets you combine trekking with wildlife safaris, chimpanzee tracking, and boat cruises in a single trip.",
    },
    {
        question: 'How far in advance should I book?',
        answer: 'We recommend booking 3-6 months in advance, especially for peak season (June-September, December-February). Gorilla permits are limited and sell out. We can sometimes secure last-minute permits but early booking guarantees your dates.',
    },
]

const testimonials = [
    {
        name: 'Rachel & Tom W.',
        location: 'New York, USA',
        initials: 'RT',
        text: 'We did gorillas in Bwindi and a game drive in Queen Elizabeth. Saw tree-climbing lions on the same trip. Makisala planned everything perfectly. Uganda exceeded every expectation.',
        rating: 5,
    },
    {
        name: 'David M.',
        location: 'San Francisco, USA',
        initials: 'DM',
        text: "Gorillas in Bwindi, chimps in Kibale, and a safari in Queen Elizabeth, all in one trip. Makisala put together an incredible itinerary. Best travel decision I've ever made.",
        rating: 5,
    },
    {
        name: 'Lisa & Mark H.',
        location: 'Chicago, USA',
        initials: 'LM',
        text: 'Our guide knew exactly where to find the gorilla family. One hour sitting with them in the forest felt like a lifetime. Makisala handled every detail so we could just be present.',
        rating: 5,
    },
]

const sampleItineraries = [
    {
        title: '3-Day Gorilla Trek',
        days: [
            {
                name: 'Arrive in Entebbe',
                description:
                    'Airport pickup. Fly or drive to Bwindi Impenetrable Forest. Evening briefing at your lodge.',
            },
            {
                name: 'Gorilla Trekking',
                description:
                    'Early morning briefing at park HQ. Trek into the forest to spend one hour with a habituated gorilla family. Afternoon at leisure.',
            },
            {
                name: 'Departure',
                description:
                    'Morning community walk or Batwa cultural experience. Transfer back to Entebbe for your flight.',
            },
        ],
    },
    {
        title: '5-Day Gorilla + Safari',
        days: [
            {
                name: 'Arrive in Entebbe',
                description: 'Airport pickup and overnight in Entebbe or Kampala.',
            },
            {
                name: 'Transfer to Bwindi',
                description:
                    'Scenic drive or domestic flight to Bwindi Impenetrable Forest. Afternoon nature walk.',
            },
            {
                name: 'Gorilla Trekking',
                description:
                    'Full-day gorilla trekking experience. One hour with a gorilla family in their natural habitat.',
            },
            {
                name: 'Queen Elizabeth National Park',
                description:
                    'Drive to Queen Elizabeth NP. Afternoon boat cruise on the Kazinga Channel with hippos, elephants, and birdlife.',
            },
            {
                name: 'Game Drive & Departure',
                description:
                    'Early morning game drive in Ishasha sector, famous for tree-climbing lions. Transfer to Entebbe.',
            },
        ],
    },
]

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Uganda Safari & Gorilla Trekking | Custom Trips | Makisala Safaris',
        description:
            'Plan your custom Uganda safari. Gorilla trekking, wildlife game drives, and chimpanzee tracking. All-inclusive packages with local expert guides. Get a free quote.',
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Uganda Safari & Gorilla Trekking | Custom Trips | Makisala Safaris',
            description:
                'Plan your custom Uganda safari. Gorilla trekking, wildlife game drives, and chimpanzee tracking. All-inclusive packages with local expert guides.',
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

export default function UgandaSafariPage() {
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
                                    name: 'Uganda Safari',
                                    url: `${BASE_URL}/uganda-safari`,
                                },
                            ],
                        }),
                        FAQSchema({ faqs }),
                        TouristTripSchema({
                            name: 'Uganda Safari & Gorilla Trekking',
                            description:
                                'Custom Uganda safari packages including gorilla trekking, wildlife game drives, and chimpanzee tracking with local expert guides.',
                            url: `${BASE_URL}/uganda-safari`,
                            pricingStartsFrom: '2000',
                            itineraryItems: sampleItineraries[1]!.days,
                        }),
                    ]),
                }}
            />

            <style>{`html > footer { display: none !important; } .woot-widget-bubble, .woot-widget-holder, .woot--bubble-holder { display: none !important; }`}</style>
            <LandingNav ctaText="Get a Free Quote" />
            <StickyMobileCTA />

            <div className="bg-background min-h-screen">
                {/* ============================================================
                    SECTION 1 — HERO WITH INLINE FORM (ABOVE THE FOLD)
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
                                Plan Your Uganda Safari: Gorillas, Wildlife & More
                            </h1>

                            <p className="mb-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                                Custom all-inclusive safari packages from{' '}
                                <span className="font-semibold text-white">$2,000 per person</span>.
                                Gorilla trekking, wildlife game drives, chimpanzee tracking. We
                                build your perfect Uganda trip from scratch.
                            </p>

                            <div className="mb-6 flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-white/60" />
                                    East Africa-based operator
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-white/60" />
                                    100% custom itineraries
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white/60" />
                                    Reply within 24 hours
                                </span>
                            </div>

                            {/* Price anchoring */}
                            <div className="mb-6 grid grid-cols-3 gap-3">
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">4+ experiences</p>
                                    <p className="text-xs text-white/70">In one trip</p>
                                </div>
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">3-10 days</p>
                                    <p className="text-xs text-white/70">Trip length</p>
                                </div>
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">All-inclusive</p>
                                    <p className="text-xs text-white/70">No hidden fees</p>
                                </div>
                            </div>

                            {/* Single WhatsApp CTA on left */}
                            <a
                                href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20a%20Uganda%20safari.%20Can%20you%20help%20me%20plan%20a%20trip%3F"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Prefer WhatsApp? Chat with us now
                            </a>
                        </div>

                        {/* Right: Form */}
                        <div className="w-full shrink-0 lg:w-[420px]">
                            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl md:p-8">
                                <h2 className="mb-1 text-xl font-bold text-gray-900">
                                    Get a Free Quote
                                </h2>
                                <p className="text-muted-foreground mb-5 text-sm">
                                    Tell us what you're looking for. We'll build a personalized
                                    itinerary and quote within 24 hours.
                                </p>
                                <UgandaSafariForm />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 2 — TRUST SIGNALS BAR
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
                    SECTION 3 — WHY UGANDA
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-5 text-3xl font-bold md:text-4xl">
                                    Why Uganda Is the Ultimate Safari Destination
                                </h2>
                                <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
                                    <p>
                                        Uganda packs more diversity into one trip than almost
                                        anywhere in Africa. Trek to see mountain gorillas in
                                        Bwindi's ancient forests, spot tree-climbing lions in Queen
                                        Elizabeth National Park, track chimpanzees in Kibale, and
                                        cruise past hippos on the Kazinga Channel, all in a single
                                        journey.
                                    </p>
                                    <p>
                                        With half the world's remaining mountain gorillas living in
                                        Bwindi Impenetrable Forest, Uganda is where gorilla trekking
                                        began, and it remains the most authentic way to experience
                                        it.
                                    </p>
                                </div>
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            icon: <Mountain className="h-5 w-5" />,
                                            text: 'Mountain gorillas',
                                        },
                                        {
                                            icon: <TreePine className="h-5 w-5" />,
                                            text: 'Chimpanzee tracking',
                                        },
                                        {
                                            icon: <Binoculars className="h-5 w-5" />,
                                            text: 'Tree-climbing lions',
                                        },
                                        {
                                            icon: <Heart className="h-5 w-5" />,
                                            text: 'Kazinga Channel cruise',
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
                    SECTION 4 — WHAT'S INCLUDED
                    ============================================================ */}
                <section className="bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="mb-4 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                                Every Trip Is All-Inclusive
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                                One transparent price. No hidden fees. No surprises.
                            </p>
                        </div>
                        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[
                                {
                                    icon: <Mountain className="text-primary h-6 w-6" />,
                                    title: 'Gorilla Trekking Permit',
                                    desc: 'Uganda permit ($800) secured and included. We handle all permit logistics for your dates.',
                                    value: 'Permit included',
                                },
                                {
                                    icon: <Heart className="text-primary h-6 w-6" />,
                                    title: 'Quality Accommodation',
                                    desc: 'Hand-picked lodges and camps near national parks. From comfortable mid-range to luxury, your choice.',
                                },
                                {
                                    icon: <Shield className="text-primary h-6 w-6" />,
                                    title: 'Expert Local Guides',
                                    desc: "English-speaking guides with years of experience in Uganda's national parks and forests.",
                                },
                                {
                                    icon: <MapPin className="text-primary h-6 w-6" />,
                                    title: 'All Transportation',
                                    desc: 'Airport pickup, all transfers in 4WD vehicles, and domestic flights where needed.',
                                },
                                {
                                    icon: <Check className="text-primary h-6 w-6" />,
                                    title: 'Park & Activity Fees',
                                    desc: 'All national park entrance fees, boat cruises, and activity charges covered.',
                                },
                                {
                                    icon: <Clock className="text-primary h-6 w-6" />,
                                    title: 'Full Board Meals',
                                    desc: 'All meals included throughout your trip. Breakfast, lunch, and dinner.',
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
                    SECTION 5 — SAMPLE ITINERARIES
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">Sample Itineraries</h2>
                        <p className="text-muted-foreground mb-10 text-lg">
                            Every trip is fully customized. Here are two popular starting points.
                        </p>
                        <div className="grid gap-12 lg:grid-cols-2">
                            {sampleItineraries.map((itinerary, idx) => (
                                <div key={idx}>
                                    <h3 className="mb-6 text-xl font-bold">{itinerary.title}</h3>
                                    <div className="space-y-0">
                                        {itinerary.days.map((day, index) => (
                                            <div
                                                key={index}
                                                className="relative flex gap-4 pb-6 last:pb-0"
                                            >
                                                {index < itinerary.days.length - 1 && (
                                                    <div className="bg-primary/20 absolute top-10 left-5 h-full w-px" />
                                                )}
                                                <div className="bg-primary relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1 rounded-xl border bg-white p-4 shadow-sm">
                                                    <h4 className="mb-1 font-semibold">
                                                        Day {index + 1}: {day.name}
                                                    </h4>
                                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                                        {day.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    MID-PAGE CTA
                    ============================================================ */}
                <section className="bg-primary py-10">
                    <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 px-6 text-center sm:flex-row sm:text-left">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-white sm:text-2xl">
                                Like what you see? Let's plan your trip.
                            </h3>
                            <p className="mt-1 text-sm text-white/80">
                                Tell us your dates and we'll send you a personalized itinerary
                                within 24 hours.
                            </p>
                        </div>
                        <a
                            href="#inquiry-form"
                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
                        >
                            Get a Free Quote
                        </a>
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
                                    desc: 'We operate from the ground with direct relationships with parks, lodges, and local guides across Uganda. No middlemen, no markups.',
                                },
                                {
                                    title: 'We Handle the Permits',
                                    desc: 'Uganda gorilla permits sell out months ahead. We coordinate directly with UWA to secure yours as soon as you confirm dates.',
                                },
                                {
                                    title: 'Talk to a Real Person',
                                    desc: 'You talk to the people who will host you, not a call center. WhatsApp, email, or phone, however you prefer.',
                                },
                                {
                                    title: 'Built Around You',
                                    desc: 'No set packages. Tell us your dates, interests, and budget. We build a trip that fits, whether it is 3 days or 10.',
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
                    SECTION 7 — TESTIMONIALS
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
                    SECTION 8 — BOTTOM FORM + CONTACT
                    ============================================================ */}
                <section id="bottom-form" className="bg-gray-900 py-16 lg:py-20">
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                                Ready to Start Planning?
                            </h2>
                            <p className="text-lg text-gray-300">
                                Tell us what you're dreaming of and we'll send you a free,
                                personalized itinerary within 24 hours. No commitment.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <UgandaSafariForm />
                        </div>
                        <div className="mt-8 text-center">
                            <p className="mb-4 text-sm text-gray-400">
                                Prefer to reach us directly?
                            </p>
                            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                                <a
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20a%20Uganda%20safari.%20Can%20you%20help%20me%20plan%20a%20trip%3F"
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
