'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@repo/ui/card';
import { Button } from '@repo/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Globe, MoreHorizontal, Eye, Link as LinkIcon } from 'lucide-react';
import { toast } from '@repo/ui/use-toast';

interface AccommodationCardProps {
  accommodation: {
    id: string;
    name: string;
    url: string | null;
    imageUrl: string | null;
  };
}

export function AccommodationCard({ accommodation }: AccommodationCardProps) {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const copyLink = () => {
    const link = `${window.location.origin}/accomodations/${accommodation.id}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: `Link to ${accommodation.name} copied to clipboard`,
    });
  };

  const showImage = !imgError && accommodation.imageUrl;

  return (
    <Card className="group border-stone-200 bg-white transition-all duration-300 hover:border-green-600/30 hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg h-48 bg-stone-100">
          {showImage ? (
            <>
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-stone-100 via-stone-200 to-stone-100 bg-[length:200%_100%] animate-shimmer" />
              )}
              <Image
                src={accommodation.imageUrl!}
                alt={accommodation.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={`object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-stone-400">
              No image
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-bold text-stone-900 group-hover:text-green-800 truncate">
              {accommodation.name}
            </h3>
            {accommodation.url && (
              <a
                href={accommodation.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Globe className="h-3 w-3" />
                Website
              </a>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/accomodations/${accommodation.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyLink}>
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
