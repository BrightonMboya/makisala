import Image from 'next/image'
import { safaris, why_travel_with_us } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import ImageCard from '@/components/home/image-card'
import Link from 'next/link'
import C2A from '@/components/home/call-to-action'
import { BreadcrumbSchema } from '@/components/schema'
import Script from 'next/script'
import { InquiryDialog } from '@/components/enquire-dialog-button'

export default function Page() {
    return (
        <main>
            <Script
                type={'application/ld+json'}
                strategy={'lazyOnload'}
                id="schema-id"
            >
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                        ],
                    }),
                ])}
            </Script>
            <div className="min-h-screen bg-white">
                {/* Hero Section */}
                <section className="relative mt-16 flex h-[80dvh] items-center justify-start overflow-hidden lg:h-screen">
                    <div className="absolute inset-0">
                        <Image
                            src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373725/6-Days-Best-Family-Safaris-and-Culture-Tour-in-Tanzania_l9fgum.jpg"
                            alt="Makisala"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/70 lg:bg-black/60" />
                    </div>
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
                        <div className="max-w-2xl">
                            <div className="text-md mb-1 font-light tracking-wider lg:text-lg">
                                Discover Africa, Effortlessly
                            </div>
                            <h1 className="mb-8 text-xl leading-tight font-medium md:text-5xl">
                                Luxury safaris made simple for couples,
                                families, and first-time explorers.
                            </h1>
                            <div className="flex space-x-4">
                                {/*<Button*/}
                                {/*    variant="outline"*/}
                                {/*    className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-sm font-medium bg-transparent">*/}
                                {/*    EXPERIENCES*/}
                                {/*</Button>*/}
                                <InquiryDialog>
                                    <Button className="bg-white px-8 py-3 text-sm font-medium text-black hover:bg-gray-100">
                                        START PLANNING
                                    </Button>
                                </InquiryDialog>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Destinations and Experiences Section */}
                <section className="mt-16 bg-white pt-16">
                    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                        <div className="mb-4 text-sm font-medium tracking-wider text-gray-500">
                            DESTINATIONS, EXPERIENCES AND TRIP TYPES
                        </div>
                    </div>
                </section>

                {/* What Would You Like To Experience Section */}
                <section className="bg-white pb-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-light text-gray-900">
                                What Would You Like To Experience
                            </h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-3">
                            {safaris.map((experience, index) => (
                                <Link href={experience.page_url} key={index}>
                                    <div
                                        key={index}
                                        className="group relative cursor-pointer overflow-hidden rounded-lg"
                                    >
                                        <div className="relative aspect-[4/3]">
                                            <Image
                                                src={
                                                    experience.image ||
                                                    '/placeholder.svg'
                                                }
                                                alt={experience.title}
                                                fill
                                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                            />
                                            <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/50" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <h3 className="absolute bottom-3 px-4 text-lg font-medium text-white">
                                                    {experience.title}
                                                </h3>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <div>
                                <h2 className="mb-8 text-4xl font-light text-gray-900">
                                    Traveling with Kids or Grandkids?
                                </h2>
                                <div className="space-y-6 leading-relaxed text-gray-700">
                                    <p>
                                        A family safari isn't just a vacation,
                                        it's a story your kids will tell for the
                                        rest of their lives. Imagine their faces
                                        the first time they see a lion in the
                                        wild, or hear Maasai legends by
                                        firelight.
                                    </p>

                                    <p>
                                        We plan your trip with every generation
                                        in mind. From kid-friendly lodges and
                                        private guides to downtime by the pool,
                                        your itinerary balances adventure with
                                        comfort, so no one feels rushed or
                                        overwhelmed.
                                    </p>

                                    <p>
                                        Whether you're traveling with little
                                        ones, teens, or grown kids, we make it
                                        easy to connect, unplug, and create
                                        memories that matter.
                                    </p>

                                    <p className="font-medium text-gray-900">
                                        Tell us about your crew, we’ll take care
                                        of the rest.
                                    </p>
                                </div>
                            </div>
                            <div className="relative h-[300px] w-[400px] lg:h-[400px] lg:w-[600px]">
                                <Image
                                    src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753793635/Tanzania-Family-Safari-1_njxhyq.webp"
                                    alt="Makisala Family Safari"
                                    fill={true}
                                    className="rounded-lg object-cover lg:w-[500px]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Family Passion Section */}
                <section className="bg-white pt-16">
                    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
                        <div className="mb-4 text-sm font-medium tracking-wider text-gray-500">
                            FAMILY PASSION MEETS SAFARI EXPERTISE
                        </div>
                    </div>
                </section>

                {/* Why Travel With Us Section */}
                <section className="bg-white">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-light text-gray-900">
                                Why travel with MAKISALA
                            </h2>
                        </div>
                        <div className="grid gap-12 md:grid-cols-3">
                            {why_travel_with_us.map((item, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl shadow-sm">
                                        <Image
                                            src={item.img_url}
                                            alt={item.alt}
                                            fill
                                            className="object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    </div>
                                    <h3 className="mb-3 text-xl font-semibold text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="max-w-sm leading-relaxed text-gray-600">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* When to Travel Section */}
                {/*<section className="py-20 bg-gray-50">*/}
                {/*    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">*/}
                {/*        <div className="text-center mb-16">*/}
                {/*            <h2 className="text-4xl font-light text-gray-900 mb-4">*/}
                {/*                When to travel*/}
                {/*            </h2>*/}
                {/*            <div className="w-16 h-px bg-gray-300 mx-auto mb-8"></div>*/}
                {/*            <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">*/}
                {/*                Truth be told, there's no bad time to Africa, just different*/}
                {/*                times! The variety served up by Africa's diversity means unique*/}
                {/*                experiences throughout the year. See the Wildebeest Migration in*/}
                {/*                East Africa, go gorilla trekking in Uganda, track the BIG 5 in*/}
                {/*                Botswana or honeymoon in the Seychelles; SAFARI FRANK will give*/}
                {/*                you 'frank' advice on what to expect when, as well as options for*/}
                {/*                the experience of a lifetime.*/}
                {/*            </p>*/}
                {/*        </div>*/}

                {/*        /!* Month Tabs *!/*/}
                {/*        <div className="flex flex-wrap justify-center mb-12">*/}
                {/*            {months.map((month, index) => (*/}
                {/*                <button*/}
                {/*                    key={month}*/}
                {/*                    className={`px-6 py-3 text-sm font-medium border-r border-gray-300 last:border-r-0 ${*/}
                {/*                        index === 0*/}
                {/*                            ? "bg-black text-white"*/}
                {/*                            : "bg-white text-gray-700 hover:bg-gray-50"*/}
                {/*                    }`}>*/}
                {/*                    {month}*/}
                {/*                </button>*/}
                {/*            ))}*/}
                {/*        </div>*/}

                {/*        /!* Featured Destination *!/*/}
                {/*        <div className="grid lg:grid-cols-2 gap-12 items-center">*/}
                {/*            <div className="bg-gray-800 text-white p-8 rounded-lg">*/}
                {/*                <div className="text-sm mb-4">*/}
                {/*                    Season: High Summer / Ave Temp: 25°C / Highlight: Glorious Cape*/}
                {/*                    Town*/}
                {/*                </div>*/}
                {/*                <h3 className="text-3xl font-light mb-6">*/}
                {/*                    Cape Town And The Garden Route*/}
                {/*                </h3>*/}
                {/*                <p className="text-gray-300 leading-relaxed">*/}
                {/*                    As the new year descends on Africa so does the much-anticipated*/}
                {/*                    rain in the south. January in Southern and East Africa tends to*/}
                {/*                    be quieter making it a great time to take advantage of*/}
                {/*                    competitive rates, making safaris more accessible and*/}
                {/*                    affordable. A stay in fabulous Cape Town and self-drive up the*/}
                {/*                    Whale Coast & Garden Route is a great option and don't forget*/}
                {/*                    the Cape Vineyards....*/}
                {/*                </p>*/}
                {/*            </div>*/}
                {/*            <div className="relative">*/}
                {/*                <Image*/}
                {/*                    src="/placeholder.svg?height=400&width=600"*/}
                {/*                    alt="Cape Town Coastal View"*/}
                {/*                    width={600}*/}
                {/*                    height={400}*/}
                {/*                    className="rounded-lg"*/}
                {/*                />*/}
                {/*            </div>*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</section>*/}

                {/* How It Works Section */}
                <section className="bg-white py-20">
                    <div className="mx-auto max-w-lg px-4 sm:px-6 lg:max-w-none">
                        <div className="mb-16 text-center">
                            <h2 className="mb-4 text-4xl font-light text-gray-900">
                                How It Works
                            </h2>
                            <div className="mx-auto h-px w-16 bg-gray-300"></div>
                        </div>

                        <div className="grid gap-5 md:grid-cols-5">
                            {[
                                {
                                    step: 'STEP 1',
                                    title: 'Get Inspired',
                                    description:
                                        "Browse our handpicked safari ideas from the Serengeti to hidden corners of Africa. Whether you're dreaming of big cats or quiet luxury, you'll find something that sparks your imagination.",
                                },
                                {
                                    step: 'STEP 2',
                                    title: 'Reach Out',
                                    description:
                                        "When you're ready, just say hi. Fill out our quick enquiry form or book a call, and we’ll match you with a Makisala safari expert who understands your style and vision.",
                                },
                                {
                                    step: 'STEP 3',
                                    title: 'Tailor Your Journey',
                                    description:
                                        'We build your trip around you your pace, your priorities, your people. From choosing the perfect camps to planning downtime, we handle the details so you can focus on the adventure.',
                                },
                                {
                                    step: 'STEP 4',
                                    title: 'Refine and Confirm',
                                    description:
                                        'We’ll walk you through every part of your itinerary, answer all your questions, and fine-tune the plan until it feels just right. No pressure. No guessing.',
                                },
                                {
                                    step: 'STEP 5',
                                    title: 'Experience Africa',
                                    description:
                                        'From the moment you land, we’re right there with you. Our team and trusted partners are on hand throughout your journey so you can relax, explore, and enjoy every moment.',
                                },
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="rounded-lg bg-gray-50 p-8 text-center"
                                >
                                    <div className="mb-2 text-xs font-medium tracking-wider text-gray-500">
                                        {item.step}
                                    </div>
                                    <div className="mx-auto mb-4 h-px w-8 bg-gray-300"></div>
                                    <h3 className="mb-4 text-2xl font-light text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm leading-relaxed text-gray-600">
                                        {item.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <C2A />

                {/* Founder Quote Section */}
                <section className="bg-gray-50 py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid items-center gap-16 lg:grid-cols-2">
                            <div>
                                {/*<div className="text-sm font-medium tracking-wider text-gray-500 mb-6">*/}
                                {/*    BRIGHTON MBOYA, CO-FOUNDER MAKISALA*/}
                                {/*</div>*/}
                                <h2 className="mb-8 text-4xl font-light text-gray-900">
                                    We’re in the business of making wild dreams
                                    come true.
                                </h2>
                                <div className="space-y-6 leading-relaxed text-gray-700">
                                    <p>
                                        At Makisala, we plan life-changing
                                        safaris with heart, purpose, and deep
                                        local expertise. We know Tanzania and
                                        East Africa like home because it is. We
                                        believe a great safari isn’t just about
                                        what you see. It’s about{' '}
                                        <strong>
                                            how it makes you feel more connected
                                        </strong>
                                        , more alive, more in awe of the world.
                                        And yes, we’re proud to give back: every
                                        trip supports the people and places that
                                        make Africa magical.
                                    </p>
                                    <p className="font-medium">
                                        Let's make the world a little wilder,
                                        one safari at a time.
                                    </p>
                                </div>
                            </div>
                            <div className="relative h-[300px] w-[400px] lg:h-[400px] lg:w-[600px]">
                                <Image
                                    src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg"
                                    alt="Makisala Family Safari"
                                    fill={true}
                                    className="rounded-lg object-cover lg:w-[500px]"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Reviews Section */}
                {/*<section className="py-20 bg-gray-900 text-white">*/}
                {/*    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">*/}
                {/*        <div className="text-center mb-16">*/}
                {/*            <div className="text-sm font-medium tracking-wider text-gray-400 mb-4">*/}
                {/*                WHY OUR GUESTS RETURN:*/}
                {/*            </div>*/}
                {/*            <h2 className="text-4xl font-light mb-4">Our Latest Reviews</h2>*/}
                {/*        </div>*/}

                {/*        <div className="grid md:grid-cols-3 gap-8">*/}
                {/*            {[1, 2, 3].map((review) => (*/}
                {/*                <Card key={review} className="bg-gray-800 border-gray-700">*/}
                {/*                    <CardContent className="p-6">*/}
                {/*                        <div className="flex mb-4">*/}
                {/*                            {[...Array(5)].map((_, i) => (*/}
                {/*                                <Star*/}
                {/*                                    key={i}*/}
                {/*                                    className="h-4 w-4 text-yellow-400 fill-current"*/}
                {/*                                />*/}
                {/*                            ))}*/}
                {/*                        </div>*/}
                {/*                        <p className="text-gray-300 mb-4 italic">*/}
                {/*                            "An absolutely incredible experience. The attention to*/}
                {/*                            detail and personalized service exceeded all expectations.*/}
                {/*                            Our guide was phenomenal!"*/}
                {/*                        </p>*/}
                {/*                        <div className="text-sm text-gray-400">*/}
                {/*                            <p className="font-medium">Sarah Johnson</p>*/}
                {/*                            <p>Verified Guest</p>*/}
                {/*                        </div>*/}
                {/*                    </CardContent>*/}
                {/*                </Card>*/}
                {/*            ))}*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</section>*/}

                {/* Partners Section */}
                {/* <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-medium tracking-wider text-gray-500 mb-4">
              OUR PARTNERS IN AFRICA WILL MAKE YOUR DREAM TRIP, A TRIP TO NEVER
              FORGET
            </div>
          </div>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            {[1, 2, 3, 4, 5].map((partner) => (
              <div key={partner} className="text-2xl font-light text-gray-400">
                Partner {partner}
              </div>
            ))}
          </div>
        </div>
      </section> */}
            </div>
        </main>
    )
}
