import {getDestinationOverview} from "@/lib/cms-service";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {notFound} from "next/navigation";
import type {Metadata} from "next";
import {IParams} from "@/app/safaris/[country]/types";
import {BreadcrumbSchema, FAQSchema} from "@/components/schema";
import {BASE_URL} from "@/lib/constants";
import {capitalize} from "@/lib/utils";
import Script from "next/script";
import {FAQ} from "@/components/faq";

export async function generateMetadata({params}: IParams): Promise<Metadata> {
    try {
        const {country} = await params
        const destinationOverview = await getDestinationOverview(country);

        if (!destinationOverview) {
            return {
                title: "Page Not Found",
                description: "The requested page could not be found.",
            };
        }

        return {
            title: destinationOverview.meta_title || destinationOverview.title,
            description: destinationOverview.meta_description || destinationOverview.excerpt,
            keywords: destinationOverview.meta_keywords,
            openGraph: {
                title: destinationOverview.meta_title || destinationOverview.title,
                description: destinationOverview.meta_description! || destinationOverview.excerpt!,
                images: destinationOverview.featured_image_url ? [destinationOverview.featured_image_url] : [],
            },
        };
    } catch {
        return {
            title: "Page Not Found",
            description: "The requested page could not be found.",
        };
    }
}

export default async function HomePage({params}: IParams) {
    const {country} = await params;
    const destinationOverview = await getDestinationOverview(country);

    if (!destinationOverview) {
        return notFound()
    }

    return (
        <main className="">
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: BASE_URL},
                            {name: "Tanzania", url: `${BASE_URL}/safaris/${country}`},
                            {name: `Why Visit ${capitalize(country)}`, url: `${BASE_URL}/safaris/${country}`},
                        ]
                    }),
                    destinationOverview.faqs && FAQSchema({faqs: destinationOverview.faqs})
                ])}
            </Script>
            <h1 className="pb-5 text-4xl font-medium">{destinationOverview.title}</h1>
            <MarkdownRenderer content={destinationOverview?.content!}/>
            {destinationOverview.faqs &&
                <FAQ
                    faqs={destinationOverview.faqs}
                />
            }
        </main>
    )
}
