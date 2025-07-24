import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Users, MapPin, ArrowRight} from "lucide-react";
import type {Metadata} from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `Family African Safaris | Makisala Safaris`,
        description: "Reconnect with your loved ones on a tailor-made African safari. Private game drives, family-friendly lodges, and unforgettable shared moments in the wild.",
        openGraph: {
            title: `Family African Safaris | Makisala Safaris`,
            description: `Reconnect with your loved ones on a tailor-made African safari. Private game drives, family-friendly lodges, and unforgettable shared moments in the wild.`,
            images: [
                {
                    url: "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366416/Joys-Camp-1_nbu2ps.jpg",
                    width: 1200,
                    height: 630,
                    alt: "Makisala Safaris",
                },
            ],
        },
    };
}

const packages = [
    {
        id: 1,
        title: "Classic African Honeymoon",
        description: "Explore Cape Town's Winelands followed by seeing the BIG 5 in South Africa's Sabi Sands and Victoria Falls in Zambia",
        duration: "13 nights",
        price: "High-End",
        type: "Lodge",
        location: "South Africa",
        // image: luxuryTent,
        highlights: ["Winelands tour", "BIG 5 safari", "Victoria Falls", "Romantic dinners"]
    },
    {
        id: 2,
        title: "Romantic Tanzania Honeymoon Safari",
        description: "Handpicked luxurious safari lodges and mobile camps with front seat viewing of the wildebeest migration",
        duration: "10 nights",
        price: "High-End",
        type: "Lodge and Canvas",
        location: "Tanzania",
        // image: romanticDinner,
        highlights: ["Wildebeest migration", "Luxury lodges", "Private island", "Sunset cocktails"]
    },
    {
        id: 3,
        title: "Luxury Kenyan Bush and Beach Honeymoon",
        description: "Private plane, hot air balloon ride, sky bed under the night sky - the ultimate fairy tale adventure",
        duration: "14 nights",
        price: "High-End",
        type: "Lodge",
        location: "Kenya",
        // image: honeymoonHero,
        highlights: ["Private plane", "Hot air balloon", "Sky bed experience", "Private villa"]
    }
];

export default function Page() {
    const hero = "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373584/family-safari.jpg_vu3zur.jpg"
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section
                className="relative h-screen items-center flex justify-start"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${hero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="relative z-10 pl-10 mt-20 absolute">
                    <h1 className="text-5xl md:text-7xl md:max-w-5xl font-bold text-white mb-4">
                        Family Safari
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
                        A journey worth sharing. A bond worth strengthening.
                    </p>
                    <Button size="lg"
                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 text-lg font-medium">
                        Enquire Now
                    </Button>
                </div>
            </section>

            {/* Image Gallery */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <img src={hero} alt="Safari lodge with romantic setting"
                             className="w-full h-80 object-cover rounded-lg"/>
                        <img
                            src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753373725/6-Days-Best-Family-Safaris-and-Culture-Tour-in-Tanzania_l9fgum.jpg"
                            alt="Family Safari | Makisala Safaris"
                            className="w-full h-80 object-cover rounded-lg"/>
                        <img src="https://enjoykili.co.tz/wp-content/uploads/2022/12/family-safari-in-Tanzania-1.webp"
                             alt="Family Safari | Makisala Safaris"
                             className="w-full h-80 object-cover rounded-lg"/>
                    </div>
                </div>
            </section>

            <section className=" ">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="prose prose-lg max-w-none text-lg text-muted-foreground leading-relaxed ">
                        <h2 className="text-4xl font-bold pt-10 text-black">Real time together. The bonding that your
                            family needs.</h2>
                        <p className="pt-3">Maybe it’s been a while since you all travelled as a family.
                            Careers, distance, life, it gets in the way. And now, you're thinking: we need something
                            different. Not just a beach resort, not another cruise. Something that actually means
                            something.</p>
                        <p className="pt-3">
                            A safari gives you that space. It brings people together in a way few holidays can.
                        </p>
                        <p className="pt-3">
                            It’s the kind of trip where you’re all present. No distractions, no packed schedules. Just
                            shared experiences, the kind you talk about years later. You’re watching elephants cross
                            the river. You’re sitting around the fire telling old stories. You're all seeing the same
                            moment at the same time, and actually feeling it.
                        </p>

                        <h2 className="text-4xl font-bold pt-10 text-black">Reasons why this safari is what you
                            need</h2>

                        <p className="pt-3">
                            And whether you're bringing young kids, grown-up children, or your own parents, we tailor
                            everything around your pace and comfort.
                        </p>
                        <ul className="list-disc pl-10">
                            <li>Private guides who move with your rhythm</li>
                            <li>Lodges with space to breathe and connect</li>
                            <li>Game drives that turn into life lessons</li>
                            <li>Evenings with no agenda, just good food and better company</li>
                        </ul>
                        <p className="pt-3">
                            This isn’t about ticking off sights. It’s about getting the kind of time with your family
                            that’s hard to find these days.
                        </p>

                        <p className="pt-3">
                            So if you’ve been waiting for the right moment to bring everyone together, this is it.
                        </p>

                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Our Favourite Family Safaris!</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {packages.map((pkg) => (
                            <Card key={pkg.id} className="overflow-hidden hover:shadow-lg transition-shadow group">
                                <div className="relative overflow-hidden">
                                    <img
                                        src={pkg.image}
                                        alt={pkg.title}
                                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <Badge className="bg-white/20 text-white border-white/30 mb-2">
                                            {pkg.type}
                                        </Badge>
                                        <div className="text-sm">{pkg.duration} • {pkg.location}</div>
                                        <div className="text-xs mt-1">Budget level: {pkg.price}</div>
                                    </div>
                                </div>
                                <CardHeader>
                                    <CardTitle className="text-xl hover:text-primary transition-colors cursor-pointer">
                                        {pkg.title}
                                    </CardTitle>
                                    <CardDescription>{pkg.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h4 className="font-medium text-sm">Highlights:</h4>
                                            <ul className="text-sm text-muted-foreground space-y-1">
                                                {pkg.highlights.map((highlight, index) => (
                                                    <li key={index} className="flex items-center">
                                                        <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2"/>
                                                        {highlight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <Button className="w-full group">
                                            View Details
                                            <ArrowRight
                                                className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform"/>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Call to Action */}
            <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h2 className="text-4xl font-bold mb-6">Ready to Bring the Family Together?</h2>
                    <p className="text-xl mb-8 text-muted-foreground">
                        Let us help you plan a safari that’s all about connection, adventure, and time well spent.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="bg-primary hover:bg-primary/90">
                            <Users className="h-5 w-5 mr-2"/>
                            Speak with Our Experts
                        </Button>
                        <Button size="lg" variant="outline">
                            <MapPin className="h-5 w-5 mr-2"/>
                            View All Destinations
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
};