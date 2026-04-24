import {
    Binoculars,
    Check,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Mountain,
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

const fallbackReviews = [
    {
        author_name: 'Tatu Msuya',
        text: 'Makisala organized my gorilla trekking trip and it was extraordinary from start to finish. The logistics were seamless, permits ready, early pickup, a skilled driver, and a guide who genuinely cared about everyone\'s comfort. The actual trek was breathtaking, and Makisala made it feel safe, well-planned, and deeply meaningful.',
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
        title: 'Uganda Safari & Gorilla Trekking',
        description:
            'Plan your custom Uganda safari. Gorilla trekking, wildlife game drives, and chimpanzee tracking. All-inclusive packages with local expert guides. Get a free quote.',
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Uganda Safari & Gorilla Trekking',
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
    const reviews = fallbackReviews
    const rating = 5.0
    const totalReviews = 3

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
                                <span className="font-semibold text-white">$2,500 per person</span>.
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
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
                        {/* Google Reviews badge */}
                        <div className="flex items-center gap-2">
                            <Image
                                src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                                alt="Google"
                                width={60}
                                height={20}
                                className="opacity-80"
                            />
                            <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-gray-500">
                                5.0/5 on Google
                            </span>
                        </div>

                        <div className="hidden h-4 w-px bg-gray-200 sm:block" />

                        {[
                            {
                                icon: <MapPin className="text-primary h-4 w-4" />,
                                text: 'East Africa-based',
                            },
                            {
                                icon: <Shield className="text-primary h-4 w-4" />,
                                text: 'Permits secured',
                            },
                            {
                                icon: <Heart className="text-primary h-4 w-4" />,
                                text: '100% custom trips',
                            },
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-1.5 text-sm font-medium text-gray-700"
                            >
                                {item.icon}
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ============================================================
                    SECTION 3 — PAIN POINT + HOW IT WORKS
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="mb-10 text-center">
                            <h2 className="mb-3 text-3xl font-bold md:text-3xl">
                                Planning a Uganda Safari Is Overwhelming
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed">
                                Gorilla permits sell out months ahead. Lodges are hard to vet from
                                abroad. Routes between parks are confusing. And one wrong booking
                                can waste days of your trip.
                            </p>
                            <p className="mt-10 text-base font-semibold">
                                We're based in East Africa. We deal with this every day. Here's how
                                we make it simple:
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    step: '1',
                                    title: 'Share Your Dates & Budget',
                                    desc: 'WhatsApp us or fill out the form — takes 2 minutes.',
                                },
                                {
                                    step: '2',
                                    title: 'We Build Your Itinerary',
                                    desc: 'A personalized trip plan with transparent pricing, sent within 24 hours.',
                                },
                                {
                                    step: '3',
                                    title: 'We Lock In Permits & Lodges',
                                    desc: 'Gorilla permits, vetted lodges, transport — all secured before you pay.',
                                },
                                {
                                    step: '4',
                                    title: 'Land & We Handle the Rest',
                                    desc: 'Airport pickup, every transfer, every meal. You just enjoy the trip.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="text-center">
                                    <div className="bg-primary mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white">
                                        {item.step}
                                    </div>
                                    <h3 className="mb-1 font-semibold">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 3B — WHAT YOU'LL EXPERIENCE (bullet points)
                    ============================================================ */}
                <section className="border-y bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-5 text-3xl font-bold md:text-4xl">
                                    4+ Experiences in One Trip
                                </h2>
                                <div className="space-y-5">
                                    {[
                                        {
                                            icon: <Mountain className="text-primary h-6 w-6" />,
                                            title: 'Mountain Gorilla Trekking',
                                            desc: "One hour with a gorilla family in Bwindi — home to half the world's remaining mountain gorillas.",
                                        },
                                        {
                                            icon: <TreePine className="text-primary h-6 w-6" />,
                                            title: 'Chimpanzee Tracking',
                                            desc: 'Follow chimps through Kibale Forest, the primate capital of the world.',
                                        },
                                        {
                                            icon: <Binoculars className="text-primary h-6 w-6" />,
                                            title: 'Tree-Climbing Lions',
                                            desc: 'Game drive in Queen Elizabeth to see the famous Ishasha tree-climbing lions.',
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
                                        src="https://res.cloudinary.com/dr2tdyz2w/image/upload/q_auto/f_auto/v1775048951/Juvenile-Chimp-in-Kibale-National-Park-Uganda-800x800.jpg_d1y5qz.webp"
                                        alt="Chimpanzee in Kibale Forest"
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
                    SECTION 4 — WHAT'S INCLUDED (compact) + SAMPLE ITINERARIES
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">Sample Itineraries</h2>
                        <p className="text-muted-foreground mb-6 text-lg">
                            Every trip is fully customized. Here are two popular starting points.
                        </p>
                        <div className="text-muted-foreground mb-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            {[
                                'Gorilla permit ($800)',
                                'Accommodation',
                                'All meals',
                                'Expert guides',
                                'Transport & transfers',
                                'Park fees',
                            ].map((item, i) => (
                                <span key={i} className="flex items-center gap-1.5">
                                    <Check className="text-primary h-4 w-4" />
                                    {item}
                                </span>
                            ))}
                        </div>
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
                            href="#bottom-form"
                            className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-100"
                        >
                            Get a Free Quote
                        </a>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 6 — TESTIMONIALS
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <div className="mb-10 flex flex-col items-center gap-3 text-center">
                            <h2 className="text-3xl font-bold md:text-4xl">
                                What Our Travelers Say
                            </h2>
                            <div className="flex items-center gap-2">
                                <Image
                                    src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                                    alt="Google"
                                    width={60}
                                    height={20}
                                    className="opacity-80"
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
                                            <Image
                                                src={review.profile_photo_url}
                                                alt={review.author_name}
                                                width={40}
                                                height={40}
                                                className="rounded-full"
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
                            <p className="mt-3 text-sm text-gray-400">
                                Gorilla permits are limited — only a set number issued per day. Book
                                early to secure your dates.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <UgandaSafariForm />
                        </div>
                        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-gray-400">
                            <span className="flex items-center gap-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                Flexible dates — change anytime before confirmation
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                Free quote, no obligation
                            </span>
                        </div>
                        <div className="mt-6 text-center">
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
