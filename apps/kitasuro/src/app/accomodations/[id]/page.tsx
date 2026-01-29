import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Globe, MapPin } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { getPublicUrl } from '@/lib/storage';
import { getAccommodationWithContent } from '../actions';
import { ImageGallery } from '../_components/ImageGallery';
import { ContentDisplay } from '../_components/ContentDisplay';

export default async function AccommodationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) {
    notFound();
  }

  const acc = await getAccommodationWithContent(id);

  if (!acc) {
    notFound();
  }

  const images = acc.images.map((img) => ({
    id: img.id,
    url: getPublicUrl(img.bucket, img.key),
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="lg:grid lg:grid-cols-2">
        {/* Left Column: Sticky Image Gallery */}
        <div className="relative h-[50vh] w-full bg-gray-100 lg:sticky lg:top-0 lg:h-screen">
          <ImageGallery 
            images={images} 
            accommodationName={acc.name} 
            className="h-full w-full"
          />
          
          {/* Floating Back Button */}
          <Button 
            variant="secondary" 
            size="icon" 
            asChild 
            className="absolute left-4 top-4 z-20 h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow-sm"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
        </div>

        {/* Right Column: Scrollable Content */}
        <div className="flex flex-col p-6 lg:min-h-screen lg:p-12 xl:p-20">
          <div className="mb-8">

            <h1 className="mb-4 font-serif text-4xl text-gray-900 lg:text-5xl lg:leading-tight">
              {acc.name}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
              {acc.latitude && acc.longitude && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {acc.latitude}, {acc.longitude}
                </span>
              )}
              {acc.url && (
                <a
                  href={acc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-black hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  Visit Website
                </a>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-12">
             <ContentDisplay
              enhancedDescription={acc.enhancedDescription}
              amenities={acc.amenities as { category: string; items: string[] }[] | null}
              roomTypes={acc.roomTypes as { name: string; description: string; capacity?: string }[] | null}
              locationHighlights={acc.locationHighlights}
              pricingInfo={acc.pricingInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
