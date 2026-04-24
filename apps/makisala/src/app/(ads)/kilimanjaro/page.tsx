import {
    Check,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Mountain,
    Shield,
    Star,
    Sunrise,
    TrendingUp,
    Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import LandingNav from '@/components/landing-nav'
import KilimanjaroForm from '@/app/(ads)/kilimanjaro/_components/kilimanjaro-form'
import StickyMobileCTA from '@/app/(ads)/kilimanjaro/_components/sticky-mobile-cta'
import { BreadcrumbSchema, FAQSchema, TouristTripSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import { BASE_URL } from '@/lib/constants'
import Image from 'next/image'

const faqs = [
    {
        question: 'How much does it cost to climb Kilimanjaro?',
        answer: 'Our all-inclusive packages start from $2,300 per person for 6 days. Price varies by route, group size, and trip length. This includes park fees ($70/day), guides, porters, meals, camping gear, and transfers. We quote transparently — no hidden costs.',
    },
    {
        question: 'Which route should I choose?',
        answer: 'Machame (6-7 days) is the most popular — great scenery and good acclimatization. Lemosho (7-8 days) is less crowded with the highest success rates. Marangu (5-6 days) is the only route with hut accommodation. We recommend the best route based on your fitness, schedule, and preferences.',
    },
    {
        question: 'How fit do I need to be?',
        answer: "You don't need to be an athlete, but you should be able to walk 4-7 hours a day on uneven terrain. The main challenge is altitude, not technical difficulty. We recommend cardio training 2-3 months before your climb. Our guides manage pace and acclimatization carefully.",
    },
    {
        question: 'What is the success rate?',
        answer: 'The overall summit success rate on Kilimanjaro is around 65%. With our longer routes (7-8 days) and experienced guides who manage acclimatization properly, our clients achieve significantly higher success rates. Route choice and pace are the biggest factors.',
    },
    {
        question: 'When is the best time to climb?',
        answer: 'The best months are January-March and June-October (dry seasons). July-August and December-January are peak seasons with more climbers. We operate year-round — the wet season (April-May, November) has fewer crowds and lower rates.',
    },
    {
        question: 'What is included in the package?',
        answer: 'Everything: park entry fees, professional guides, porters, a cook, all meals on the mountain, camping equipment (tents, sleeping mats), airport transfers, and a pre-climb hotel night. You only need personal gear and flights.',
    },
]

const reviews = [
    {
        author_name: 'Tatu Msuya',
        text: "Makisala organized my gorilla trekking trip and it was extraordinary from start to finish. The logistics were seamless, permits ready, early pickup, a skilled driver, and a guide who genuinely cared about everyone's comfort.",
        rating: 5,
        profile_photo_url:
            'https://lh3.googleusercontent.com/a-/ALV-UjWeEeflHottpvGo6wG1MsBa9JievmHTqZl14xVry4dDr88R_GAY=w144-h144-p-rp-mo-br100',
    },
    {
        author_name: 'Lightness Benedict',
        text: 'I travelled with Makisala on a two day Gorilla trekking in Rwanda, and was pleased with how they handled everything. The vehicle was comfortable, accommodation matched what I was told, and the guide offered helpful local insights.',
        rating: 5,
        profile_photo_url: null,
    },
    {
        author_name: 'Tony Rite',
        text: 'Makisala delivered an incredible Big Five safari. Our guide was skilled at spotting wildlife and gave us so much insight about the animals and the parks. The accommodations and vehicle were very comfortable, and every day felt like a new adventure.',
        rating: 5,
        profile_photo_url:
            'https://lh3.googleusercontent.com/a-/ALV-UjUzYuj_-z7ic5_yYApqM7EdC-EiuxVmlTe5sdSQLXCK-hneYNx2yw=w144-h144-p-rp-mo-ba2-br100',
    },
]

const sampleItineraries = [
    {
        title: '6-Day Machame Route',
        days: [
            {
                name: 'Machame Gate to Machame Camp',
                description:
                    'Drive from Moshi to Machame Gate (1,800m). Trek through rainforest to Machame Camp (3,000m). 5-6 hours.',
            },
            {
                name: 'Machame Camp to Shira Camp',
                description:
                    'Climb through moorland with views of Kibo peak. Reach Shira Plateau (3,840m). 4-5 hours.',
            },
            {
                name: 'Shira Camp to Barranco Camp',
                description:
                    'Acclimatization day — climb high to Lava Tower (4,630m), then descend to Barranco Camp (3,960m). 6-7 hours.',
            },
            {
                name: 'Barranco to Karanga Camp',
                description:
                    'Scramble up the Barranco Wall (no ropes needed). Trek to Karanga Camp (4,035m). 4-5 hours.',
            },
            {
                name: 'Karanga to Barafu Camp',
                description:
                    'Short trek to Barafu Base Camp (4,640m). Rest and prepare for summit night. 3-4 hours.',
            },
            {
                name: 'Summit & Descent',
                description:
                    'Midnight start. Reach Uhuru Peak (5,895m) at sunrise. Descend to Mweka Gate. 12-15 hours total.',
            },
        ],
    },
    {
        title: '7-Day Lemosho Route',
        days: [
            {
                name: 'Londorossi Gate to Big Tree Camp',
                description:
                    'Drive to Londorossi Gate. Trek through lush rainforest to Big Tree Camp (2,780m). 3-4 hours.',
            },
            {
                name: 'Big Tree Camp to Shira 2',
                description:
                    'Cross the Shira Plateau with panoramic views. Camp at Shira 2 (3,900m). 5-6 hours.',
            },
            {
                name: 'Shira 2 to Barranco Camp',
                description:
                    'Acclimatize via Lava Tower (4,630m), descend to Barranco Camp (3,960m). 6-7 hours.',
            },
            {
                name: 'Barranco to Karanga Camp',
                description:
                    'Scale the Barranco Wall. Trek through the Karanga Valley to camp (4,035m). 4-5 hours.',
            },
            {
                name: 'Karanga to Barafu Camp',
                description:
                    'Ascend to Barafu Base Camp (4,640m). Rest and prepare for summit night. 3-4 hours.',
            },
            {
                name: 'Summit Night',
                description:
                    'Midnight start. Push to Stella Point, then Uhuru Peak (5,895m) at sunrise. Descend to Millennium Camp. 12-14 hours.',
            },
            {
                name: 'Descent to Mweka Gate',
                description:
                    'Final descent through rainforest to Mweka Gate. Transfer to hotel in Moshi. 3-4 hours.',
            },
        ],
    },
]

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'Climb Kilimanjaro | From $2,300 All-Inclusive | Makisala',
        description:
            'Climb Mount Kilimanjaro with experienced local guides. All-inclusive packages from $2,300 — park fees, guides, porters, meals, and gear included. Get a free quote.',
        robots: {
            index: false,
            follow: false,
        },
        openGraph: {
            title: 'Climb Kilimanjaro | From $2,300 All-Inclusive | Makisala',
            description:
                'Climb Mount Kilimanjaro with experienced local guides. All-inclusive packages from $2,300 — park fees, guides, porters, meals, and gear included.',
            images: [
                {
                    url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/w_1200,h_630,c_fill,q_80/v1753389413/Gorilla-Chimpanzee-Safari-_ls4ffr.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Mount Kilimanjaro summit',
                },
            ],
        },
    }
}

export default function KilimanjaroPage() {
    const heroImage =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/q_auto/f_auto/v1775043946/page-image_mediaUrl_0cfe10af-6630-4e3e-8cbb-a177b1ae9627_1727884116783_saxeks.avif'

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
                                    name: 'Climb Kilimanjaro',
                                    url: `${BASE_URL}/kilimanjaro`,
                                },
                            ],
                        }),
                        FAQSchema({ faqs }),
                        TouristTripSchema({
                            name: 'Climb Mount Kilimanjaro',
                            description:
                                'All-inclusive Kilimanjaro climbing packages with experienced local guides, porters, meals, and gear.',
                            url: `${BASE_URL}/kilimanjaro`,
                            pricingStartsFrom: '2300',
                            itineraryItems: sampleItineraries[0]!.days,
                        }),
                    ]),
                }}
            />

            <LandingNav ctaText="Get a Free Quote" />
            <StickyMobileCTA />

            <div className="bg-background min-h-screen">
                {/* ============================================================
                    SECTION 1 — HERO WITH INLINE FORM
                    ============================================================ */}
                <section id="inquiry-form" className="relative min-h-[90vh] lg:min-h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src={heroImage}
                            alt="Mount Kilimanjaro summit at sunrise"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/75" />
                    </div>

                    <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8 px-5 pt-24 pb-12 sm:px-8 lg:flex-row lg:items-center lg:gap-12 lg:pt-28 lg:pb-16">
                        <div className="flex-1 lg:pr-4">
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
                                    Rated 5/5 by past climbers
                                </span>
                            </div>

                            <h1 className="mb-5 text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                                Climb Kilimanjaro — All-Inclusive from $2,300
                            </h1>

                            <p className="mb-6 max-w-xl text-lg leading-relaxed text-white/90 md:text-xl">
                                Summit Africa's highest peak with experienced local guides. Park
                                fees, porters, meals, camping gear, and transfers —{' '}
                                <span className="font-semibold text-white">
                                    everything included in one price.
                                </span>
                            </p>

                            <div className="mb-6 flex flex-col gap-3 text-sm text-white/80 sm:flex-row sm:gap-6">
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-white/60" />
                                    Tanzania-based operator
                                </span>
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-white/60" />
                                    Experienced summit guides
                                </span>
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-white/60" />
                                    Reply within 24 hours
                                </span>
                            </div>

                            <div className="mb-6 grid grid-cols-3 gap-3">
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">5,895m</p>
                                    <p className="text-xs text-white/70">Summit elevation</p>
                                </div>
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">6-8 days</p>
                                    <p className="text-xs text-white/70">Trip length</p>
                                </div>
                                <div className="rounded-lg bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
                                    <p className="text-lg font-bold text-white">All-inclusive</p>
                                    <p className="text-xs text-white/70">No hidden fees</p>
                                </div>
                            </div>

                            <a
                                href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20climbing%20Kilimanjaro.%20Can%20you%20help%20me%20plan%20my%20climb%3F"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Prefer WhatsApp? Chat with us now
                            </a>
                        </div>

                        <div className="w-full shrink-0 lg:w-[420px]">
                            <div className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl md:p-8">
                                <h2 className="mb-1 text-xl font-bold text-gray-900">
                                    Get a Free Quote
                                </h2>
                                <p className="text-muted-foreground mb-5 text-sm">
                                    Tell us your dates and preferred route. We'll send a
                                    personalized quote within 24 hours.
                                </p>
                                <KilimanjaroForm />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 2 — TRUST SIGNALS BAR
                    ============================================================ */}
                <section className="border-b bg-white py-6">
                    <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6">
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
                            <span className="text-xs text-gray-500">5.0/5 on Google</span>
                        </div>

                        <div className="hidden h-4 w-px bg-gray-200 sm:block" />

                        {[
                            {
                                icon: <MapPin className="text-primary h-4 w-4" />,
                                text: 'Based in Tanzania',
                            },
                            {
                                icon: <Shield className="text-primary h-4 w-4" />,
                                text: 'Licensed operator',
                            },
                            {
                                icon: <Heart className="text-primary h-4 w-4" />,
                                text: 'Custom routes',
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
                                Planning a Kilimanjaro Climb Is Stressful
                            </h2>
                            <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-relaxed">
                                Which route? How many days? Are the guides legit? Will the gear be
                                good enough? One bad operator can ruin the experience — or worse,
                                put your safety at risk.
                            </p>
                            <p className="mt-10 text-base font-semibold">
                                We're based at the foot of Kilimanjaro. We send teams up every week.
                                Here's how we make it simple:
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    step: '1',
                                    title: 'Tell Us Your Dates',
                                    desc: "WhatsApp us or fill out the form — we'll recommend the best route for you.",
                                },
                                {
                                    step: '2',
                                    title: 'Get a Custom Quote',
                                    desc: 'Transparent pricing with everything listed. No surprises at the gate.',
                                },
                                {
                                    step: '3',
                                    title: 'We Handle Everything',
                                    desc: 'Park fees, guides, porters, meals, gear, hotel — all booked and confirmed.',
                                },
                                {
                                    step: '4',
                                    title: 'Fly In & Climb',
                                    desc: 'We pick you up at Kilimanjaro Airport. Your team is ready. You just climb.',
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
                    SECTION 3B — WHY KILIMANJARO (bullet points)
                    ============================================================ */}
                <section className="border-y bg-gray-50 py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <div className="grid items-center gap-10 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-5 text-3xl font-bold md:text-4xl">
                                    What Makes This Climb Special
                                </h2>
                                <div className="space-y-5">
                                    {[
                                        {
                                            icon: <Mountain className="text-primary h-6 w-6" />,
                                            title: 'Roof of Africa',
                                            desc: 'Stand on the highest point in Africa at 5,895m — no technical climbing skills required.',
                                        },
                                        {
                                            icon: <Sunrise className="text-primary h-6 w-6" />,
                                            title: 'Sunrise Above the Clouds',
                                            desc: 'Summit at dawn and watch the sun rise over the African continent from Uhuru Peak.',
                                        },
                                        {
                                            icon: <TrendingUp className="text-primary h-6 w-6" />,
                                            title: '5 Climate Zones',
                                            desc: 'Trek from tropical rainforest through moorland, alpine desert, and glaciers in a single climb.',
                                        },
                                        {
                                            icon: <Heart className="text-primary h-6 w-6" />,
                                            title: 'Life-Changing Experience',
                                            desc: 'Join the 35,000 climbers per year who push their limits on this iconic mountain.',
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
                            <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                                <Image
                                    src="https://res.cloudinary.com/dr2tdyz2w/image/upload/q_auto/f_auto/v1775044303/kilimanjaro_400975-320_kvdv7c.jpg"
                                    alt="Climbers on Mount Kilimanjaro"
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================================
                    SECTION 4 — SAMPLE ITINERARIES
                    ============================================================ */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">Sample Routes</h2>
                        <p className="text-muted-foreground mb-6 text-lg">
                            We'll recommend the best route based on your fitness, schedule, and
                            goals.
                        </p>
                        <div className="text-muted-foreground mb-10 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                            {[
                                'Park fees',
                                'Professional guides',
                                'Porters & cooks',
                                'All meals',
                                'Airport transfers',
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
                                Ready to climb? It starts with a message.
                            </h3>
                            <p className="mt-1 text-sm text-white/80">
                                Tell us your dates and we'll send you a route recommendation and
                                quote within 24 hours.
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
                    SECTION 5 — TESTIMONIALS
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
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ))}
                                </div>
                                <span className="text-sm text-gray-500">5.0/5 on Google</span>
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
                    SECTION 6 — BOTTOM FORM + CONTACT
                    ============================================================ */}
                <section id="bottom-form" className="bg-gray-900 py-16 lg:py-20">
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-3 text-3xl font-bold text-white md:text-4xl">
                                Ready to Climb?
                            </h2>
                            <p className="text-lg text-gray-300">
                                Tell us your dates and preferred route. We'll send you a
                                personalized quote within 24 hours. No commitment.
                            </p>
                            <p className="mt-3 text-sm text-gray-400">
                                Peak season spots fill up fast — book early to secure your dates.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-700 bg-white p-6 shadow-xl md:p-8">
                            <KilimanjaroForm />
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
                                    href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20climbing%20Kilimanjaro.%20Can%20you%20help%20me%20plan%20my%20climb%3F"
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
