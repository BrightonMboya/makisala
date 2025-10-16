import {notFound} from "next/navigation";
import type {Metadata} from "next";

import {getPageBySlug, getPageSlugs, getTourPackagesByLocation} from "@/lib/cms-service";
import Link from "next/link";
import ImageCard from "@/components/home/image-card";
import C2A from "@/components/home/call-to-action";
import {BreadcrumbSchema, TouristDestinationSchema} from "@/components/schema";
import Script from "next/script";
import Image from "next/image";
import {InquiryDialog} from "@/components/enquire-dialog-button";
import {Button} from "@/components/ui/button";
import {MarkdownRenderer} from "@/components/markdown-renderer";

// Metadata for SEO
export async function generateMetadata({params,}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    try {
        const {slug} = await params
        const page = await getPageBySlug(slug);

        if (!page || page.status !== "published" || page.page_type !== "page") {
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
    const pages = await getPageSlugs("page")
    return pages.map((page) => ({
        slug: page.slug,
    }))
}

// Page renderer
export default async function BlogPostPage({params,}: { params: Promise<{ slug: string }> }) {
    const {slug} = await params
    const page = await getPageBySlug(slug);

    if (!page || page.status !== "published") {
        notFound();
    }
    const tours = await getTourPackagesByLocation(slug);

    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: "https://www.makisala.com"},
                            {name: `${slug}`, url: `https://www.makisala.com/location/${slug}`,},
                        ]
                    }),
                    TouristDestinationSchema({
                        description: page.meta_description!,
                        image: page.featured_image_url!,
                        name: page.title,
                        url: `https://www.makisala.com/location/${slug}`,
                        country: slug === 'rwanda' ? 'Rwanda' : 'Tanzania'
                    })
                ])}
            </Script>
            <div className="min-h-screen bg-white relative">
                {page.featured_image_url && (
                    <section className="relative h-screen flex items-center justify-start overflow-hidden mt-16">
                        <div className="absolute inset-0">
                            <Image
                                src={page.featured_image_url}
                                alt="Makisala Safaris"
                                fill
                                className="object-cover"
                                priority
                            />
                            <div className="absolute inset-0 bg-black/70"/>
                        </div>
                        <div className="relative z-10 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                            <div className="max-w-2xl">
                                <div className="text-sm font-medium tracking-wider mb-4">
                                    DESTINATION
                                </div>
                                <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                                    {page.title}
                                </h1>
                                <p className="text-white text-lg md:text-xl mb-8">
                                    {page.excerpt}
                                </p>
                                <div className="flex space-x-4">
                                    <InquiryDialog>
                                        <Button size="lg"
                                                className="bg-transparent border-2 border-white text-white  hover:bg-white hover:text-black px-8 py-3 text-lg font-medium">
                                            Start Planning
                                        </Button>
                                    </InquiryDialog>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:max-w-7xl py-16">
                    <MarkdownRenderer content={page.content}/>
                </article>
            </div>
            <p className="text-center font-bold text-3xl lg:text-5xl py-5">Safaris itineraries to inspire your
                journey</p>
            <div
                className="mx-auto mb-24 grid max-w-7xl gap-12 justify-center max-sm:flex max-sm:h-full max-sm:flex-col md:grid-cols-2 xl:grid-cols-3">
                {tours?.map((tour) => (
                    <div key={tour.id} className="">
                        <Link href={`/to_book/${tour.slug}`}>
                            <ImageCard
                                title={tour.title}
                                img_url={tour.hero_image_url || "/placeholder.svg"}
                                alt="Makisala Blog"
                                description={tour.overview!}
                                truncate={true}
                            />
                        </Link>
                    </div>
                ))}
            </div>
            <C2A/>
        </>
    );

}
