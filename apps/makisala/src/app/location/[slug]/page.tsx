import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getPageBySlug, getPageSlugs, getTourPackagesByLocation } from '@/lib/cms-service'
import Link from 'next/link'
import ImageCard from '@/components/home/image-card'
import C2A from '@/components/home/call-to-action'
import { BreadcrumbSchema, TouristDestinationSchema } from '@/components/schema'
import Script from 'next/script'
import Image from 'next/image'
import { InquiryDialog } from '@/components/enquire-dialog-button'
import { Button } from '@repo/ui/button'
import { MarkdownRenderer } from '@/components/markdown-renderer'

// Metadata for SEO
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    try {
        const { slug } = await params
        const page = await getPageBySlug(slug)

        if (!page || page.status !== 'published' || page.page_type !== 'page') {
            return {
                title: 'Page Not Found',
                description: 'The requested page could not be found.',
            }
        }

        return {
            title: page.meta_title || page.title,
            description: page.meta_description || page.excerpt,
            keywords: page.meta_keywords,
            openGraph: {
                title: page.meta_title || page.title,
                description: page.meta_description! || page.excerpt!,
                images: page.featured_image_url ? [page.featured_image_url] : [],
            },
        }
    } catch {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        }
    }
}

// generating static params
export async function generateStaticParams() {
    const pages = await getPageSlugs('page')
    return pages.map(page => ({
        slug: page.slug,
    }))
}

// Page renderer
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const page = await getPageBySlug(slug)

    if (!page || page.status !== 'published') {
        notFound()
    }
    const tours = await getTourPackagesByLocation(slug)

    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema-script">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                            {
                                name: `${slug}`,
                                url: `https://www.makisala.com/location/${slug}`,
                            },
                        ],
                    }),
                    TouristDestinationSchema({
                        description: page.meta_description!,
                        image: page.featured_image_url!,
                        name: page.title,
                        url: `https://www.makisala.com/location/${slug}`,
                        country: slug === 'rwanda' ? 'Rwanda' : 'Tanzania',
                    }),
                ])}
            </Script>
            <div className="relative min-h-screen bg-white">
                {page.featured_image_url && (
                    <section className="relative mt-16 flex h-screen items-center justify-start overflow-hidden">
                        <div className="absolute inset-0">
                            <Image
                                src={page.featured_image_url}
                                alt="Makisala Safaris"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/70" />
                        </div>
                        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 text-white sm:px-6 lg:px-8">
                            <div className="max-w-2xl">
                                <div className="mb-4 text-sm font-medium tracking-wider">
                                    DESTINATION
                                </div>
                                <h1 className="text-5xl leading-tight font-bold md:text-6xl">
                                    {page.title}
                                </h1>
                                <p className="mb-8 text-lg text-white md:text-xl">{page.excerpt}</p>
                                <div className="flex space-x-4">
                                    <InquiryDialog>
                                        <Button
                                            size="lg"
                                            className="border-2 border-white bg-transparent px-8 py-3 text-lg font-medium text-white hover:bg-white hover:text-black"
                                        >
                                            Start Planning
                                        </Button>
                                    </InquiryDialog>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                <article className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:max-w-7xl">
                    <MarkdownRenderer content={page.content} />
                </article>
            </div>
            <p className="py-5 text-center text-3xl font-bold lg:text-5xl">
                Safaris itineraries to inspire your journey
            </p>
            <div className="mx-auto mb-24 grid max-w-7xl justify-center gap-12 max-sm:flex max-sm:h-full max-sm:flex-col md:grid-cols-2 xl:grid-cols-3">
                {tours?.map(tour => (
                    <div key={tour.id} className="">
                        <Link href={`/to_book/${tour.slug}`}>
                            <ImageCard
                                title={tour.title}
                                img_url={tour.hero_image_url || '/placeholder.svg'}
                                alt="Makisala Blog"
                                description={tour.overview!}
                                truncate={true}
                            />
                        </Link>
                    </div>
                ))}
            </div>
            <C2A />
        </>
    )
}
