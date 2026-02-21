import { Button } from '@repo/ui/button'
import {
    Camera,
    Check,
    Clock,
    Heart,
    MapPin,
    MessageCircle,
    Mountain,
    Quote,
    Shield,
    Star,
    Users,
} from 'lucide-react'
import type { Metadata } from 'next'
import ContactForm from '@/components/contact-form'
import LandingNav from '@/components/landing-nav'
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
        answer: 'You will be within 7 meters (about 23 feet) of a gorilla family. The encounter lasts one hour, during which you can observe and photograph these gentle giants in their natural habitat. It is a profoundly intimate wildlife experience.',
    },
    {
        question: 'When is the best time to go gorilla trekking?',
        answer: 'Gorilla trekking is possible year-round, but the dry seasons (June-September and December-February) offer the easiest trekking conditions. The wet season (March-May, October-November) has fewer visitors and lower rates, but trails can be muddy.',
    },
    {
        question: 'Is gorilla trekking safe?',
        answer: 'Yes. Mountain gorillas are habituated to human presence and are gentle by nature. You are accompanied by experienced trackers and armed rangers at all times. Rwanda and Uganda both have excellent safety records for gorilla trekking.',
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
        avatar: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1771673594/thispersondoesnotexist.com_winzmz.jpg',
        text: 'We saw a silverback with twin babies — our guide Joseph knew exactly where to find the Susa family. The hour we spent with them felt like five minutes. Worth every penny.',
    },
    {
        name: 'Michael T.',
        location: 'Toronto, Canada',
        avatar: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1771673624/thispersondoesnotexist.com_lhoykn.jpg',
        text: 'Makisala handled everything flawlessly. Permits, transport, a beautiful lodge with volcano views. All we had to do was show up and trek. The gorilla encounter changed my perspective on wildlife forever.',
    },
    {
        name: 'Anna & David R.',
        location: 'Sydney, Australia',
        avatar: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1771673637/thispersondoesnotexist.com_lbc4hj.jpg',
        text: 'We compared five operators before choosing Makisala. Best decision — they secured our permits when everyone else said June was sold out. The experience itself was beyond words.',
    },
]

const galleryImages = [
    {
        src: 'https://assets.makisala.com/destinations/rwanda/gorilla_trekking.jpg',
        alt: 'Silverback gorilla in Volcanoes National Park',
        tall: false,
    },
    {
        src: 'https://assets.makisala.com/destinations/rwanda/gorilla_trekking_rwandajpg.jpg',
        alt: 'Trekking group hiking through bamboo forest',
        tall: false,
    },
    {
        src: 'https://assets.makisala.com/destinations/rwanda/mountain_gorilla.jpg',
        alt: 'Baby gorilla playing in the undergrowth',
        tall: false,
    },
    {
        src: 'https://assets.makisala.com/destinations/rwanda/mountain_gorilla_rwanda.jpg',
        alt: 'Virunga Mountains landscape at sunrise',
        tall: false,
    },
    {
        src: 'https://assets.makisala.com/destinations/rwanda/volcanoes_national_park.jpg',
        alt: 'Safari lodge with volcano views',
        tall: false,
    },
    {
        src: 'https://assets.makisala.com/destinations/rwanda/rwanda_mountain_gorilla_trekking.jpg',
        alt: 'Gorilla family resting in a clearing',
        tall: false,
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
            'Early morning briefing at park headquarters, then trek into the bamboo forest to meet a habituated gorilla family. One unforgettable hour with the gorillas.',
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

            {/* Hide the global footer on this landing page to keep visitors focused */}
            {/* eslint-disable-next-line react/no-unknown-property */}
            <style>{`html > footer { display: none !important; }`}</style>
            <LandingNav />
            <div className="bg-background min-h-screen">
                {/* Hero Section */}
                <section className="relative flex h-[80dvh] items-center justify-start lg:h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src={heroImage}
                            alt="Mountain gorilla in Rwanda's Volcanoes National Park"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/50 lg:bg-black/75" />
                    </div>
                    <div className="relative z-10 mt-20 px-6 sm:px-10 lg:px-16">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                            <Shield className="h-4 w-4 text-white" />
                            Only 96 permits issued per day
                        </div>
                        <h1 className="mb-4 max-w-4xl text-3xl font-bold text-white md:text-6xl lg:text-7xl">
                            Secure Your Gorilla Trekking Permit in Rwanda — Without the Stress
                        </h1>
                        <p className="mb-5 max-w-2xl text-xl font-light text-white/90 md:text-2xl">
                            We handle the limited-entry permit, expert guides, accommodation, and
                            transport so your dates are locked before they sell out.
                        </p>
                        <div className="mb-6 max-w-2xl space-y-2 text-base text-white/90">
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 shrink-0 text-green-400" />
                                <span>
                                    Guaranteed permit handling (only 96 permits issued per day)
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 shrink-0 text-green-400" />
                                <span>
                                    Fixed 4-day itinerary designed around permit availability
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 shrink-0 text-green-400" />
                                <span>
                                    Local team on the ground managing logistics from arrival to trek
                                </span>
                            </div>
                        </div>
                        <p className="mb-8 text-lg font-semibold text-white">
                            From <span className="text-3xl">$3,500</span> per person
                        </p>
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <a href="#inquiry-form">
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg font-medium"
                                >
                                    <Users className="mr-2 h-5 w-5" />
                                    Check Permit Availability
                                </Button>
                            </a>
                            <a href="#whats-included">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-2 border-white bg-transparent px-8 py-3 text-lg font-medium text-white hover:bg-white hover:text-black"
                                >
                                    See What's Included
                                </Button>
                            </a>
                        </div>
                    </div>
                </section>

                {/* Trust Bar */}
                <section className="border-b bg-white py-6">
                    <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-8 px-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Shield className="text-primary h-5 w-5" />
                            <span>Permits Guaranteed</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                            <span>4.9/5 from 120+ Reviews</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            <span>Free Cancellation up to 60 Days</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span>Based in East Africa Since 2022</span>
                        </div>
                        <a
                            href="https://wa.me/255788323254"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-green-700 hover:text-green-800"
                        >
                            <MessageCircle className="h-5 w-5" />
                            <span>WhatsApp Us</span>
                        </a>
                    </div>
                </section>

                {/* How Permits Work */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                            How Gorilla Trekking Permits Work
                        </h2>
                        <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
                            <p>
                                Gorilla trekking is strictly regulated. Only a small number of
                                visitors are allowed each day, and permits are assigned to specific
                                dates — they cannot be held without commitment.
                            </p>
                            <p>Our role is to:</p>
                            <ul className="ml-6 list-disc space-y-2">
                                <li>Secure your permit for your travel dates</li>
                                <li>Build the itinerary around that confirmed permit</li>
                                <li>Manage all transport and lodging logistics once locked</li>
                            </ul>
                        </div>
                        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
                            <p className="text-sm font-medium text-amber-800">
                                <strong>Important:</strong> Once permits for a date are sold out, no
                                additional visitors can trek that day.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Why This Experience Is So Limited */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                            Why This Experience Is So Limited
                        </h2>
                        <div className="text-muted-foreground space-y-4 text-lg leading-relaxed">
                            <p>
                                You trek in small, ranger-led groups to visit one specific
                                habituated gorilla family.
                            </p>
                            <p>
                                Each visit is strictly limited to one hour to protect the animals
                                and minimize human impact.
                            </p>
                            <p>
                                There are no vehicles, no viewing platforms, and no large crowds —
                                the final approach is done on foot through the forest with trained
                                guides and trackers.
                            </p>
                            <p>
                                Because of these conservation rules, only a small number of permits
                                are issued each day, which is why securing dates in advance is
                                essential.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Photo Gallery */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-6xl px-6">
                        <h2 className="mb-3 text-center text-3xl font-bold md:text-4xl">
                            Moments from the Trek
                        </h2>
                        <p className="text-muted-foreground mb-10 text-center text-lg">
                            Real photos from our gorilla trekking expeditions
                        </p>
                        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
                            {galleryImages.map((img, i) => (
                                <div
                                    key={i}
                                    className="mb-4 break-inside-avoid overflow-hidden rounded-xl"
                                >
                                    <div
                                        className={`relative ${img.tall ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}
                                    >
                                        <Image
                                            src={img.src}
                                            alt={img.alt}
                                            fill
                                            className="object-cover transition-transform duration-300 hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* What's Included */}
                <section id="whats-included" className="bg-gray-50 py-16 lg:py-20">
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
                                    desc: 'Rwanda permit worth $1,500 included. Guaranteed availability when you book with us.',
                                },
                                {
                                    icon: <Shield className="text-primary h-6 w-6" />,
                                    title: 'Expert Guides & Trackers',
                                    desc: 'English-speaking guides with years of experience in Volcanoes National Park.',
                                },
                                {
                                    icon: <Heart className="text-primary h-6 w-6" />,
                                    title: 'Quality Accommodation',
                                    desc: '3 nights in carefully selected lodges near the park with stunning volcano views.',
                                },
                                {
                                    icon: <MapPin className="text-primary h-6 w-6" />,
                                    title: 'All Ground Transport',
                                    desc: "Airport pickup, all transfers, and a scenic drive through Rwanda's rolling hills.",
                                },
                                {
                                    icon: <Camera className="text-primary h-6 w-6" />,
                                    title: 'Full Board Meals',
                                    desc: 'All meals included — breakfast, lunch, and dinner throughout your trip.',
                                },
                                {
                                    icon: <Clock className="text-primary h-6 w-6" />,
                                    title: 'Park & Entry Fees',
                                    desc: 'All national park fees and conservation contributions are covered.',
                                },
                            ].map((item, i) => (
                                <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
                                    <div className="mb-3">{item.icon}</div>
                                    <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Itinerary Overview */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-3 text-3xl font-bold md:text-4xl">
                            Your 4-Day Itinerary
                        </h2>
                        <p className="text-muted-foreground mb-10 text-lg">
                            Every detail planned so you can focus on the experience.
                        </p>
                        <div className="space-y-6">
                            {itineraryDays.map((day, index) => (
                                <div key={index} className="flex gap-4 rounded-xl border p-6">
                                    <div className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                                        {index + 1}
                                    </div>
                                    <div>
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

                {/* Booking With Confidence */}
                <section className="border-y bg-white py-12">
                    <div className="mx-auto max-w-5xl px-6">
                        <h2 className="mb-8 text-center text-2xl font-bold md:text-3xl">
                            Booking With Confidence
                        </h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            <div className="flex items-start gap-3 text-center md:flex-col md:items-center">
                                <MapPin className="text-primary h-6 w-6 shrink-0" />
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Local East Africa–based operations team
                                </p>
                            </div>
                            <div className="flex items-start gap-3 text-center md:flex-col md:items-center">
                                <Shield className="text-primary h-6 w-6 shrink-0" />
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    Direct coordination with park authorities and licensed guides
                                </p>
                            </div>
                            <div className="flex items-start gap-3 text-center md:flex-col md:items-center">
                                <Users className="text-primary h-6 w-6 shrink-0" />
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    On-the-ground support from arrival to departure
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Testimonials */}
                <section className="bg-gray-50 py-16 lg:py-20">
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
                                    <Quote className="text-primary/30 mb-3 h-8 w-8" />
                                    <p className="text-muted-foreground mb-4 leading-relaxed">
                                        {t.text}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200">
                                            <Image
                                                src={t.avatar}
                                                alt={t.name}
                                                fill
                                                className="object-cover"
                                                sizes="40px"
                                            />
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

                {/* Why Makisala */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-10 text-center text-3xl font-bold md:text-4xl">
                            Why Book with Makisala
                        </h2>
                        <div className="grid gap-8 md:grid-cols-2">
                            {[
                                {
                                    title: 'We Live Here',
                                    desc: 'Based in East Africa, we have direct relationships with parks, lodges, and local guides. No middlemen, no markups.',
                                },
                                {
                                    title: 'Permit Guarantee',
                                    desc: 'Gorilla permits sell out months ahead. We secure yours the moment you book, so your spot is guaranteed.',
                                },
                                {
                                    title: 'Small Group, Big Experience',
                                    desc: 'Only 8 people are allowed per gorilla family per day. We keep groups intimate for a personal encounter.',
                                },
                                {
                                    title: 'Flexible Planning',
                                    desc: 'Want to add a Serengeti safari or Zanzibar beach extension? We customize every trip to fit your travel goals.',
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

                {/* Price Anchor + CTA */}
                <section className="py-16 lg:py-20">
                    <div className="mx-auto max-w-3xl px-6 text-center">
                        <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                            All-Inclusive from $3,500 Per Person
                        </h2>
                        <p className="text-muted-foreground mb-3 text-lg">
                            Your gorilla permit alone costs $1,500. This package covers everything
                            else — lodging, meals, transport, guides, and park fees — for just
                            $2,000 more.
                        </p>
                        <p className="text-muted-foreground mb-3 max-w-2xl mx-auto text-base">
                            To secure your trekking permit, a deposit equal to the permit cost is
                            required. This allows us to lock your date with the park immediately.
                            The remaining balance is scheduled after your itinerary is finalized.
                        </p>
                        <p className="mb-8 text-sm font-medium text-amber-700">
                            June — September 2026 permits are filling fast
                        </p>
                        <a href="#inquiry-form">
                            <Button
                                size="lg"
                                className="bg-primary hover:bg-primary/90 px-10 py-3 text-lg font-medium"
                            >
                                <Users className="mr-2 h-5 w-5" />
                                Check Availability
                            </Button>
                        </a>
                    </div>
                </section>

                {/* FAQ */}
                <FAQ faqs={faqs} />

                {/* Inline Inquiry Form */}
                <section
                    id="inquiry-form"
                    className="from-primary/10 to-secondary/10 bg-gradient-to-r py-20"
                >
                    <div className="mx-auto max-w-xl px-6">
                        <div className="mb-8 text-center">
                            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                                Check Date & Permit Availability
                            </h2>
                            <p className="text-muted-foreground text-lg">
                                Tell us your preferred dates and group size — we'll confirm
                                availability and next steps within 24 hours.
                            </p>
                            <p className="mt-2 text-sm font-medium text-amber-700">
                                Peak season permits (June — September 2026) are selling out
                            </p>
                        </div>
                        <div className="rounded-xl border bg-white p-6 shadow-sm md:p-8">
                            <ContactForm />
                        </div>
                        <div className="mt-6 text-center">
                            <p className="text-muted-foreground mb-3 text-sm">
                                Prefer to chat? Reach us directly:
                            </p>
                            <a
                                href="https://wa.me/255788323254"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700"
                            >
                                <MessageCircle className="h-5 w-5" />
                                WhatsApp: +255 788 323 254
                            </a>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
