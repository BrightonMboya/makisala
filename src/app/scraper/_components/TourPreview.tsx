import { TourData } from '@/app/scraper/_components/types'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Camera, DollarSign, MapPin, Star } from 'lucide-react'

interface TourPreviewProps {
    data: TourData
}

export const TourPreview = ({ data }: TourPreviewProps) => {
    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="bg-gradient-safari mb-2 bg-clip-text text-3xl font-bold text-transparent">
                    Tour Preview
                </h2>
                <p className="text-muted-foreground">
                    Preview your tour data before importing
                </p>
            </div>

            {/* Tour Overview */}
            <Card className="shadow-luxury">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <Star className="text-safari-gold h-6 w-6" />
                        {data.tourName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 text-lg">
                        <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />$
                            {data.pricing?.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {data.itinerary.length} days
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-foreground leading-relaxed">
                        {data.overview}
                    </p>
                </CardContent>
            </Card>

            {/* Top Features */}
            {/*<div className="grid grid-cols-1 md:grid-cols-2 gap-6">*/}
            {/*    {data.top_features.map((feature, index) => (*/}
            {/*        <Card key={index}*/}
            {/*              className="bg-gradient-to-br from-safari-sand to-background border-safari-bronze/20">*/}
            {/*            <CardHeader>*/}
            {/*                <CardTitle className="text-safari-earth">{feature.title}</CardTitle>*/}
            {/*            </CardHeader>*/}
            {/*            <CardContent>*/}
            {/*                <p className="text-sm text-muted-foreground">{feature.description}</p>*/}
            {/*            </CardContent>*/}
            {/*        </Card>*/}
            {/*    ))}*/}
            {/*</div>*/}

            {/* Activities */}
            <Card>
                <CardHeader>
                    <CardTitle>Included Activities</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {data.activities.map((activity, index) => (
                            <Badge
                                key={index}
                                variant="secondary"
                                className="bg-safari-sand text-safari-earth"
                            >
                                {activity.activity_name}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Itinerary */}
            <div className="space-y-4">
                <h3 className="mb-6 text-center text-2xl font-bold">
                    Daily Itinerary
                </h3>
                <div className="grid gap-6">
                    {data.itinerary.map((day, index) => (
                        <Card key={index} className="overflow-hidden">
                            <CardHeader className="">
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Day {day.day_number}:{' '}
                                    {day.itinerary_day_title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <p className="text-foreground mb-4 leading-relaxed">
                                    {day.overview}
                                </p>

                                {/* Accommodation */}
                                {day.accomodation.accomodation_name !==
                                    'No accommodation (End of tour)' && (
                                    <div className="bg-muted rounded-lg p-4">
                                        <div className="mb-2 flex items-center gap-2">
                                            <MapPin className="text-primary h-4 w-4" />
                                            <span className="font-semibold">
                                                {
                                                    day.accomodation
                                                        .accomodation_name
                                                }
                                            </span>
                                        </div>

                                        {/* Accommodation Images */}
                                        {day.accomodation.img_urls.length >
                                            0 && (
                                            <div className="mt-3">
                                                <div className="mb-2 flex items-center gap-2">
                                                    <Camera className="h-4 w-4" />
                                                    <span className="text-sm">
                                                        {
                                                            day.accomodation
                                                                .img_urls.length
                                                        }{' '}
                                                        accommodation images
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                    {day.accomodation.img_urls
                                                        .slice(0, 4)
                                                        .map(
                                                            (img, imgIndex) => (
                                                                <div
                                                                    key={
                                                                        imgIndex
                                                                    }
                                                                    className="bg-safari-sand aspect-video overflow-hidden rounded"
                                                                >
                                                                    <img
                                                                        src={
                                                                            img.image_url
                                                                        }
                                                                        alt={`${day.accomodation.accomodation_name} - Image ${imgIndex + 1}`}
                                                                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            e.currentTarget.style.display =
                                                                                'none'
                                                                        }}
                                                                    />
                                                                </div>
                                                            ),
                                                        )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
