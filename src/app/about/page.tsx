import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import Link from "next/link";
import type {Metadata} from "next";

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: `About Us – Makisala Safaris`,
        description: "Get to know the story behind our company. With deep local roots, expert guides, and a passion for East Africa, we create unforgettable safari experiences across East Africa and beyond.",
        openGraph: {
            title: `About Us – Makisala Safaris`,
            description: `Get to know the story behind our company. With deep local roots, expert guides, and a passion for East Africa, we create unforgettable safari experiences across East Africa and beyond.`,
            images: [
                {
                    url: "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753032306/Africa-Tanzania-Serengeti-National-Park-hot-air-balloons-Website-1920x1080-fill-gravityauto-Q_AutoBest_yvo8ry.jpg",
                    width: 1200,
                    height: 630,
                    alt: "About Makisala Safaris",
                },
            ],
        },
    };
}

export default function Page() {
    const values = [
        {
            title: "Passion for Travel",
            description: "We believe travel transforms lives and creates lasting memories that connect people across cultures."
        },
        {
            title: "Excellence in Service",
            description: "Our commitment to quality ensures every journey exceeds expectations with personalized attention."
        },
        {
            title: "Expert Team",
            description: "Our experienced travel specialists bring local knowledge and global expertise to every adventure."
        },
        {
            title: "Sustainable Tourism",
            description: "We promote responsible travel that benefits local communities and preserves natural beauty."
        }
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative h-[60vh] lg:h-[80vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{backgroundImage: `url("https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753032306/Africa-Tanzania-Serengeti-National-Park-hot-air-balloons-Website-1920x1080-fill-gravityauto-Q_AutoBest_yvo8ry.jpg")`}}
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"/>
                </div>

                <div className="relative h-full flex items-end">
                    <div className="container mx-auto px-6 pb-12">
                        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                            About Us
                        </h1>
                    </div>
                </div>
            </div>

            {/* Our Story Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <Badge variant="secondary" className="mb-4">Our Story</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Turning Dreams into Journeys</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    Founded in 2009, WanderLust began as a small passion project by travel enthusiasts
                                    who believed that everyone deserves to experience the world's wonders. What started
                                    as organizing trips for friends and family has grown into a trusted travel company
                                    serving thousands of adventurers worldwide.
                                </p>
                                <p>
                                    Our journey has taken us across continents, through bustling cities and remote
                                    villages, mountain peaks and ocean depths. Each experience has shaped our
                                    understanding of what makes travel truly meaningful - it's not just about the
                                    destinations, but the connections we make and the perspectives we gain.
                                </p>
                                <p>
                                    Today, we continue to craft personalized travel experiences that go beyond typical
                                    tourism, creating opportunities for authentic cultural exchange and sustainable
                                    exploration.
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80"
                                alt="Mountain landscape representing our journey"
                                className="rounded-lg shadow-lg w-full"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 bg-muted/30">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <Badge variant="secondary" className="mb-4">Our Values</Badge>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">What Drives Us</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">
                            Our core values guide every decision we make and every journey we craft for our travelers.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((value, index) => (
                            <Card key={index} className="text-center h-full">
                                <CardContent className="p-6">
                                    <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                                    <p className="text-muted-foreground text-sm">{value.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div className="relative order-2 md:order-1">
                            <img
                                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80"
                                alt="Ocean wave representing our mission"
                                className="rounded-lg shadow-lg w-full"
                            />
                        </div>
                        <div className="order-1 md:order-2">
                            <Badge variant="secondary" className="mb-4">Our Mission</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Connecting Cultures, Creating
                                Memories</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    Our mission is to make the world more accessible and connected through meaningful
                                    travel experiences. We believe that travel is one of the most powerful tools for
                                    building understanding, empathy, and appreciation for our diverse planet.
                                </p>
                                <p>
                                    Every package we design, every partnership we forge, and every service we provide is
                                    guided by our commitment to responsible tourism that benefits travelers, local
                                    communities, and the environment alike.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                        Let us help you create memories that will last a lifetime. Explore our destinations and find
                        your next adventure.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            className="bg-background text-foreground px-8 py-3 rounded-md font-semibold hover:bg-background/90 transition-colors">
                            View Tour Packages
                        </button>
                        <Link href="/contact">
                            <button
                                className="border border-background text-background px-8 py-3 rounded-md font-semibold hover:bg-background/10 transition-colors">
                                Contact Us
                            </button>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};
