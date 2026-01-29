'use client';

import { Badge } from '@repo/ui/badge';
import { Bed, MapPin, DollarSign, Sparkles, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Amenity {
  category: string;
  items: string[];
}

interface RoomType {
  name: string;
  description: string;
  capacity?: string;
}

interface ContentDisplayProps {
  enhancedDescription?: string | null;
  amenities?: Amenity[] | null;
  roomTypes?: RoomType[] | null;
  locationHighlights?: string[] | null;
  pricingInfo?: string | null;
}

export function ContentDisplay({
  enhancedDescription,
  amenities,
  roomTypes,
  locationHighlights,
  pricingInfo,
}: ContentDisplayProps) {
  const hasContent = enhancedDescription || amenities?.length || roomTypes?.length || locationHighlights?.length || pricingInfo;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center">
        <Sparkles className="mb-4 h-10 w-10 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900">No Content Yet</h3>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {/* Enhanced Description */}
      {enhancedDescription && (
        <section className="py-8 first:pt-0">
          <h2 className="mb-6 text-2xl font-serif text-3xl text-gray-900">Property Overview</h2>
          <div className="prose prose-lg prose-gray max-w-none text-gray-600">
            {enhancedDescription.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-6 leading-relaxed last:mb-0">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Room Types */}
      {roomTypes && roomTypes.length > 0 && (
        <section className="py-8">
          <h2 className="mb-6 text-2xl font-serif text-3xl text-gray-900">Accommodations</h2>
          <div className="grid gap-6">
            {roomTypes.map((room, idx) => (
              <div key={idx} className="group relative rounded-xl bg-gray-50 p-6 transition-colors hover:bg-gray-100/80">
                <div className="mb-2 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
                  {room.capacity && (
                    <Badge variant="secondary" className="bg-white shadow-sm">
                      {room.capacity}
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">{room.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fast Facts / Highlights */}
      {(locationHighlights?.length || amenities?.length) && (
        <section className="py-8">
          <h2 className="mb-6 text-2xl font-serif text-3xl text-gray-900">Fast Facts</h2>
          
          <div className="grid gap-8 md:grid-cols-2">
            {locationHighlights && locationHighlights.length > 0 && (
              <div>
                <div className="mb-4 flex items-center gap-2 text-gray-900">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold">Highlights</h3>
                </div>
                <ul className="space-y-3">
                  {locationHighlights.map((highlight, idx) => (
                    <li key={idx} className="text-gray-600">
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {amenities && amenities.length > 0 && (
              <div>
                 <div className="mb-4 flex items-center gap-2 text-gray-900">
                  <Check className="h-5 w-5 text-gray-400" />
                  <h3 className="font-semibold">Key Amenities</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {amenities.flatMap(cat => cat.items).slice(0, 8).map((item, idx) => (
                    <span key={idx} className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-600">
                      {item}
                    </span>
                  ))}
                  {amenities.flatMap(cat => cat.items).length > 8 && (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-500">
                      +{amenities.flatMap(cat => cat.items).length - 8} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pricing Info */}
      {pricingInfo && (
        <section className="py-8">
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <div className="mb-3 flex items-center gap-2 text-gray-300">
              <DollarSign className="h-5 w-5" />
              <h3 className="font-semibold uppercase tracking-wider text-xs">Pricing & Rates</h3>
            </div>
            <p className="text-lg leading-relaxed">{pricingInfo}</p>
          </div>
        </section>
      )}
    </div>
  );
}
