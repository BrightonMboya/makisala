import {getTours} from "@/lib/cms-service";
import {TourCard} from "./_components/TourCard";
import {countries, modifiers, safariDescriptions} from "@/lib/p_seo_info";
import {capitalize} from "@/lib/utils";
import {BreadcrumbSchema} from "@/components/schema";
import Script from "next/script";
import {BASE_URL} from "@/lib/constants"
import {notFound} from "next/navigation"

interface Params {
    params: {
        country: string;
        modifier: string;
    }
}


export async function generateMetadata({params}: Params) {
    const {country, modifier} = await params;
    return {
        title: `${modifier.replace("-", " ")} safaris in ${country} | Makisala Safaris`,
        description: `Discover the best ${modifier.replace("-", " ")} safari tours in ${country}. Tailored itineraries, expert guides, and unforgettable adventures.`,
    };
}


export async function generateStaticParams() {
    return countries.flatMap(country =>
        modifiers.map(modifier => ({country, modifier}))
    );
}

export default async function SafariPage({params}: Params) {
    const {country, modifier} = await params;
    if (!countries.includes(country) || !modifiers.includes(modifier)) {
        return notFound()
    }
    const tours = await getTours(country, modifier);

    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: BASE_URL},
                            {name: "All Safaris", url: `${BASE_URL}/safaris`},
                            {name: `All ${capitalize(country)} Safaris`, url: `${BASE_URL}/safaris/${country}`},
                            {
                                name: `${modifier} ${capitalize(country)} Safaris`,
                                url: `${BASE_URL}/safaris/${country}/${modifier}`
                            },
                        ]
                    }),
                ])}
            </Script>
            <main className="mt-[60px]">
                <div className="min-h-screen bg-background">
                    <div className="bg-gradient-to-r from-safari-gold/10 to-safari-bronze/10 border-b border-border">
                        <div className="container mx-auto px-4 py-8">
                            <h1 className="text-4xl font-bold text-safari-earth mb-2">{`${capitalize(modifier.replace("-", " "))} ${capitalize(country)} Safaris`}</h1>
                            <p className="text-muted-foreground">
                                {safariDescriptions[`${country}-${modifier}`]}
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
    );
}

