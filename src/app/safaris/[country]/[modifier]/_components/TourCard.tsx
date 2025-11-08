import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'
import { capitalize } from '@/lib/utils'
import { type TourCard } from '@/lib/cms-service'

interface TourCardProps {
    tour: TourCard
}

export default function TourCard({ tour }: TourCardProps) {
    return (
        <Link href={`/tours/${tour.slug}`}>
            <Card className="group bg-card border-border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                <CardHeader className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                        <img
                            src={tour.img_url || '/placeholder.svg'}
                            alt={tour.tourName}
                            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 right-3">
                            <Badge
                                variant="secondary"
                                className="bg-secondary font-semibold"
                            >
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    minimumFractionDigits: 0,
                                }).format(Number(tour.pricing))}
                            </Badge>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4">
                    <h3 className="text-card-foreground mb-2 text-xl font-bold text-balance">
                        {tour.tourName}
                    </h3>

                    <p className="text-muted-foreground mb-4 line-clamp-2 text-sm text-pretty">
                        {tour.overview}
                    </p>

                    <div className="text-muted-foreground mb-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{capitalize(tour.country)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{tour.number_of_days} days</span>
                        </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1">
                        {tour.tags.slice(0, 3).map((tag) => (
                            <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs"
                            >
                                {tag}
                            </Badge>
                        ))}
                        {tour.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{tour.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground w-full">
                        View Details
                    </Button>
                </CardFooter>
            </Card>
        </Link>
    )
}
