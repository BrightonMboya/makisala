import {Card, CardContent} from '@/components/ui/card';
import type {TourData} from "@/app/scraper/_components/types";
import Link from "next/link";

interface TourDataProps {
    tour: TourData;
}

export const TourCard = ({tour}: TourDataProps) => {

    return (
        <Link href={`/tours/${tour.id}`}>
            <Card className="overflow-hidden group hover:shadow-xl cursor-pointer transition-all duration-300">
                <div className="relative">
                    <div className="relative h-48 overflow-hidden">
                        <img
                            src={tour.img_url}
                            alt={tour.tourName}
                            className="w-full h-full object-cover"
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"/>
                    </div>
                    <CardContent className="p-4">
                        <h3 className="text-xl font-bold leading-tight line-clamp-2">
                            {tour.tourName}
                        </h3>
                        <div className="mb-3 pt-2">
                        <span className="text-lg font-semibold text-primary mt-3">
                            {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 0,
                            }).format(tour.pricing)}
                       </span>
                            <span className="text-muted-foreground ml-1">pp (USD)</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {tour.overview}
                        </p>
                    </CardContent>
                </div>
            </Card>
        </Link>
    );
};