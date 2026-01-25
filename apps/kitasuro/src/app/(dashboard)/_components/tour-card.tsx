'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Calendar, MapPin, Pencil, Eye } from 'lucide-react';
import Link from 'next/link';
import { capitalize } from '@/lib/utils';

interface TourCardProps {
  tour: {
    id: string;
    name: string;
    days: number;
    imageUrl: string;
    overview: string;
    country: string;
    pricing: string;
    tags: string[];
  };
}

export default function TourCard({ tour }: TourCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(Number(tour.pricing));

  return (
    <Card className="group border-stone-200 bg-white transition-all duration-300 hover:border-green-600/30 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={tour.imageUrl || '/placeholder.svg'}
            alt={tour.name}
            className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge className="bg-white/90 text-stone-900 font-semibold shadow-sm">
              {formattedPrice}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800 mb-2">
          {tour.name}
        </h3>

        <p className="text-stone-600 mb-4 line-clamp-2 text-sm">
          {tour.overview}
        </p>

        <div className="text-stone-500 mb-3 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{capitalize(tour.country)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{tour.days} days</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {(tour.tags || []).slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs text-stone-600 border-stone-300">
              {tag}
            </Badge>
          ))}
          {(tour.tags || []).length > 3 && (
            <Badge variant="outline" className="text-xs text-stone-600 border-stone-300">
              +{tour.tags.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          asChild
          variant="outline"
          className="flex-1 border-stone-300 text-stone-700 hover:bg-stone-50"
        >
          <Link href={`/tours/${tour.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </Link>
        </Button>
        <Button
          asChild
          className="flex-1 bg-green-700 hover:bg-green-800 text-white"
        >
          <Link href={`/tours/${tour.id}?edit=true`}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
