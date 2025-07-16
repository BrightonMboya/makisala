import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPageBySlug } from "@/lib/cms-service";
import PagePreview from "@/app/PagePreview";
import {PageData} from "@/app/cms/page";

interface BlogPostPageProps {
    params: {
        slug: string;
    };
}

// Metadata for SEO
export async function generateMetadata({
                                           params,
                                       }: BlogPostPageProps): Promise<Metadata> {
    try {
        const page = await getPageBySlug(params.slug);

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

// Page renderer
export default async function BlogPostPage({ params }: BlogPostPageProps) {
    try {
        const page = await getPageBySlug(await params.slug);

        if (!page || page.status !== "published") {
            notFound();
        }

        return (
            <PagePreview page={page as PageData}/>
        );
    } catch {
        notFound();
    }
}
