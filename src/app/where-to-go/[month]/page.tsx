import {getPageById} from "@/lib/cms-service";
import {notFound} from "next/navigation";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {FAQ} from "@/components/faq";
import {BreadcrumbSchema, FAQSchema} from "@/components/schema";
import Script from "next/script";
import C2A from "@/components/home/call-to-action"
import type {Metadata} from "next";
import MonthNavigator from "../[month]/_components/month_navigator";
import {articles_url} from "@/app/where-to-go/[month]/_components/data";

interface IParams {
    params: {
        month: string;
    }
}

export async function generateMetadata({params}: IParams): Promise<Metadata> {
    try {
        const {month} = await params
        const article_url = articles_url.find(page => page.month === month)?.page_url
        if (!article_url) {
            return {
                title: "Page Not Found",
                description: "The requested page could not be found.",
            };
        }
        const page = await getPageById(article_url)


        return {
            title: page?.meta_title || page?.title,
            description: page?.meta_description || page?.excerpt,
            keywords: page?.meta_keywords,
            openGraph: {
                title: page?.meta_title || page?.title,
                description: page?.meta_description! || page?.excerpt!,
                images: page?.featured_image_url ? [page?.featured_image_url] : [],
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
    const {month} = await params;
    const article_url = articles_url.find(page => page.month === month)?.page_url

    if (!article_url) {
        return notFound()
    }
    const page = await getPageById(article_url)

    if (!page) {
        return notFound()
    }

    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: "https://www.makisala.com"},
                            {
                                name: `Where to travel/${month}`,
                                url: `https://www.makisala.com/where_to_travel/${month}`
                            },
                        ]
                    }),
                    FAQSchema({faqs: page.faqs!})
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


            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <MonthNavigator/>
                <MarkdownRenderer content={page.content}/>
                <FAQ faqs={page.faqs!}/>
            </main>
            <C2A/>
        </>
    )
}

