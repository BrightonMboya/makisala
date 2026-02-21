import { getPageById } from '@/lib/cms-service'
import { notFound } from 'next/navigation'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { FAQ } from '@/components/faq'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import C2A from '../../../components/home/call-to-action'
import type { Metadata } from 'next'
import MonthNavigator from './_components/month_navigator'
import { articles_url } from './_components/data'
import { BASE_URL } from '@/lib/constants'

interface IParams {
    params: {
        month: string
    }
}

export function generateStaticParams() {
    return articles_url.map(article => ({ month: article.month }))
}

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    try {
        const { month } = await params
        const article_url = articles_url.find(page => page.month === month)?.page_url
        if (!article_url) {
            return {
                title: 'Page Not Found',
                description: 'The requested page could not be found.',
            }
        }
        const page = await getPageById(article_url)

        return {
            title: page?.meta_title || page?.title,
            description: page?.meta_description || page?.excerpt,
            keywords: page?.meta_keywords,
            openGraph: {
                title: page?.meta_title || page?.title,
                description: page?.meta_description! || page?.excerpt!,
                images: page?.featured_image_url ? [page?.featured_image_url] : [],
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
    const { month } = await params
    const article_url = articles_url.find(page => page.month === month)?.page_url

    if (!article_url) {
        return notFound()
    }
    const page = await getPageById(article_url)

    if (!page) {
        return notFound()
    }

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `Where to travel in Africa in ${month}`,
                                url: `${BASE_URL}/where-to-go/${month}`,
                            },
                        ],
                    }),
                    FAQSchema({ faqs: page.faqs! }),
                ]) }} />
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

            <main className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
                <MonthNavigator />
                <MarkdownRenderer content={page.content} />
                <FAQ faqs={page.faqs!} />
            </main>
            <C2A />
        </>
    )
}
