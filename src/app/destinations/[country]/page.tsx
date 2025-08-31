import {getDestinationOverview} from "@/lib/cms-service";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {notFound} from "next/navigation";
import type {Metadata} from "next";

interface IParams {
    params: {
        country: string
    }
}

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
        <div className="">
            <h3 className="pb-10 text-4xl font-medium">{destinationOverview.title}</h3>
            <MarkdownRenderer content={destinationOverview?.content!}/>
        </div>
    )
}
