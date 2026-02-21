import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

import { getPageBySlug } from '@/lib/cms-service'
import { generateTableOfContentsFromMarkdown, RemoteMdx } from '@/components/markdown-renderer'
import { BlogSchema, BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { FAQ } from '@/components/faq'
import TableOfContents from '@/components/table-of-contents'
import { BASE_URL } from '@/lib/constants'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const page = await getPageBySlug(slug)

    if (!page || page.status !== 'published') {
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
}

// // generating static params this makes the content not live, has to wait for another build
// export async function generateStaticParams() {
//     const pages = await getPageSlugs('blog')
//     return pages.map((page) => ({
//         slug: page.slug,
//     }))
// }

// Page renderer
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const page = await getPageBySlug(slug)

    if (!page || page.status !== 'published') {
        notFound()
    }

    const toc = await generateTableOfContentsFromMarkdown(page.content)

    return (
        <main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {
                                name: 'Home',
                                url: BASE_URL,
                            },
                            {
                                name: 'Blog',
                                url: `${BASE_URL}/blog`,
                            },
                            {
                                name: `${page.title}`,
                                url: `${BASE_URL}/blog/${slug}`,
                            },
                        ],
                    }),
                    BlogSchema({
                        headline: `${page.title}`,
                        image: `${page.featured_image_url}`,
                        description: `${page.excerpt}`,
                        datePublished: page.createdAt,
                        dateModified: page.updatedAt,
                    }),
                    page.faqs && FAQSchema({ faqs: page.faqs }),
                ]) }} />
            <div className="mx-[30px] scroll-smooth pt-[100px] sm:overflow-hidden md:overflow-visible lg:container lg:mx-auto">
                <div className="flex w-full flex-row">
                    <div className="flex w-full flex-col lg:w-3/4">
                        <div className={`prose sm:prose-sm md:prose-md gradient sm:mx-6`}>
                            <h1 className="blog-heading-gradient text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-6xl">
                                {page.title}
                            </h1>
                            <p className="not-prose mt-8 text-lg leading-8 font-medium text-black/60 lg:text-xl">
                                {page.excerpt || ''}
                            </p>
                        </div>
                        <div
                            className="prose-sm md:prose-md prose-strong:text-black/90 prose-code:text-black/80 prose-code:bg-white/10 prose-code:px-2 prose-code:py-1 prose-code:border-white/20 prose-code:rounded-md prose-pre:p-0 prose-pre:m-0 prose-pre:leading-6 mt-12 text-black/90 sm:mx-6 lg:pr-24"
                            data-content="true"
                        >
                            <RemoteMdx content={page.content} />
                            {page.faqs && <FAQ faqs={page.faqs} />}
                        </div>
                    </div>

                    <div className="prose not-prose top-24 hidden h-full items-start gap-4 space-y-4 pt-8 lg:sticky lg:mt-12 lg:flex lg:w-1/4 lg:flex-col">
                        <TableOfContents tableOfContents={toc} />

                        <div className="mt-4 flex flex-col">
                            {/*<p className="text-md pt-10 text-black">*/}
                            {/*    Suggested*/}
                            {/*</p>*/}
                            <div>{/*<SuggestedBlogs currentPostSlug={post.url} />*/}</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
