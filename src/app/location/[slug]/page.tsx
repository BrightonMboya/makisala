import {notFound} from "next/navigation";
import type {Metadata} from "next";

import {getPageBySlug, getPageSlugs, getTourPackagesByLocation} from "@/lib/cms-service";
import PagePreview from "@/app/PagePreview";
import {PageData} from "@/app/cms/page";
import Link from "next/link";
import ImageCard from "@/components/home/image-card";
import C2A from "@/components/home/call-to-action";

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
            <PagePreview page={page as PageData}/>
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
