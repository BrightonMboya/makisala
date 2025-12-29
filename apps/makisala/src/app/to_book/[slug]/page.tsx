import type { Metadata } from 'next'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { getTourPackageBySlug, getTourPackagesSlugs } from '@/lib/cms-service'
import { Badge } from '@repo/ui/badge'
import { Bed, Calendar, Car, CheckCircle, Globe, MapPin, Users, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Separator } from '@repo/ui/separator'
import { notFound } from 'next/navigation'
import { DesktopNavigation, MobileNavigation } from './_components/PageNavigation'
import { InquiryDialog } from '@/components/enquire-dialog-button'
import { Button } from '@repo/ui/button'
import { BreadcrumbSchema, TouristTripSchema } from '@/components/schema'
import Script from 'next/script'
import { exclusions, inclusions } from '@/lib/constants'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>
}): Promise<Metadata> {
    const { slug } = await params
    const tourPackageData = await getTourPackageBySlug(slug)

    if (!tourPackageData) {
        return {
            title: 'Tour not found | Makisala Safaris',
        }
    }
    const country = tourPackageData.country
    const days = tourPackageData.numberOfDays
    const destination = tourPackageData.destination

    return {
        title: `${tourPackageData.title} – Makisala Safaris`,
        description: `${tourPackageData.title} is a ${days}-day safari adventure in ${destination}, ${country}. Explore highlights, top experiences, and more.`,
        keywords: [
            `${tourPackageData.title}`,
            `${destination} safari`,
            `${country} tours`,
            `African safari ${destination}`,
            `book ${tourPackageData.title}`,
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
    }
}

export async function generateStaticParams() {
    const pages = await getTourPackagesSlugs()
    return pages.map(page => ({
        slug: page.slug,
    }))
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const tourPackageData = await getTourPackageBySlug(slug)

    if (!tourPackageData) {
        return notFound()
    }
    return (
        <>
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                            {
                                name: `${tourPackageData.title}`,
                                url: `https://www.makisala.com/to_book/${slug}`,
                            },
                        ],
                    }),
                    TouristTripSchema({
                        name: tourPackageData.title,
                        description: `${tourPackageData.title} is a ${tourPackageData.numberOfDays}-day safari adventure in ${tourPackageData.destination}, ${tourPackageData.country}. Explore highlights, top experiences, and more.`,
                        url: `https://www.makisala.com/to_book/${slug}`,
                        pricingStartsFrom: tourPackageData.pricing_starts_from!,
                        itineraryItems: tourPackageData.itineraries.map(item => ({
                            name: `${item.title}`,
                            description: `${item.activities}`,
                        })),
                    }),
                ])}
            </Script>
            <div className="min-h-screen">
                {/* Hero Section */}
                <div className="relative h-[60vh] overflow-hidden lg:h-[80vh]">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{
                            backgroundImage: `url(${tourPackageData.hero_image_url})`,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>

                    <div className="relative flex h-full items-end">
                        <div className="container mx-auto px-6 pb-12">
                            <div className="max-w-4xl">
                                <div className="mb-4 flex items-center gap-2">
                                    <Badge className="border-white/30 bg-white/20 text-white capitalize">
                                        {`From $${tourPackageData.pricing_starts_from}`}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white"
                                    >
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {tourPackageData.numberOfDays} Days
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white capitalize"
                                    >
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {tourPackageData.country}
                                    </Badge>
                                </div>

                                <h1 className="text-3xl leading-tight font-bold text-white md:text-6xl">
                                    {tourPackageData.title}
                                </h1>

                                <p className="flex items-center gap-2 text-xl text-white/90">
                                    <Globe className="h-5 w-5" />
                                    {tourPackageData.destination}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="flex flex-col lg:flex-row">
                    {/* Navigation - Horizontal on mobile, sidebar on desktop */}
                    <div className="lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:overflow-y-auto">
                        {/* Mobile horizontal navigation */}
                        <div className="bg-card/95 border-border border-b backdrop-blur-lg lg:hidden">
                            <div className="container mx-auto px-6 py-4">
                                <div className="grid grid-cols-2 gap-2 pb-4 md:hidden">
                                    <MobileNavigation />
                                </div>
                            </div>
                        </div>

                        {/* Desktop sidebar navigation */}
                        <DesktopNavigation />
                    </div>

                    {/* Main content */}
                    <div className="flex-1">
                        <div className="container mx-auto px-6 py-12">
                            <div className="mx-auto max-w-4xl">
                                {/* Overview */}
                                <section id="overview" className="scroll-mt-8">
                                    <Card className="shadow-elegant bg-card/50 mb-12 border-0 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                Overview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <MarkdownRenderer content={tourPackageData.overview} />
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Daily Itinerary */}
                                <section id="itinerary" className="scroll-mt-8">
                                    <h2 className="mb-8 bg-clip-text text-center text-3xl font-bold text-transparent">
                                        Daily Itinerary
                                    </h2>

                                    <div className="mb-12 space-y-6">
                                        {tourPackageData.itineraries.map((day, index) => (
                                            <Card
                                                key={day.id}
                                                className="shadow-elegant bg-card/50 overflow-hidden border-0 backdrop-blur-sm"
                                            >
                                                <CardHeader className="border-primary/20 border-b">
                                                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center lg:gap-0">
                                                        <CardTitle className="text-primary text-xl">
                                                            {day.title}
                                                        </CardTitle>
                                                        {day.estimatedDrivingDistance && (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-primary/30 text-primary"
                                                            >
                                                                <Car className="mr-1 h-3 w-3" />
                                                                {day.estimatedDrivingDistance}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="pt-6">
                                                    <div className="grid gap-6">
                                                        {/* Activities */}
                                                        <div>
                                                            <h4 className="mb-3 flex items-center gap-2 font-semibold">
                                                                What you will do
                                                            </h4>
                                                            <p className="text-muted-foreground leading-relaxed">
                                                                {day.activities}
                                                            </p>
                                                        </div>

                                                        {/* Accommodation */}
                                                        {day.accommodation &&
                                                            day.accommodation !==
                                                                'Day trip - departure' && (
                                                                <div>
                                                                    <h4 className="mb-3 flex items-center gap-2 font-semibold">
                                                                        <Bed className="h-4 w-4" />
                                                                        Accommodation
                                                                    </h4>
                                                                    <MarkdownRenderer
                                                                        content={day.accommodation}
                                                                    />
                                                                </div>
                                                            )}

                                                        {day.accommodation ===
                                                            'Day trip - departure' && (
                                                            <div>
                                                                <h4 className="mb-3 flex items-center gap-2 font-semibold">
                                                                    <Bed className="h-4 w-4" />
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
                                                        <Separator className="via-primary/30 bg-gradient-to-r from-transparent to-transparent" />
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </section>

                                {/* Inclusions */}
                                <section id="inclusions" className="scroll-mt-8">
                                    <Card className="shadow-elegant bg-card/50 mb-12 border-0 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                <CheckCircle className="text-primary h-6 w-6" />
                                                Inclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {inclusions.map((inclusion, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                                                        <span className="text-muted-foreground">
                                                            {inclusion}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Exclusions */}
                                <section id="exclusions" className="scroll-mt-8">
                                    <Card className="shadow-elegant bg-card/50 mb-12 border-0 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                <XCircle className="text-primary h-6 w-6" />
                                                Exclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {exclusions.map((exclusion, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                                        <span className="text-muted-foreground">
                                                            {exclusion}
                                                        </span>
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
            <section className="from-primary/10 to-secondary/10 bg-gradient-to-r py-20">
                <div className="mx-auto max-w-4xl px-6 text-center">
                    <h2 className="mb-6 text-4xl font-bold">
                        What you’re looking for isn’t just out there, it’s waiting for you.
                    </h2>
                    <div className="justify-center">
                        <InquiryDialog>
                            <Button size="lg" className="bg-primary hover:bg-primary/90">
                                <Users className="mr-2 h-5 w-5" />
                                Speak with Our Experts
                            </Button>
                        </InquiryDialog>
                    </div>
                </div>
            </section>
        </>
    )
}
