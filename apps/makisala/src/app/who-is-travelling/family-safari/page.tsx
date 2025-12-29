import { Button } from '@repo/ui/button'
import { InquiryDialog } from '@/components/enquire-dialog-button'
import { Users } from 'lucide-react'
import type { Metadata } from 'next'
import { BreadcrumbSchema } from '@/components/schema'
import Script from 'next/script'
import Image from 'next/image'
import { getTours } from '@/lib/cms-service'
import TourCard from '../../safaris/[country]/[modifier]/_components/TourCard'

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `African Family Safaris | Makisala Safaris`,
        description:
            'Reconnect with your loved ones on a tailor-made African safari. Private game drives, family-friendly lodges, and unforgettable shared moments in the wild.',
        openGraph: {
            title: `African Family Safaris | Makisala Safaris`,
            description: `Reconnect with your loved ones on a tailor-made African safari. Private game drives, family-friendly lodges, and unforgettable shared moments in the wild.`,
            images: [
                {
                    url: 'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg',
                    width: 1200,
                    height: 630,
                    alt: 'Family Safaris | Makisala Safaris',
                },
            ],
        },
    }
}

export default async function Page() {
    const hero =
        'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg'
    const tours = await getTours('tanzania', 'family')
    return (
        <main>
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema-script">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                            {
                                name: 'Family Safari',
                                url: 'https://www.makisala.com/who-is-travelling/family-safari',
                            },
                        ],
                    }),
                ])}
            </Script>
            <div className="bg-background min-h-screen">
                {/* Hero Section */}
                <section className="relative flex h-[80dvh] items-center justify-start lg:h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg"
                            alt="Tanzania Family Safaris"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/70 lg:bg-black/60" />
                    </div>
                    <div className="absolute relative z-10 mt-20 pl-10">
                        <h1 className="mb-4 text-5xl font-bold text-white md:max-w-5xl md:text-7xl">
                            Family Safari
                        </h1>
                        <p className="mb-8 text-xl font-light text-white/90 md:text-2xl">
                            A journey worth sharing. A bond worth strengthening.
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
                                src={hero}
                                alt="Safari lodge with romantic setting"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                            <img
                                src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373725/6-Days-Best-Family-Safaris-and-Culture-Tour-in-Tanzania_l9fgum.jpg"
                                alt="Family Safari | Makisala Safaris"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                            <img
                                src="https://enjoykili.co.tz/wp-content/uploads/2022/12/family-safari-in-Tanzania-1.webp"
                                alt="Family Safari | Makisala Safaris"
                                className="h-80 w-full rounded-lg object-cover"
                            />
                        </div>
                    </div>
                </section>

                <section className=" ">
                    <div className="mx-auto max-w-4xl px-6">
                        <div className="prose prose-lg text-muted-foreground max-w-none text-lg leading-relaxed">
                            <h3 className="pt-10 text-4xl font-bold text-black">
                                Real time together. The bonding that your family needs.
                            </h3>
                            <p className="pt-3">
                                Maybe it’s been a while since you all travelled as a family.
                                Careers, distance, life, it gets in the way. And now, you&#39;re
                                thinking: we need something different. Not just a beach resort, not
                                another cruise. Something that actually means something.
                            </p>
                            <p className="pt-3">
                                A safari gives you that space. It brings people together in a way
                                few holidays can.
                            </p>
                            <p className="pt-3">
                                It’s the kind of trip where you’re all present. No distractions, no
                                packed schedules. Just shared experiences, the kind you talk about
                                years later. You’re watching elephants cross the river. You’re
                                sitting around the fire telling old stories. You&#39;re all seeing
                                the same moment at the same time, and actually feeling it.
                            </p>

                            <h2 className="pt-10 text-4xl font-bold text-black">
                                Reasons why this safari is what you need
                            </h2>

                            <p className="pt-3">
                                And whether you&#39;re bringing young kids, grown-up children, or
                                your own parents, we tailor everything around your pace and comfort.
                            </p>
                            <ul className="list-disc pl-10">
                                <li>Private guides who move with your rhythm</li>
                                <li>Lodges with space to breathe and connect</li>
                                <li>Game drives that turn into life lessons</li>
                                <li>Evenings with no agenda, just good food and better company</li>
                            </ul>
                            <p className="pt-3">
                                This isn’t about ticking off sights. It’s about getting the kind of
                                time with your family that’s hard to find these days.
                            </p>

                            <p className="pt-3">
                                So if you’ve been waiting for the right moment to bring everyone
                                together, this is it.
                            </p>
                        </div>
                    </div>
                </section>

                <h2 className="pt-10 text-center text-4xl font-bold text-black">
                    Family Safaris to inspire your journey.
                </h2>

                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        {tours.slice(0, 6).map(tour => (
                            <TourCard key={tour.id} tour={tour} />
                        ))}
                    </div>
                </div>

                {/* Call to Action */}
                <section className="from-primary/10 to-secondary/10 bg-gradient-to-r py-20">
                    <div className="mx-auto max-w-4xl px-6 text-center">
                        <h2 className="mb-6 text-4xl font-bold">
                            Ready to Bring the Family Together?
                        </h2>
                        <p className="text-muted-foreground mb-8 text-xl">
                            Let us help you plan a safari that’s all about connection, adventure,
                            and time well spent.
                        </p>
                        <div className="justify-center">
                            <InquiryDialog>
                                <Button size="lg" className="bg-primary hover:bg-primary/90">
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
