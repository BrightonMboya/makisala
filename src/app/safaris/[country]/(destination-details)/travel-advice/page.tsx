import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { IParams } from '@/app/safaris/[country]/types'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'
import Script from 'next/script'
import { getTravelAdvice } from '@/lib/cms-service'
import { FAQ } from '@/components/faq'

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
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            { name: 'Tanzania', url: `${BASE_URL}/safaris/${country}` },
                            {
                                name: `${capitalize(country)} Travel Advice`,
                                url: `${BASE_URL}/safaris/${country}/travel-advice`,
                            },
                        ],
                    }),
                    destination.faqs && FAQSchema({ faqs: destination.faqs }),
                ])}
            </Script>
            <h1 className="pb-5 text-4xl font-medium">{destination.title}</h1>
            <MarkdownRenderer content={destination.content!} />
            {destination.faqs && <FAQ faqs={destination.faqs} />}
        </main>
    )
}
