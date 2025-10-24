import { getProgramaticTourBySlug } from '@/lib/cms-service'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera, CheckCircle, MapPin, XCircle } from 'lucide-react'
import {
    DesktopNavigation,
    MobileNavigation,
} from '@/app/to_book/[slug]/_components/PageNavigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { BASE_URL, exclusions, inclusions } from '@/lib/constants'
import { type Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema, ProductSchema } from '@/components/schema'
import { capitalize } from '@/lib/utils'

interface Params {
    params: {
        tour_slug: string
    }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { tour_slug } = await params
    const tour = await getProgramaticTourBySlug(tour_slug)

    if (!tour) {
        return {
            title: 'Tour not found | Makisala Safaris',
        }
    }

    return {
        title: tour.tourName,
        openGraph: {
            title: tour.tourName,
            description: tour.overview,
            images: [
                {
                    url: tour.img_url,
                    width: 1200,
                    height: 630,
                    alt: tour.tourName,
                },
            ],
        },
    }
}

export default async function Page({ params }: Params) {
    const { tour_slug } = await params
    const tour = await getProgramaticTourBySlug(tour_slug)

    if (!tour) {
        return notFound()
    }
    return (
        <>
            <Script
                type={'application/ld+json'}
                strategy={'lazyOnload'}
                id="schema"
            >
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: `${capitalize(tour.country)} Safaris`,
                                url: `${BASE_URL}`,
                            },
                            {
                                name: `${tour.tourName}`,
                                url: `${BASE_URL}/tours/${tour_slug}`,
                            },
                        ],
                    }),
                    ProductSchema({
                        name: tour.tourName,
                        imgUrl: tour.img_url,
                        description: tour.overview,
                        price: tour.pricing,
                        tour_slug: tour.slug!,
                    }),
                ])}
            </Script>
            <div className="from-background to-accent/20 min-h-screen bg-gradient-to-br">
                {/* Hero Section */}
                <div className="relative h-[60vh] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{ backgroundImage: `url(${tour.img_url})` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    </div>

                    <div className="relative flex h-full items-end">
                        <div className="container mx-auto px-6 pb-12">
                            <div className="max-w-4xl">
                                <div className="mb-4 flex items-center gap-2">
                                    <Badge className="border-white/30 bg-white/20 text-white capitalize">
                                        {`From $${tour.pricing}`}
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white"
                                    >
                                        <Calendar className="mr-1 h-3 w-3" />
                                        {tour.number_of_days} Days
                                    </Badge>
                                    <Badge
                                        variant="secondary"
                                        className="border-white/30 bg-white/20 text-white capitalize"
                                    >
                                        <MapPin className="mr-1 h-3 w-3" />
                                        {tour.country}
                                    </Badge>
                                </div>

                                <h1 className="text-3xl leading-tight font-bold text-white md:text-6xl">
                                    {tour.tourName}
                                </h1>
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
                                            <MarkdownRenderer
                                                content={tour.overview!}
                                            />
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Daily Itinerary */}
                                <div className="grid gap-6">
                                    {tour.days.map((day, index) => (
                                        <Card
                                            key={index}
                                            className="overflow-hidden"
                                        >
                                            <CardHeader className="">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="h-5 w-5" />
                                                    Day {day.dayNumber}:{' '}
                                                    {day.dayTitle}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <p className="text-foreground mb-4 leading-relaxed">
                                                    {day.overview}
                                                </p>

                                                {/* Accommodation */}
                                                {day.itineraryAccommodations
                                                    .length != 0 &&
                                                    day.itineraryAccommodations.map(
                                                        (accommodation) => (
                                                            <div
                                                                className="bg-muted rounded-lg p-4"
                                                                key={
                                                                    accommodation.id
                                                                }
                                                            >
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <MapPin className="text-primary h-4 w-4" />
                                                                    <span className="font-semibold">
                                                                        {
                                                                            accommodation
                                                                                .accommodation
                                                                                .name
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {/* Accommodation Images */}
                                                                {accommodation
                                                                    .accommodation
                                                                    .images
                                                                    .length >
                                                                    0 && (
                                                                    <div className="mt-3">
                                                                        <div className="mb-2 flex items-center gap-2">
                                                                            <Camera className="h-4 w-4" />
                                                                            <span className="text-sm">
                                                                                {
                                                                                    accommodation
                                                                                        .accommodation
                                                                                        .images
                                                                                        .length
                                                                                }{' '}
                                                                                accommodation
                                                                                images
                                                                            </span>
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                                            {accommodation.accommodation.images
                                                                                .slice(
                                                                                    0,
                                                                                    4,
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        img,
                                                                                        imgIndex,
                                                                                    ) => (
                                                                                        <div
                                                                                            key={
                                                                                                img.id
                                                                                            }
                                                                                            className="bg-safari-sand aspect-video overflow-hidden rounded"
                                                                                        >
                                                                                            <img
                                                                                                src={
                                                                                                    img.imageUrl
                                                                                                }
                                                                                                alt={`${accommodation.accommodation.name} - Image ${imgIndex + 1}`}
                                                                                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                                                            />
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ),
                                                    )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Inclusions */}
                                <section
                                    id="inclusions"
                                    className="scroll-mt-8"
                                >
                                    <Card className="shadow-elegant bg-card/50 mb-12 border-0 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                <CheckCircle className="text-primary h-6 w-6" />
                                                Inclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {inclusions.map(
                                                    (inclusion, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3"
                                                        >
                                                            <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                                                            <span className="text-muted-foreground">
                                                                {inclusion}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Exclusions */}
                                <section
                                    id="exclusions"
                                    className="scroll-mt-8"
                                >
                                    <Card className="shadow-elegant bg-card/50 mb-12 border-0 backdrop-blur-sm">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-2xl">
                                                <XCircle className="text-primary h-6 w-6" />
                                                Exclusions
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid gap-3">
                                                {exclusions.map(
                                                    (exclusion, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-3"
                                                        >
                                                            <XCircle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                                            <span className="text-muted-foreground">
                                                                {exclusion}
                                                            </span>
                                                        </div>
                                                    ),
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
