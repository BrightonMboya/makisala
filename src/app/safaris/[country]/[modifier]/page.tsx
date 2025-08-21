import {getTours} from "@/lib/cms-service";
import {TourCard} from "./_components/TourCard";
import {countries, modifiers} from "@/lib/constants";

interface Params {
    params: {
        country: string;
        modifier: string;
    }
}


export async function generateMetadata({params}: Params) {
    const {country, modifier} = params;
    return {
        title: `${modifier.replace("-", " ")} safaris in ${country} | YourBrand`,
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
    const tours = await getTours(country, modifier);

    return (
        <main>
            <h1>{modifier.replace("-", " ")} safaris in {country}</h1>
            <p>Find the best {modifier.replace("-", " ")} safari options in {country}...</p>

            <div className="min-h-screen bg-background">
                <div className="bg-gradient-to-r from-safari-gold/10 to-safari-bronze/10 border-b border-border">
                    <div className="container mx-auto px-4 py-8">
                        <h1 className="text-4xl font-bold text-safari-earth mb-2">Tanzania Safari Tours</h1>
                        <p className="text-muted-foreground">
                            1-20 of 1,260 results. Rankings are based on performance, relevance and payment.
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
    );
}

