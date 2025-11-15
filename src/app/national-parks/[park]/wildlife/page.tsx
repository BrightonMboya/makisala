import { IParams } from '@/app/national-parks/[park]/type'
import { getNPInfo } from '@/lib/cms-service'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import {
    BreadcrumbSchema,
    FAQSchema,
    TouristAttractionSchema,
    TouristDestinationSchema,
} from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import type { Metadata } from 'next'
import { NavigationSidebar } from '@/app/national-parks/_components/navigation'
import { FAQ } from '@/components/faq'
import TourCard from '@/app/safaris/[country]/[modifier]/_components/TourCard'
import { type WildlifeHighlights } from '@/db'

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    const { park } = await params
    const { page } = await getNPInfo(park, 'wildlife_page_id')

    if (!page) {
        return {
            title: 'Page not found',
            description: 'The requested page could not be found.',
        }
    }

    return {
        title: page.meta_title,
        description: page.meta_description,
        openGraph: {
            title: page.title,
            description: page.meta_description!,
            images: page.featured_image_url!,
        },
    }
}

export default async function page({ params }: IParams) {
    const { park } = await params
    const { park: np, page, tours } = await getNPInfo(park, 'wildlife_page_id')

    if (!page) {
        return notFound()
    }

    const animal_icons = [
        {
            name: 'Lion',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954131/lion_srbwy0.png',
        },
        {
            name: 'Leopard',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/leopard_e1lfum.png',
        },
        {
            name: 'Buffalo',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954799/bufallo_c5fajp.png',
        },
        {
            name: 'Black Rhino',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954659/black_rhino_ici4wa.png',
        },
        {
            name: 'Cheetah',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/leopard_e1lfum.png',
        },
        {
            name: 'Elephant',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954131/elephant_gy4fo1.png',
        },
        {
            name: 'Hyena',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954131/hyena_m8lcwf.png',
        },
        {
            name: 'Giraffe',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/giraffe_msuwfs.png',
        },
        {
            name: 'Zebra',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/zebra_ttawsl.png',
        },
        {
            name: 'Wildebeest',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/wildbeest_hyegnx.png',
        },
        {
            name: 'Hippo',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954128/hippo_mfhyef.png',
        },
        {
            name: 'Wild Dog',
            image_url:
                'https://res.cloudinary.com/dr2tdyz2w/image/upload/v1759954129/wild_dog_lzwpdd.png',
        },
    ]

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
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `${capitalize(np.country)} National Parks`,
                                url: `${BASE_URL}/safaris/${np.country}/where-to-go`,
                            },
                            {
                                name: `${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/safaris/${np.name}/`,
                            },
                            {
                                name: `Wildlife highlights in ${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/national-parks/${np.name}/wildlife`,
                            },
                        ],
                    }),
                    TouristDestinationSchema({
                        name: capitalize(np.name),
                        description: page.meta_description || '',
                        url: `${BASE_URL}/national-parks/${np.name}/`,
                        image: page.featured_image_url!,
                        country: capitalize(np.country),
                    }),
                    TouristAttractionSchema({
                        name: capitalize(np.name),
                        url: `${BASE_URL}/national-parks/${np.name}/`,
                    }),
                    page.faqs && FAQSchema({ faqs: page.faqs }),
                ])}
            </Script>

            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat object-cover"
                    style={{
                        backgroundImage: `url(${page.featured_image_url})`,
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="relative flex h-full items-end">
                    <div className="container mx-auto px-6 pb-12">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl leading-tight font-bold text-white md:text-6xl">
                                {page.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mx-auto mt-[20px] max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    <NavigationSidebar park_name={park} />
                    <section className="flex-1 lg:max-w-4xl">
                        <MarkdownRenderer content={page.excerpt!} />
                        <div className="mt-5 grid grid-cols-3 gap-3 lg:grid-cols-4">
                            {animal_icons.map((icon) => {
                                return (
                                    <div
                                        key={icon.name}
                                        className="flex flex-col items-center"
                                    >
                                        <img
                                            src={icon.image_url}
                                            alt={icon.name}
                                            className="h-16 w-16 lg:h-20 lg:w-20"
                                        />
                                        <p className="text-sm font-medium">
                                            {np.wildlife_highlights?.[0]?.[
                                                icon.name as keyof WildlifeHighlights
                                            ] ?? 'N/A'}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                        <MarkdownRenderer content={page.content} />
                        {page.faqs && <FAQ faqs={page.faqs} />}
                    </section>
                </div>
                {tours && (
                    <section>
                        <h2 className="pt-10 text-center text-4xl font-bold text-black">
                            {`${capitalize(np.name)} Safaris to inspire your journey.`}
                        </h2>

                        <div className="container mx-auto px-4 py-8">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                {tours.slice(0, 6).map((tour) => (
                                    <TourCard key={tour.id} tour={tour} />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </main>
    )
}
