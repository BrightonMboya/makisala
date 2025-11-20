import { Badge } from '@/components/ui/badge'
import { Calendar, MapPin } from 'lucide-react'

interface TourHeroProps {
    imageUrl: string
    title: string
    price: string
    days: number
    country: string
}

export default function TourHero({
    imageUrl,
    title,
    price,
    days,
    country,
}: TourHeroProps) {
    return (
        <div className="relative h-[80vh] w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative flex h-full items-end pb-16">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="max-w-4xl animate-fade-in-up">
                        <div className="mb-6 flex flex-wrap items-center gap-3">
                            <Badge className="bg-primary/90 hover:bg-primary border-none px-4 py-1.5 text-base font-medium text-white shadow-lg backdrop-blur-sm">
                                From ${price}
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-white/40 bg-black/20 px-4 py-1.5 text-base text-white backdrop-blur-md"
                            >
                                <Calendar className="mr-2 h-4 w-4" />
                                {days} Days
                            </Badge>
                            <Badge
                                variant="outline"
                                className="border-white/40 bg-black/20 px-4 py-1.5 text-base text-white capitalize backdrop-blur-md"
                            >
                                <MapPin className="mr-2 h-4 w-4" />
                                {country}
                            </Badge>
                        </div>

                        <h1 className="font-heading text-3xl font-bold leading-tight text-white drop-shadow-lg md:text-5xl lg:text-6xl">
                            {title}
                        </h1>
                    </div>
                </div>
            </div>
        </div>
    )
}
