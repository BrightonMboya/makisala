import {Card, CardContent, CardFooter, CardHeader} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {Calendar, MapPin} from "lucide-react"

interface Tour {
    id: string
    tourName: string
    overview: string
    pricing: number
    country: string
    img_url: string
    number_of_days: number
    tags: string[]
}

interface TourCardProps {
    tour: Tour
}

export function TourCard({tour}: TourCardProps) {
    return (
        <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card border-border">
            <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                    <img
                        src={tour.img_url || "/placeholder.svg"}
                        alt={tour.tourName}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3">
                        <Badge variant="secondary" className="bg-secondary text-secondary-foreground font-semibold">
                            ${tour.pricing.toLocaleString()}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-4">
                <h3 className="text-xl font-bold text-card-foreground mb-2 text-balance">{tour.tourName}</h3>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 text-pretty">{tour.overview}</p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4"/>
                        <span>{tour.country}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4"/>
                        <span>{tour.number_of_days} days</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                    {tour.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
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
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">View Details</Button>
            </CardFooter>
        </Card>
    )
}
