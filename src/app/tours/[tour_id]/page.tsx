import {getProgramaticTourById} from "@/lib/cms-service";
import {notFound} from "next/navigation";
import {Badge} from "@/components/ui/badge";
import {Bed, Calendar, Camera, Car, CheckCircle, Globe, MapPin, XCircle} from "lucide-react";
import {DesktopNavigation, MobileNavigation} from "@/app/to_book/[slug]/_components/PageNavigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {inclusions, exclusions} from "@/lib/constants";


interface Params {
    params: {
        tour_id: string;
    }
}

export default async function Page({params}: Params) {
    const {tour_id} = await params;
    const tour = await getProgramaticTourById(tour_id);

    if (!tour) {
        return notFound()
    }
    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
                {/* Hero Section */}
                <div className="relative h-[60vh] lg:h-[80vh] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                        style={{backgroundImage: `url(${tour.img_url})`}}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"/>
                    </div>

                    <div className="relative h-full flex items-end">
                        <div className="container mx-auto px-6 pb-12">
                            <div className="max-w-4xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge className="bg-white/20 text-white border-white/30 capitalize">
                                        {`From $${tour.pricing}`}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                        <Calendar className="h-3 w-3 mr-1"/>
                                        {tour.number_of_days} Days
                                    </Badge>
                                    <Badge variant="secondary"
                                           className="bg-white/20 text-white border-white/30 capitalize">
                                        <MapPin className="h-3 w-3 mr-1"/>
                                        {tour.country}
                                    </Badge>
                                </div>

                                <h1 className="text-3xl md:text-6xl font-bold text-white leading-tight">
                                    {tour.tourName}
                                </h1>

                                <p className="text-xl text-white/90 flex items-center gap-2">
                                    <Globe className="h-5 w-5"/>
                                    {/*{tourPackageData.destination}*/}
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
                                            <MarkdownRenderer content={tour.overview!}/>
                                        </CardContent>
                                    </Card>
                                </section>

                                {/* Daily Itinerary */}
                                <div className="grid gap-6">
                                    {tour.days.map((day, index) => (
                                        <Card key={index} className="overflow-hidden">
                                            <CardHeader className="">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Calendar className="w-5 h-5"/>
                                                    Day {day.dayNumber}: {day.dayTitle}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="pt-6">
                                                <p className="text-foreground mb-4 leading-relaxed">{day.overview}</p>

                                                {/* Accommodation */}
                                                {day.itineraryAccommodations.length != 0 && (
                                                    day.itineraryAccommodations.map((accommodation, index) => (
                                                        <div className="bg-muted rounded-lg p-4" key={accommodation.id}>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <MapPin className="w-4 h-4 text-primary"/>
                                                                <span
                                                                    className="font-semibold">{accommodation.accommodation.name}</span>
                                                            </div>

                                                            {/* Accommodation Images */}
                                                            {accommodation.accommodation.images.length > 0 && (
                                                                <div className="mt-3">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Camera className="w-4 h-4"/>
                                                                        <span className="text-sm">
                                                                            {accommodation.accommodation.images.length} accommodation images
                                                                        </span>
                                                                    </div>
                                                                    <div
                                                                        className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                        {accommodation.accommodation.images.slice(0, 4).map((img, imgIndex) => (
                                                                            <div key={img.id}
                                                                                 className="aspect-video bg-safari-sand rounded overflow-hidden">
                                                                                <img
                                                                                    src={img.imageUrl}
                                                                                    alt={`${accommodation.accommodation.name} - Image ${imgIndex + 1}`}
                                                                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"

                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                )}

                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

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
        </>
    )
}