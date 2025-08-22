import {BreadcrumbSchema} from "@/components/schema";
import {BASE_URL} from "@/lib/constants";
import {capitalize} from "@/lib/utils";
import Script from "next/script";
import {notFound} from "next/navigation"
import {countries, countryDescriptions} from "@/lib/p_seo_info";
import {getToursByCountry} from "@/lib/cms-service";
import {TourCard} from "@/app/safaris/[country]/[modifier]/_components/TourCard";

interface Params {
    params: {
        country: string;
    }
}

export async function generateMetadata({params}: Params) {
    const {country} = await params;
    return {
        title: `${capitalize(country)} Safaris | Makisala Safaris`,
        description: `Discover the best safaris in ${capitalize(country)} offered by Makisala Safaris`,
    }
}

export async function generateStaticParams() {
    return countries.map((country) => ({
        country,
    }));
}


export default async function Page({params}: Params) {
    const {country} = await params;

    if (!countries.includes(country)) {
        return notFound()
    }

    const tours = await getToursByCountry(country);
    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: BASE_URL},
                            {name: "All Safaris", url: `${BASE_URL}/safaris`},
                            {name: `All ${capitalize(country)} Safaris`, url: `${BASE_URL}/safaris/${country}`},
                        ]
                    }),
                ])}
            </Script>
            <main className="mt-[60px]">
                <div className="min-h-screen bg-background">
                    <div className="bg-gradient-to-r from-safari-gold/10 to-safari-bronze/10 border-b border-border">
                        <div className="container mx-auto px-4 py-8">
                            <h1 className="text-4xl font-bold text-safari-earth mb-2">{`${capitalize(country)} Safaris`}</h1>
                            <p className="text-muted-foreground">
                                {countryDescriptions[`${country}`]}
                            </p>
                        </div>
                    </div>

                    {/* Tours Grid */}
                    <div className="container mx-auto px-4 py-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {tours.map((tour) => (
                                // @ts-ignore
                                <TourCard key={tour.id} tour={tour}/>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </>
    )
}