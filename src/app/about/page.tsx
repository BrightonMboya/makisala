import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import type {Metadata} from "next";
import {BreadcrumbSchema} from "@/components/schema";
import Script from "next/script";
import C2A from "@/components/home/call-to-action";

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
            title: "Genuine Hospitality",
            description: "From your first enquiry to your final farewell, we treat you like family with warmth, respect, and care."
        },
        {
            title: "Unmatched Expertise",
            description: "Our team combines local insight with global standards to deliver safaris that are safe, seamless, and special."
        },
        {
            title: "Personalised Journeys",
            description: "No two travelers are the same. Every itinerary we design is crafted around your unique interests and pace."
        },
        {
            title: "Respect for Nature",
            description: "We champion ethical travel that supports wildlife conservation and uplifts the communities we work with."
        }
    ];

    return (
        <main className="min-h-screen bg-background">
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: "https://www.makisala.com"},
                            {name: "About", url: "https://www.makisala.com/about"},
                        ]
                    })
                ])}
            </Script>
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
                            About Us | Makisala Safaris
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
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Rooted in Africa, Built on Passion</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    Makisala was born from a deep love for travel and a desire to share the raw beauty
                                    of East Africa with the world. What began as a local initiative has grown into a
                                    trusted safari company, helping travelers from all corners of the globe experience
                                    Africa with depth and authenticity.

                                </p>
                                <p>
                                    We don’t just plan trips, we craft meaningful journeys that immerse you in the
                                    land, people, and wildlife that make Africa unlike anywhere else. Over the years,
                                    our purpose has stayed the same: create experiences that feel personal, impactful,
                                    and unforgettable.
                                </p>

                                <p>
                                    You can also find us on <a href="www.safaribookings.com"
                                                               className="text-primary font-medium">Safari
                                    Bookings</a> one of the leading safari platforms, where travelers explore and book
                                    authentic East African experiences.
                                </p>
                            </div>
                        </div>
                        <div className="relative">
                            <img
                                src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80"
                                alt="Makisala Safaris"
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
                                src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753794966/voluntourism-in-africa_h0mw7h.jpg"
                                alt="voluntourism in Tanzania"
                                className="rounded-lg shadow-lg w-full"
                            />
                        </div>
                        <div className="order-1 md:order-2">
                            <Badge variant="secondary" className="mb-4">Our Mission</Badge>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Travel with Purpose, Return with
                                Perspective</h2>
                            <div className="space-y-4 text-muted-foreground">
                                <p>
                                    At Makisala, we believe travel should go beyond sightseeing. It should change how
                                    you see the world.
                                    Our mission is to connect cultures, spark curiosity, and foster respect for nature
                                    and people.
                                </p>
                                <p>
                                    Every safari we plan supports local guides, responsible tourism, and
                                    conservation efforts ensuring that the Africa you fall in love with today will
                                    still be here tomorrow.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <C2A/>
        </main>
    );
};
