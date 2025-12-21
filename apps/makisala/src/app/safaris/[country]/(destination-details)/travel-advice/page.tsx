import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { IParams } from '../../types'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import Script from 'next/script'
import { getTravelAdvice } from '@/lib/cms-service'
import { FAQ } from '@/components/faq'
import Image from 'next/image'
import Nav from '../_components/Nav'

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    try {
        const { country } = await params
        const destination = await getTravelAdvice(country)

        if (!destination) {
            return {
                title: 'Page Not Found',
                description: 'The requested page could not be found.',
            }
        }

        return {
            title: destination.meta_title || destination.title,
            description: destination.meta_description || destination.excerpt,
            keywords: destination.meta_keywords,
            openGraph: {
                title: destination.meta_title || destination.title,
                description: destination.meta_description! || destination.excerpt!,
                images: destination.featured_image_url ? [destination.featured_image_url] : [],
            },
        }
    } catch {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        }
    }
}

export default async function Page({ params }: IParams) {
    const { country } = await params
    const destination = await getTravelAdvice(country)

    if (!destination) {
        notFound()
    }
    return (
        <main>
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema-travel-advice">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: 'Tanzania',
                                url: `${BASE_URL}/safaris/${country}`,
                            },
                            {
                                name: `${capitalize(country)} Travel Advice`,
                                url: `${BASE_URL}/safaris/${country}/travel-advice`,
                            },
                        ],
                    }),
                    destination.faqs && FAQSchema({ faqs: destination.faqs }),
                ])}
            </Script>
            <section className="relative mt-16 flex h-[80dvh] items-center justify-start overflow-hidden lg:h-screen">
                <div className="absolute inset-0">
                    <Image
                        src={destination.featured_image_url!}
                        alt="Makisala"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/70 lg:bg-black/60" />
                </div>
                <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
                    <h1 className="text-md mb-1 text-center text-3xl font-semibold lg:text-5xl">
                        {`${capitalize(country)} Travel Advice`}
                    </h1>
                </div>
            </section>
            <Nav country={country} />
            <section className="container mx-auto px-4 py-12 lg:px-8">
                <MarkdownRenderer content={destination.content!} />
                {destination.faqs && <FAQ faqs={destination.faqs} />}
            </section>
        </main>
    )
}
