import {notFound} from "next/navigation";
import Image from "next/image";
import type {Metadata} from "next";

import {getPageBySlug, getPageSlugs} from "@/lib/cms-service";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {BlogSchema, BreadcrumbSchema, FAQSchema} from "@/components/schema";
import Script from "next/script";
import {FAQ} from "@/components/faq";

export async function generateMetadata({
                                           params,
                                       }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        const {slug} = await params
        const page = await getPageBySlug(slug);

        if (!page || page.status !== "published") {
            return {
                title: "Page Not Found",
                description: "The requested page could not be found.",
            };
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
        };
    } catch {
        return {
            title: "Page Not Found",
            description: "The requested page could not be found.",
        };
    }
}

// generating static params
export async function generateStaticParams() {
    const pages = await getPageSlugs("blog")
    return pages.map((page) => ({
        slug: page.slug,
    }))
}

// Page renderer
export default async function Page({params,}: { params: Promise<{ slug: string }> }) {
    try {
        const {slug} = await params
        const page = await getPageBySlug(slug);

        if (!page || page.status !== "published") {
            notFound();
        }

        return (
            <main>
                <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                    {JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                {name: "Home", url: "https://www.makisala.com"},
                                {name: "Blog", url: "https://www.makisala.com/blog"},
                                {name: `${page.title}`, url: `https://www.makisala.com/blog/${slug}`},
                            ]
                        }),
                        BlogSchema({
                            headline: `${page.title}`,
                            image: `${page.featured_image_url}`,
                            description: `${page.excerpt}`,
                        }),
                        page.faqs && FAQSchema({faqs: page.faqs}),
                    ])}
                </Script>
                <div className="min-h-screen bg-white">
                    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                        {page.featured_image_url && (
                            <div className="mb-8">
                                <Image
                                    src={page.featured_image_url}
                                    alt={page.title}
                                    width={800}
                                    height={400}
                                    className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                                />
                            </div>
                        )}

                        <header className="mb-8">
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                                {page.title}
                            </h1>
                            {page.excerpt && (
                                <p className="text-xl text-gray-600 leading-relaxed">
                                    {page.excerpt}
                                </p>
                            )}
                            <div className="flex items-center space-x-4 mt-6 text-sm text-gray-500">
                                <time dateTime={page.createdAt}>
                                    {new Date(page.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </time>
                                <span>•</span>
                                <span>{page.page_type === "blog" ? "Blog Post" : "Page"}</span>
                            </div>
                        </header>

                        <MarkdownRenderer content={page.content}/>
                        {page.faqs &&
                            <FAQ
                                faqs={page.faqs}
                            />
                        }
                    </article>
                </div>
            </main>
        );
    } catch {
        notFound();
    }
}
