import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Heart, Users, MapPin, ArrowRight} from "lucide-react";
// import honeymoonHero from "@/assets/honeymoon-hero.jpg";
// import luxuryTent from "@/assets/luxury-tent.jpg";
// import romanticDinner from "@/assets/romantic-dinner.jpg";

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

const HoneymoonSafaris = () => {
    const honeymoonHero = "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366509/honeymoon-safaris-8_mtemjt.jpg"
    const luxuryTent = "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366416/Joys-Camp-1_nbu2ps.jpg"
    const romanticDinner = "https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366308/honeymoon-safaris-tanzania_wsl3ys.jpg"
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <section
                className="relative h-screen items-center flex justify-start"
                style={{
                    backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${honeymoonHero})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed'
                }}
            >
                <div className="relative z-10 pl-10 mt-20 absolute">
                    <h1 className="text-5xl md:text-7xl md:max-w-5xl font-bold text-white mb-4">
                        Safaris for Couples & Honeymooners
                    </h1>
                    <p className="text-xl md:text-2xl text-white/90 mb-8 font-light">
                        Rekindle, reconnect, and re-discover with each other.
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
                        <img src={honeymoonHero} alt="Safari lodge with romantic setting"
                             className="w-full h-80 object-cover rounded-lg"/>
                        <img src={luxuryTent} alt="Luxury tent interior"
                             className="w-full h-80 object-cover rounded-lg"/>
                        <img src={romanticDinner} alt="Romantic dinner setup"
                             className="w-full h-80 object-cover rounded-lg"/>
                    </div>
                </div>
            </section>

            <section className=" ">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="prose prose-lg max-w-none text-lg text-muted-foreground leading-relaxed ">
                        <p className="mb-6">
                            There’s something about the African wilderness, the stillness, the skies, the stars that
                            turns every moment into something unforgettable. Whether you're just beginning your life
                            together or celebrating a milestone, a couple’s safari in Africa is more than a holiday,
                            it’s an experience that draws you closer.
                        </p>

                        <h2 className="text-4xl font-bold pt-10 text-black">What to Expect on a Romantic Safari</h2>
                        <p className="pt-3">You're waking up to the soft rustle of the wind through the trees, your
                            partner still wrapped in sleep beside you. Outside, the sky is turning the softest shade of
                            pink. You sip coffee in silence, watching elephants move through the morning mist, no
                            noise, no rush, just presence.</p>
                        <p className="pt-3">
                            Later, it's just the two of you, alone in the wild, chasing golden light on an evening game
                            drive. And when night falls? You're wrapped in a blanket by the fire, stars spilling across
                            the sky like confetti, your fingers intertwined, no words needed.
                        </p>
                        <p className="pt-3 font-medium text-black">
                            This is what it feels like to fall in love again, with them, with the moment, with life.
                        </p>

                        <h2 className="text-4xl font-bold pt-10 text-black">Reasons why this safari is what you
                            need</h2>
                        <p className="pt-3">
                            Let’s be honest, life gets loud. Kids, work, bills, routines.
                            But out here? There's only wind through the grass, firelight, and each other.
                        </p>
                        <p className="pt-3">
                            We design safaris that are tailored for two:
                        </p>
                        <ul className="list-disc pl-10">
                            <li>Hidden camps in private reserves</li>
                            <li>Stylish tented suites with plunge pools and outdoor bathtubs</li>
                            <li>Personal guides who move at your pace</li>
                            <li>Nights under the stars and stories by the fire</li>
                        </ul>
                        <p className="pt-3">
                            Whether you're looking to unwind, reignite, or simply celebrate your love, the wild offers a
                            backdrop that makes everything else fall away.
                        </p>

                    </div>
                </div>
            </section>

            {/* Why an African safari is perfect for couples */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-8">Planning Your Honeymoon Safari? We Got You.</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            We know what it’s like, planning a wedding is beautiful chaos. So let us take over the
                            honeymoon part.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            Want a sunrise balloon flight over the Serengeti?
                            Or maybe ending your safari with a few barefoot days on a quiet island in Zanzibar?
                            Done.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            We’ll help you put together something unforgettable, from the lodges to the little
                            surprises.
                        </p>
                    </div>
                </div>
            </section>

            {/* Safaris for Honeymooners */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-8">Not on a Honeymoon? No Problem.</h2>
                    <div className="prose prose-lg max-w-none">
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            Love doesn’t need a reason, and a safari doesn’t need a label.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            Whether you're celebrating an anniversary, popping the question, or just need a break from
                            the noise, there’s a perfect safari waiting for you. Some couples even bring letters to
                            read to each other by the campfire. Others don’t say a word, they just sit in stillness and
                            soak it all in.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Africa offers countless picturesque honeymoon settings and we know just where to take you to
                            guarantee incredible experiences. There is a broad range of honeymoon itineraries on offer,
                            but feel free to contact us if there's something specific you have in mind.
                        </p>

                        <p className="text-lg font-medium pt-3">
                            This is your journey. We're just here to help you shape it.
                        </p>
                    </div>
                </div>
            </section>

            {/* Our Favourite Honeymoon & Romantic Safaris */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Our Favourite Honeymoon & Romantic Safaris!</h2>
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
                    <h2 className="text-4xl font-bold mb-6">Ready to Start Your African Love Story?</h2>
                    <p className="text-xl mb-8 text-muted-foreground">
                        Let us create the perfect honeymoon safari that you'll treasure forever
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

export default HoneymoonSafaris;