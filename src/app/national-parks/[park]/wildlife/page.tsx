import {IParams} from "@/app/national-parks/[park]/type";
import {getNPInfo} from "@/lib/cms-service";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {notFound} from "next/navigation";
import Script from "next/script";
import {BreadcrumbSchema} from "@/components/schema";
import {BASE_URL} from "@/lib/constants";
import {capitalize} from "@/lib/utils";
import type {Metadata} from "next";

export async function generateMetadata({params}: IParams): Promise<Metadata> {
    const {park} = await params;
    const {page} = await getNPInfo(park, 'wildlife_page_id')

    if (!page) {
        return {
            title: "Page not found",
            description: "The requested page could not be found.",
        }
    }

    return {
        title: page.meta_title,
        description: page.meta_description,
        openGraph: {
            title: page.title,
            description: page.meta_description!,
            images: page.featured_image_url!
        }
    }
}

export default async function page({params}: IParams) {
    const {park} = await params;
    const {park: np, page} = await getNPInfo(park, 'wildlife_page_id')

    if (!page) {
        return notFound()
    }

    return (
        <main>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: BASE_URL},
                            {
                                name: `${capitalize(np.country)} National Parks`,
                                url: `${BASE_URL}/safaris/${np.country}/where-to-go`
                            },
                            {
                                name: `${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/safaris/${np.name}/`
                            },
                            {
                                name: `Best time to visit ${capitalize(np.name)} National Park`,
                                url: `${BASE_URL}/national-parks/${np.name}/wildlife`
                            },
                        ]
                    }),
                ])}
            </Script>

            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-no-repeat object-cover"
                    style={{backgroundImage: `url(${page.featured_image_url})`}}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"/>
                </div>
                <div className="relative h-full flex items-end">
                    <div className="container mx-auto px-6 pb-12">
                        <div className="max-w-4xl">
                            <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight">
                                {page.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-[20px] flex items-center justify-center">
                <MarkdownRenderer content={page.content}/>
            </section>
        </main>
    )
}