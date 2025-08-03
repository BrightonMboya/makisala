import type {Metadata} from "next";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {getTourPackageBySlug, getTourPackagesSlugs} from "@/lib/cms-service";
import {Badge} from "@/components/ui/badge";
import {
    Bed,
    Calendar,
    Car,
    CheckCircle,
    Globe,
    MapPin, Users,
    XCircle
} from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {notFound} from "next/navigation";
import {MobileNavigation, DesktopNavigation} from "./_components/PageNavigation"
import {InquiryDialog} from "@/components/enquire-dialog-button";
import {Button} from "@/components/ui/button";
import {BreadcrumbSchema, TouristTripSchema} from "@/components/schema";
import Script from "next/script";

export async function generateMetadata({params,}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const {slug} = await params
    const tourPackageData = await getTourPackageBySlug(slug)

    if (!tourPackageData) {
        return {
            title: "Tour not found | Makisala Safaris",
        };
    }
    const country = tourPackageData.country;
    const days = tourPackageData.numberOfDays;
    const destination = tourPackageData.destination;

    return {
        title: `${tourPackageData.title} – Makisala Safaris`,
        description: `${tourPackageData.title} is a ${days}-day safari adventure in ${destination}, ${country}. Explore highlights, top experiences, and more.`,
        keywords: [
            `${tourPackageData.title}`,
            `${destination} safari`,
            `${country} tours`,
            `African safari ${destination}`,
            `book ${tourPackageData.title}`
        ],
        openGraph: {
            title: `${tourPackageData.title} – Makisala Safaris`,
            description: `Discover what awaits on this unforgettable ${days}-day journey through ${destination}.`,
            images: [
                {
                    url: tourPackageData.hero_image_url,
                    width: 1200,
                    height: 630,
                    alt: tourPackageData.title,
                },
            ],
        },
    };
}

export async function generateStaticParams() {
    const pages = await getTourPackagesSlugs()
    return pages.map((page) => ({
        slug: page.slug,
    }))
}


export default async function Page({params,}: { params: Promise<{ slug: string }> }) {
    const {slug} = await params
    const tourPackageData = await getTourPackageBySlug(slug)

    const inclusions = [
        'Airport transfers',
        'All accommodation as specified',
        'All meals during the safari',
        'Professional English-speaking guide',
        'Game drives in 4WD vehicle',
        'Park entrance fees',
        'Bottled water during game drives'
    ];
    const exclusions = [
        'International flights',
        'Visa fees',
        'Travel insurance',
        'Personal expenses',
        'Tips and gratuities',
        'Optional activities',
        'Alcoholic beverages'
    ];

    if (!tourPackageData) {
        return notFound();
    }
    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            {name: "Home", url: "https://www.makisala.com"},
                            {name: `${tourPackageData.title}`, url: `https://www.makisala.com/to_book/${slug}`},
                        ]
                    }),
                    TouristTripSchema({
                        name: tourPackageData.title,
                        description: `${tourPackageData.title} is a ${tourPackageData.numberOfDays}-day safari adventure in ${tourPackageData.destination}, ${tourPackageData.country}. Explore highlights, top experiences, and more.`,
                        url: `https://www.makisala.com/to_book/${slug}`,
                        pricingStartsFrom: tourPackageData.pricing_starts_from!,
                        itineraryItems: tourPackageData.itineraries.map((item) => ({
                            name: `${item.title}`,
                            description: `${item.activities}`
                        }))
                    })
                ])}
            </Script>
            <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
                {/* Hero Section */}
                <div className="relative h-[60vh] lg:h-[80vh] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{backgroundImage: `url(${tourPackageData.hero_image_url})`}}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"/>
                    </div>

                    <div className="relative h-full flex items-end">
                        <div className="container mx-auto px-6 pb-12">
                            <div className="max-w-4xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge className="bg-white/20 text-white border-white/30 capitalize">
                                        {`From $${tourPackageData.pricing_starts_from}`}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                        <Calendar className="h-3 w-3 mr-1"/>
                                        {tourPackageData.numberOfDays} Days
                                    </Badge>
                                    <Badge variant="secondary"
                                           className="bg-white/20 text-white border-white/30 capitalize">
                                        <MapPin className="h-3 w-3 mr-1"/>
                                        {tourPackageData.country}
                                    </Badge>
                                </div>

                                <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                                    {tourPackageData.title}
                                </h1>

                                <p className="text-xl text-white/90 flex items-center gap-2">
                                    <Globe className="h-5 w-5"/>
                                    {tourPackageData.destination}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex lg:flex-row flex-col">
                    {/* Navigation - Horizontal on mobile, sidebar on desktop */}
                    <div className="lg:w-72 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto">
                        {/* Mobile horizontal navigation */}
                        <div className="lg:hidden bg-card/95 backdrop-blur-lg border-b border-border">
                            <div className="container mx-auto px-6 py-4">
                                <div className="grid grid-cols-2 gap-2 pb-4 md:hidden">
                                    <MobileNavigation/>
                                </div>
                            </div>
                        </div>

                        {/* Desktop sidebar navigation */}
                        <DesktopNavigation/>
                    </div>

                    {/* Main content */}
                    <div className="flex-1">
                        <div className="container mx-auto px-6 py-12">
                            <div className="max-w-4xl mx-auto">

                                {/* Overview */}
                                <section id="overview" className="scroll-mt-8">
                                    <Card className="mb-12 shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <MarkdownRenderer content={tourPackageData.overview}/>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Daily Itinerary */}
                                <section id="itinerary" className="scroll-mt-8">
                                    <h2 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent">
                                        Daily Itinerary
                                    </h2>

                                    <div className="space-y-6 mb-12">
                                        {tourPackageData.itineraries.map((day, index) => (
                                            <Card key={day.id}
                                                  className="shadow-elegant border-0 bg-card/50 backdrop-blur-sm overflow-hidden">
                                                <CardHeader
                                                    className="border-b border-primary/20">
                                                    <div
                                                        className="flex flex-col gap-3 lg:gap-0 lg:flex-row lg:items-center justify-between">
                                                        <CardTitle className="text-xl text-primary">
                                                            {day.title}
                                                        </CardTitle>
                                                        {day.estimatedDrivingDistance && (
                                                            <Badge variant="outline"
                                                                   className="border-primary/30 text-primary">
                                                                <Car className="h-3 w-3 mr-1"/>
                                                                {day.estimatedDrivingDistance}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="pt-6">
                                                    <div className="grid gap-6">
                                                        {/* Activities */}
                                                        <div>
                                                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                                What you will do
                                                            </h4>
                                                            <p className="text-muted-foreground leading-relaxed">
                                                                {day.activities}
                                                            </p>
                                                        </div>

                                                        {/* Accommodation */}
                                                        {day.accommodation && day.accommodation !== 'Day trip - departure' && (
                                                            <div>
                                                                <h4 className="font-semibold mb-3 flex items-center gap-2 ">
                                                                    <Bed className="h-4 w-4"/>
                                                                    Accommodation
                                                                </h4>
                                                                <MarkdownRenderer content={day.accommodation}/>
                                                            </div>
                                                        )}

                                                        {day.accommodation === 'Day trip - departure' && (
                                                            <div>
                                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                                    <Bed className="h-4 w-4"/>
                                                                    Departure Day
                                                                </h4>
                                                                <p className="text-muted-foreground">
                                                                    Transfer arrangements included
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </CardContent>

                                                {index < tourPackageData.itineraries.length - 1 && (
                                                    <div className="px-6 pb-6">
                                                        <Separator
                                                            className="bg-gradient-to-r from-transparent via-primary/30 to-transparent"/>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </section>

                                {/* Inclusions */}
                                <section id="inclusions" className="scroll-mt-8">
                                    <Card className="mb-12 shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <CheckCircle className="h-6 w-6 text-primary"/>
                                                Inclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {inclusions.map((inclusion, index) => (
                                                    <div key={index} className="flex items-center gap-3">
                                                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0"/>
                                                        <span className="text-muted-foreground">{inclusion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Exclusions */}
                                <section id="exclusions" className="scroll-mt-8">
                                    <Card className="mb-12 shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <XCircle className="h-6 w-6 text-primary"/>
                                                Exclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {exclusions.map((exclusion, index) => (
                                                    <div key={index} className="flex items-center gap-3">
                                                        <XCircle className="h-4 w-4 text-red-500 flex-shrink-0"/>
                                                        <span className="text-muted-foreground">{exclusion}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <section className="py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
                <div className="max-w-4xl mx-auto text-center px-6">
                    <h2 className="text-4xl font-bold mb-6">What you’re looking for isn’t just out there, it’s waiting
                        for you.</h2>
                    <div className="justify-center">
                        <InquiryDialog>
                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                <Users className="h-5 w-5 mr-2"/>
                                Speak with Our Experts
                            </Button>
                        </InquiryDialog>
                    </div>
                </div>
            </section>
        </>
    )
}