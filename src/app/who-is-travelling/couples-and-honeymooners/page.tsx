import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { InquiryDialog } from '@/components/enquire-dialog-button'
import { BreadcrumbSchema } from '@/components/schema'
import Script from 'next/script'
import Image from 'next/image'
import { getTours } from '@/lib/cms-service'
import TourCard from '@/app/safaris/[country]/[modifier]/_components/TourCard'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Romantic African Honeymoon Safaris | Makisala Safaris`,
        description:
            'Celebrate your love on a private African safari. Luxury camps, candlelit dinners, and once-in-a-lifetime experiences made for two.',
        openGraph: {
            title: `Romantic African Honeymoon Safaris | Makisala Safaris`,
            description: `Celebrate your love on a private African safari. Luxury camps, candlelit dinners, and once-in-a-lifetime experiences made for two.`,
            images: [
                {
                    url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366416/Joys-Camp-1_nbu2ps.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Makisala Safaris',
                },
            ],
        },
    }
}

export default async function Page() {
    const honeymoonHero =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366509/honeymoon-safaris-8_mtemjt.jpg'
    const luxuryTent =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366416/Joys-Camp-1_nbu2ps.jpg'
    const romanticDinner =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366308/honeymoon-safaris-tanzania_wsl3ys.jpg'

    const tours = await getTours('tanzania', 'honeymoon')
    return (
        <main>
            <Script
                type={'application/ld+json'}
                strategy={'lazyOnload'}
                id="schema-script"
            >
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                            {
                                name: 'Couples and Honeymooners Safari',
                                url: 'https://www.makisala.com/who-is-travelling/couples-and-honeymooners',
                            },
                        ],
                    }),
                ])}
            </Script>

            <div className="bg-background min-h-screen">
                <section className="relative flex h-[80dvh] items-center justify-start lg:h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src={romanticDinner}
                            alt="Couples and Honeymoon Safaris"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/50 lg:bg-black/60" />
                    </div>
                    <div className="absolute relative z-10 mt-20 pl-10">
                        <h1 className="mb-4 text-3xl font-bold text-white md:max-w-5xl md:text-7xl">
                            Safaris for Couples & Honeymooners
                        </h1>
                        <p className="mb-8 text-xl font-light text-white/90 md:text-2xl">
                            Rekindle, reconnect, and re-discover each other.
                        </p>
                        <InquiryDialog>
                            <Button
                                size="lg"
                                className="border-2 border-white bg-transparent px-8 py-3 text-lg font-medium text-white hover:bg-white hover:text-black"
                            >
                                Enquire Now
                            </Button>
                        </InquiryDialog>
                    </div>
                </section>

                {/* Image Gallery */}
                <section className="py-16">
                    <div className="mx-auto max-w-7xl px-6">
                        <div className="grid gap-6 md:grid-cols-3">
                            <img
                                src={honeymoonHero}
                                alt="Safari lodge with romantic setting"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                            <img
                                src={luxuryTent}
                                alt="Luxury tent interior"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                            <img
                                src={romanticDinner}
                                alt="Romantic dinner setup"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                        </div>
                    </div>
                </section>

                <section className=" ">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="prose prose-lg text-muted-foreground max-w-none text-lg leading-relaxed">
                            <p className="mb-6">
                                There’s something about the African wilderness,
                                the stillness, the skies, the stars that turns
                                every moment into something unforgettable.
                                Whether you're just beginning your life together
                                or celebrating a milestone, a couple’s safari in
                                Africa is more than a holiday, it’s an
                                experience that draws you closer.
                            </p>

                            <h2 className="pt-10 text-4xl font-bold text-black">
                                What to Expect on a Romantic Safari
                            </h2>
                            <p className="pt-3">
                                You're waking up to the soft rustle of the wind
                                through the trees, your partner still wrapped in
                                sleep beside you. Outside, the sky is turning
                                the softest shade of pink. You sip coffee in
                                silence, watching elephants move through the
                                morning mist, no noise, no rush, just presence.
                            </p>
                            <p className="pt-3">
                                Later, it's just the two of you, alone in the
                                wild, chasing golden light on an evening game
                                drive. And when night falls? You're wrapped in a
                                blanket by the fire, stars spilling across the
                                sky like confetti, your fingers intertwined, no
                                words needed.
                            </p>
                            <p className="pt-3 font-medium text-black">
                                This is what it feels like to fall in love
                                again, with them, with the moment, with life.
                            </p>

                            <h2 className="pt-10 text-4xl font-bold text-black">
                                Reasons why this safari is what you need
                            </h2>
                            <p className="pt-3">
                                Let’s be honest, life gets loud. Kids, work,
                                bills, routines. But out here? There's only wind
                                through the grass, firelight, and each other.
                            </p>
                            <p className="pt-3">
                                We design safaris that are tailored for two:
                            </p>
                            <ul className="list-disc pl-10">
                                <li>Hidden camps in private reserves</li>
                                <li>
                                    Stylish tented suites with plunge pools and
                                    outdoor bathtubs
                                </li>
                                <li>Personal guides who move at your pace</li>
                                <li>
                                    Nights under the stars and stories by the
                                    fire
                                </li>
                            </ul>
                            <p className="pt-3">
                                Whether you're looking to unwind, reignite, or
                                simply celebrate your love, the wild offers a
                                backdrop that makes everything else fall away.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Why an African safari is perfect for couples */}
                <section className="py-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-8 text-4xl font-bold">
                            Planning Your Honeymoon Safari? We Got You.
                        </h2>
                        <div className="prose prose-lg max-w-none">
                            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                                We know what it’s like, planning a wedding is
                                beautiful chaos. So let us take over the
                                honeymoon part.
                            </p>
                            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                                Want a sunrise balloon flight over the
                                Serengeti? Or maybe ending your safari with a
                                few barefoot days on a quiet island in Zanzibar?
                                Done.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                We’ll help you put together something
                                unforgettable, from the lodges to the little
                                surprises.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Safaris for Honeymooners */}
                <section className="pb-20">
                    <div className="mx-auto max-w-4xl px-6">
                        <h2 className="mb-8 text-4xl font-bold">
                            Not on a Honeymoon? No Problem.
                        </h2>
                        <div className="prose prose-lg max-w-none">
                            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                                Love doesn’t need a reason, and a safari doesn’t
                                need a label.
                            </p>
                            <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
                                Whether you're celebrating an anniversary,
                                popping the question, or just need a break from
                                the noise, there’s a perfect safari waiting for
                                you. Some couples even bring letters to read to
                                each other by the campfire. Others don’t say a
                                word, they just sit in stillness and soak it all
                                in.
                            </p>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Africa offers countless picturesque honeymoon
                                settings and we know just where to take you to
                                guarantee incredible experiences. There is a
                                broad range of honeymoon itineraries on offer,
                                but feel free to contact us if there's something
                                specific you have in mind.
                            </p>

                            <p className="pt-3 text-lg font-medium">
                                This is your journey. We're just here to help
                                you shape it.
                            </p>
                        </div>
                    </div>
                </section>

                <h2 className="pt-10 text-center text-4xl font-bold text-black">
                    Honeymoon Safaris to inspire your journey.
                </h2>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {tours.slice(0, 6).map((tour) => (
                            <TourCard key={tour.id} tour={tour} />
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <section className="from-primary/10 to-secondary/10 bg-gradient-to-r py-20">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h2 className="mb-6 text-4xl font-bold">
                            Ready to Start Your African Love Story?
                        </h2>
                        <p className="text-muted-foreground mb-8 text-xl">
                            Let us create the perfect honeymoon safari that
                            you'll treasure forever
                        </p>
                        <div className="justify-center">
                            <InquiryDialog>
                                <Button
                                    size="lg"
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    <Users className="mr-2 h-5 w-5" />
                                    Speak with Our Experts
                                </Button>
                            </InquiryDialog>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    )
}
