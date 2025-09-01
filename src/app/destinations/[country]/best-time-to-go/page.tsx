import {MarkdownRenderer} from "@/components/markdown-renderer";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {IParams} from "@/app/destinations/[country]/types";
import {getBestTimeToVisit} from "@/lib/cms-service";
import Script from "next/script";
import {BreadcrumbSchema} from "@/components/schema";
import {BASE_URL} from "@/lib/constants";
import {capitalize} from "@/lib/utils";

export async function generateMetadata({params}: IParams): Promise<Metadata> {
    try {
        const {country} = await params
        const destination = await getBestTimeToVisit(country);

        if (!destination) {
            return {
                title: "Page Not Found",
                description: "The requested page could not be found.",
            };
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
        };
    } catch {
        return {
            title: "Page Not Found",
            description: "The requested page could not be found.",
        };
    }
}


export default async function Page({params}: IParams) {
    const {country} = await params;
    const destination = await getBestTimeToVisit(country);

    if (!destination) {
        return notFound()
    }
    return (
        <main>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: BASE_URL},
                            {name: "Tanzania", url: `${BASE_URL}/destinations/${country}`},
                            {
                                name: `Best time to go to ${capitalize(country)}`,
                                url: `${BASE_URL}/destinations/${country}/best-time-to-go`
                            },
                        ]
                    }),
                ])}
            </Script>
            <h1 className="pb-10 text-4xl font-semibold">{destination.title}</h1>
            <MarkdownRenderer content={destination.content}/>
        </main>
    )
}