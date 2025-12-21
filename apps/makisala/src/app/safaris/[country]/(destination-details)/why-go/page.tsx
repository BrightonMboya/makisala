import { getDestinationOverview } from '@/lib/cms-service'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { IParams } from '../../types'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import Script from 'next/script'
import { FAQ } from '@/components/faq'
import Nav from '../_components/Nav'
import Image from 'next/image'

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    try {
        const { country } = await params
        const destinationOverview = await getDestinationOverview(country)

        if (!destinationOverview) {
            return {
                title: 'Page Not Found',
                description: 'The requested page could not be found.',
            }
        }

        return {
            title: destinationOverview.meta_title || destinationOverview.title,
            description: destinationOverview.meta_description || destinationOverview.excerpt,
            keywords: destinationOverview.meta_keywords,
            openGraph: {
                title: destinationOverview.meta_title || destinationOverview.title,
                description: destinationOverview.meta_description! || destinationOverview.excerpt!,
                images: destinationOverview.featured_image_url
                    ? [destinationOverview.featured_image_url]
                    : [],
            },
        }
    } catch {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        }
    }
}

export default async function HomePage({ params }: IParams) {
    const { country } = await params
    const destinationOverview = await getDestinationOverview(country)

    if (!destinationOverview) {
        return notFound()
    }

    return (
        <main className="">
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema-why-go">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: 'Tanzania',
                                url: `${BASE_URL}/safaris/${country}`,
                            },
                            {
                                name: `Why Visit ${capitalize(country)}`,
                                url: `${BASE_URL}/safaris/${country}/why-go`,
                            },
                        ],
                    }),
                    destinationOverview.faqs && FAQSchema({ faqs: destinationOverview.faqs }),
                ])}
            </Script>
            {/*<h1 className="pb-5 text-4xl font-medium">*/}
            {/*    {destinationOverview.title}*/}
            {/*</h1>*/}
            <section className="relative mt-16 flex h-[80dvh] items-center justify-start overflow-hidden lg:h-screen">
                <div className="absolute inset-0">
                    <Image
                        src={destinationOverview.featured_image_url!}
                        alt="Makisala"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/70 lg:bg-black/60" />
                </div>
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
                    <h1 className="text-md mb-1 text-center text-3xl font-semibold lg:text-5xl">
                        {`Why go to ${capitalize(country)} `}
                    </h1>
                </div>
            </section>
            <Nav country={country} />
            <section className="container mx-auto px-4 py-12 lg:px-8">
                <MarkdownRenderer content={destinationOverview.content!} />
                {destinationOverview.faqs && <FAQ faqs={destinationOverview.faqs} />}
            </section>
        </main>
    )
}
