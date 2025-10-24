import { IParams } from '@/app/national-parks/[park]/type'
import { getNPInfo } from '@/lib/cms-service'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import type { Metadata } from 'next'
import { NavigationSidebar } from '@/app/national-parks/_components/navigation'
import { FAQ } from '@/components/faq'

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
    const { park: np, page } = await getNPInfo(park, 'wildlife_page_id')

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
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
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
                    page.faqs && FAQSchema({ faqs: page.faqs }),
                ])}
            </Script>

            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat object-cover"
                    style={{ backgroundImage: `url(${page.featured_image_url})` }}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                </div>
                <div className="relative h-full flex items-end">
                    <div className="container mx-auto px-6 pb-12">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight">
                                {page.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[20px]">
                <div className="flex flex-col lg:flex-row gap-8">
                    <NavigationSidebar park_name={park} />
                    <section className="flex-1 lg:max-w-4xl">
                        <MarkdownRenderer content={page.excerpt!} />
                        <div className="grid grid-cols-3 lg:grid-cols-4 gap-3 mt-5">
                            {animal_icons.map(icon => {
                                return (
                                    <div key={icon.name} className="flex flex-col items-center">
                                        <img
                                            src={icon.image_url}
                                            alt={icon.name}
                                            className="w-16 h-16 lg:w-20 lg:h-20"
                                        />
                                        {/* @ts-ignore*/}
                                        <p className="text-sm font-medium">
                                            {np.wildlife_highlights[0][`${icon.name}`]}
                                        </p>
                                    </div>
                                )
                            })}
                        </div>
                        <MarkdownRenderer content={page.content} />
                        {page.faqs && <FAQ faqs={page.faqs} />}
                    </section>
                </div>
            </div>
        </main>
    )
}
