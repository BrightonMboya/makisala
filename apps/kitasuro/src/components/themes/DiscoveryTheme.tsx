'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import {
  Binoculars,
  Bird,
  Calendar,
  Camera,
  Car,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  Footprints,
  MapPin,
  Moon,
  Mountain,
  Plane,
  Star,
  Sun,
  Sunrise,
  Sunset,
  Tent,
  Trees,
  UtensilsCrossed,
  Waves,
  Wine,
  X,
} from 'lucide-react';
import Image from 'next/image';
import { Map, MapMarker, MapRoute, MarkerContent, MarkerTooltip } from '@repo/ui/map';
import type { ItineraryData } from '@/types/itinerary-types';
import { cn } from '@/lib/utils';
import { confirmProposal } from '@/app/itineraries/actions';

// ============================================================================
// CINEMATIC IMAGE GALLERY
// ============================================================================
function CinematicGallery({ images, alt }: { images: string[]; alt: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-advance only when not hovered
  useEffect(() => {
    if (images.length <= 1 || isHovered) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length, isHovered]);

  if (images.length === 0) return null;
  const currentImage = images[currentIndex] ?? images[0] ?? '';

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div
      className="group relative h-full w-full overflow-hidden bg-stone-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image src={currentImage} alt={alt} fill className="object-cover" />
        </motion.div>
      </AnimatePresence>

      {images.length > 1 && (
        <>
          {/* Prev/Next Buttons */}
          <button
            onClick={goToPrev}
            className="absolute top-1/2 left-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-4 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>

          {/* Progress indicators and counter */}
          <div className="absolute right-0 bottom-0 left-0 z-10 p-6">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      'h-0.5 rounded-full transition-all duration-500',
                      idx === currentIndex ? 'w-12 bg-white' : 'w-6 bg-white/40 hover:bg-white/60',
                    )}
                  />
                ))}
              </div>
              <span className="text-xs font-light tracking-wider text-white/60">
                {String(currentIndex + 1).padStart(2, '0')} /{' '}
                {String(images.length).padStart(2, '0')}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Elegant vignette */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
    </div>
  );
}

// ============================================================================
// ROUTE MAP
// ============================================================================
function JourneyMap({ data, className }: { data: ItineraryData['mapData']; className?: string }) {
  const { locations, startLocation, endLocation } = data;
  if (!locations || locations.length === 0) return null;

  const allLocations = useMemo(() => {
    const locs = [...locations];
    if (startLocation) locs.unshift(startLocation);
    if (endLocation) locs.push(endLocation);
    return locs;
  }, [locations, startLocation, endLocation]);

  const center = useMemo(() => {
    const lngs = allLocations.map((l) => l.coordinates[0]);
    const lats = allLocations.map((l) => l.coordinates[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ] as [number, number];
  }, [allLocations]);

  const routeCoordinates = useMemo(
    () => allLocations.map((l) => l.coordinates as [number, number]),
    [allLocations],
  );

  return (
    <div className={cn('relative h-full w-full', className)}>
      <Map
        center={center}
        zoom={6}
        minZoom={4}
        maxZoom={12}
        styles={{
          light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          dark: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        }}
      >
        {routeCoordinates.length > 1 && (
          <MapRoute
            coordinates={routeCoordinates}
            color="#1c1917"
            width={1.5}
            opacity={0.4}
            dashArray={[6, 4]}
          />
        )}
        {startLocation && (
          <MapMarker
            longitude={startLocation.coordinates[0]}
            latitude={startLocation.coordinates[1]}
          >
            <MarkerContent>
              <div className="h-3 w-3 rounded-full bg-stone-800 ring-4 ring-stone-800/20" />
            </MarkerContent>
          </MapMarker>
        )}
        {locations.map((loc, idx) => (
          <MapMarker
            key={`loc-${idx}`}
            longitude={loc.coordinates[0]}
            latitude={loc.coordinates[1]}
          >
            <MarkerContent>
              <div className="relative">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 bg-white text-xs font-semibold text-stone-800 shadow-lg">
                  {idx + 1}
                </div>
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <span className="text-sm font-medium text-stone-800">{loc.name}</span>
            </MarkerTooltip>
          </MapMarker>
        ))}
        {endLocation && (
          <MapMarker longitude={endLocation.coordinates[0]} latitude={endLocation.coordinates[1]}>
            <MarkerContent>
              <div className="h-3 w-3 rounded-full bg-stone-400 ring-4 ring-stone-400/20" />
            </MarkerContent>
          </MapMarker>
        )}
      </Map>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================
function getTimeOfDay(time: string): string {
  if (!time) return 'Morning';
  const moments = ['Morning', 'Afternoon', 'Evening', 'Half Day', 'Full Day', 'Night'];
  if (moments.includes(time)) return time;
  const hour = parseInt(time.split(':')[0] || '12', 10);
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function TimeIcon({ time, className }: { time: string; className?: string }) {
  const moment = getTimeOfDay(time);
  const props = { className: cn('w-4 h-4', className) };
  switch (moment) {
    case 'Morning':
      return <Sunrise {...props} />;
    case 'Afternoon':
      return <Sun {...props} />;
    case 'Evening':
      return <Sunset {...props} />;
    case 'Night':
      return <Moon {...props} />;
    default:
      return <Clock {...props} />;
  }
}

function getActivityIcon(activityName: string) {
  const name = activityName.toLowerCase();
  if (name.includes('game drive') || name.includes('safari')) return Binoculars;
  if (name.includes('transfer') || name.includes('drive') || name.includes('road')) return Car;
  if (name.includes('flight') || name.includes('fly') || name.includes('airport')) return Plane;
  if (name.includes('photo')) return Camera;
  if (name.includes('forest') || name.includes('tree')) return Trees;
  if (
    name.includes('trek') ||
    name.includes('hike') ||
    name.includes('walk') ||
    name.includes('gorilla') ||
    name.includes('chimpanzee')
  )
    return Footprints;
  if (name.includes('mountain') || name.includes('volcano')) return Mountain;
  if (name.includes('bird')) return Bird;
  if (
    name.includes('lake') ||
    name.includes('boat') ||
    name.includes('canoe') ||
    name.includes('water')
  )
    return Waves;
  if (name.includes('camp')) return Tent;
  return Compass;
}

// ============================================================================
// HERO SECTION - Cinematic full-screen opening
// ============================================================================
const HeroSection = ({
  data,
  onImageChange,
}: {
  data: ItineraryData;
  onImageChange?: () => void;
}) => {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
      {/* Parallax Background */}
      <motion.div className="absolute inset-0" style={{ y }}>
        <Image src={data.heroImage} alt="Hero" fill className="object-cover" priority />
      </motion.div>

      {/* Cinematic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Film grain texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      {onImageChange && (
        <button
          onClick={onImageChange}
          className="absolute top-8 right-8 z-40 rounded-full border border-white/10 bg-white/10 px-5 py-2.5 text-sm font-light tracking-wide text-white backdrop-blur-md transition-all hover:bg-white/20"
        >
          Change Cover
        </button>
      )}

      <motion.div
        className="relative z-10 flex h-full flex-col justify-end px-8 pb-24 lg:px-16 lg:pb-32 xl:px-24"
        style={{ opacity }}
      >
        <div className="max-w-5xl">
          {data.clientName && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 text-sm font-light tracking-[0.2em] text-white/70 uppercase"
            >
              A journey curated for {data.clientName}
            </motion.p>
          )}

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 font-serif text-5xl leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl xl:text-8xl"
          >
            {data.title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center gap-8 text-white/80"
          >
            <span className="flex items-center gap-3 text-base font-light">
              <Calendar className="h-5 w-5 opacity-60" />
              {data.duration}
            </span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="flex items-center gap-3 text-base font-light">
              <MapPin className="h-5 w-5 opacity-60" />
              {data.location}
            </span>
          </motion.div>

          {data.organization?.name && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 border-t border-white/10 pt-8"
            >
              <p className="text-sm font-light tracking-wide text-white/40">
                Presented by <span className="text-white/60">{data.organization.name}</span>
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-3"
      >
        <span className="text-xs font-light tracking-[0.3em] text-white/40 uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="h-5 w-5 text-white/40" />
        </motion.div>
      </motion.div>
    </section>
  );
};

// ============================================================================
// INTRODUCTION SECTION - Sets the scene
// ============================================================================
const IntroductionSection = ({ data }: { data: ItineraryData }) => {
  const overview = data.tripOverview;

  return (
    <section className="bg-[#faf9f7] py-24 lg:py-32">
      <div className="mx-auto max-w-4xl px-8 text-center lg:px-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
        >
          <p className="mb-8 text-xs font-light tracking-[0.3em] text-stone-400 uppercase">
            The Journey
          </p>
          <h2 className="mb-8 font-serif text-3xl leading-tight text-stone-800 lg:text-5xl">
            {data.subtitle || `${data.duration} through ${data.location}`}
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed font-light text-stone-500 lg:text-xl">
            {data.duration} of extraordinary moments through {data.location}
          </p>
        </motion.div>

        {/* Trip Overview Detail Strip */}
        {overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4"
          >
            {overview.tourType && (
              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                  Tour Type
                </span>
                <span className="mt-1 text-sm font-medium text-stone-700">{overview.tourType}</span>
              </div>
            )}
            {overview.tourType && (overview.country || overview.travelerCount) && (
              <div className="hidden h-8 w-px bg-stone-200 sm:block" />
            )}
            {overview.country && (
              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                  Country
                </span>
                <span className="mt-1 text-sm font-medium text-stone-700">{overview.country}</span>
              </div>
            )}
            {overview.country && (overview.travelerCount || overview.travelDates) && (
              <div className="hidden h-8 w-px bg-stone-200 sm:block" />
            )}
            {overview.travelerCount && (
              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                  Travelers
                </span>
                <span className="mt-1 text-sm font-medium text-stone-700">
                  {overview.travelerCount} {overview.travelerCount === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
            )}
            {overview.travelerCount && (overview.travelDates || overview.startCity) && (
              <div className="hidden h-8 w-px bg-stone-200 sm:block" />
            )}
            {overview.travelDates && (
              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                  Dates
                </span>
                <span className="mt-1 text-sm font-medium text-stone-700">
                  {overview.travelDates.start} — {overview.travelDates.end}
                </span>
              </div>
            )}
            {overview.travelDates && (overview.startCity || overview.endCity) && (
              <div className="hidden h-8 w-px bg-stone-200 sm:block" />
            )}
            {(overview.startCity || overview.endCity) && (
              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                  Route
                </span>
                <span className="mt-1 text-sm font-medium text-stone-700">
                  {overview.startCity}
                  {overview.startCity && overview.endCity && ' → '}
                  {overview.endCity}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
};

// ============================================================================
// JOURNEY OVERVIEW - Map and Timeline
// ============================================================================
const JourneyOverview = ({ data }: { data: ItineraryData }) => (
  <section className="bg-white">
    <div className="grid grid-cols-1 lg:grid-cols-2">
      {/* Map */}
      <div className="relative h-[50vh] lg:h-auto lg:min-h-[700px]">
        <JourneyMap data={data.mapData} />
        <div className="absolute top-8 left-8 max-w-xs rounded-2xl bg-white/95 p-6 shadow-xl backdrop-blur-sm">
          <p className="mb-2 text-xs font-light tracking-[0.2em] text-stone-400 uppercase">
            Your Route
          </p>
          <p className="font-serif text-lg text-stone-800">
            {data.mapData.locations?.length || 0} destinations
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-stone-50 p-10 lg:p-16 xl:p-20">
        <div className="max-w-md">
          <p className="mb-8 text-xs font-light tracking-[0.3em] text-stone-400 uppercase">
            Day by Day
          </p>

          <div className="space-y-0">
            {data.itinerary.map((day, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="relative"
              >
                {/* Timeline line */}
                {idx < data.itinerary.length - 1 && (
                  <div className="absolute top-12 bottom-0 left-[19px] w-px bg-stone-200" />
                )}

                <div className="flex gap-6 pb-8">
                  {/* Day number */}
                  <div className="relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-800 text-sm font-medium text-white">
                      {day.day}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1.5">
                    <p className="mb-1 text-xs tracking-wider text-stone-400 uppercase">
                      {day.date}
                    </p>
                    <h4 className="mb-1 font-serif text-lg text-stone-800">{day.title}</h4>
                    {day.destination && (
                      <p className="flex items-center gap-1.5 text-sm text-stone-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {day.destination}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ============================================================================
// PRICING SECTION - Elegant and clear
// ============================================================================
const PricingSection = ({ data, onConfirm }: { data: ItineraryData; onConfirm: () => void }) => (
  <section className="bg-stone-900 py-24 text-white lg:py-32">
    <div className="mx-auto max-w-6xl px-8 lg:px-16">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="mb-6 text-xs font-light tracking-[0.3em] text-stone-500 uppercase">
            Investment
          </p>
          <div className="mb-8">
            <span className="font-serif text-6xl text-white lg:text-7xl">{data.pricing.total}</span>
            <span className="ml-4 text-lg text-stone-500">
              {data.pricing.perPerson ? 'per person' : 'total'}
            </span>
          </div>
          <p className="max-w-md text-base leading-relaxed font-light text-stone-400">
            A comprehensive journey including accommodations, expert guides, and unforgettable
            experiences.
          </p>

          <div className="mt-12">
            <button
              onClick={onConfirm}
              className="group inline-flex items-center gap-3 bg-white px-8 py-4 text-sm font-medium tracking-wide text-stone-900 transition-colors hover:bg-stone-100"
            >
              Reserve This Journey
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>

        {/* Inclusions */}
        <div className="space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20">
                <Check className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium tracking-wide text-stone-300 uppercase">
                Included
              </h3>
            </div>
            <ul className="space-y-3">
              {data.includedItems.map((item, i) => (
                <li key={i} className="pl-11 text-base leading-relaxed font-light text-stone-400">
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {data.excludedItems && data.excludedItems.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-700">
                  <X className="h-4 w-4 text-stone-400" />
                </div>
                <h3 className="text-sm font-medium tracking-wide text-stone-500 uppercase">
                  Not Included
                </h3>
              </div>
              <ul className="space-y-3">
                {data.excludedItems.map((item, i) => (
                  <li key={i} className="pl-11 text-base leading-relaxed font-light text-stone-600">
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  </section>
);

// ============================================================================
// DAY SECTION - The heart of the itinerary
// ============================================================================
const DaySection = ({
  day,
  data,
  isEven,
}: {
  day: ItineraryData['itinerary'][0];
  data: ItineraryData;
  isEven: boolean;
}) => {
  const parkInfo =
    data.nationalParks && day.nationalParkId ? data.nationalParks[day.nationalParkId] : null;
  const accommodationDetails = data.accommodations.find((a) => a.name === day.accommodation);

  // Destination image - from park's featured image (Cloudinary via pages table)
  const destinationImage =
    parkInfo?.featured_image_url ||
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop';

  // Accommodation images - all images from the accommodation
  // Falls back to the single main image, then to a default placeholder
  const defaultAccommodationImage =
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop';
  const accommodationImages =
    accommodationDetails?.images && accommodationDetails.images.length > 0
      ? accommodationDetails.images
      : accommodationDetails?.image
        ? [accommodationDetails.image]
        : [defaultAccommodationImage];
  const accommodationOverview = accommodationDetails?.description || '';

  const hasActivities = day.activities.length > 0;
  const hasAccommodation = day.accommodation && day.accommodation !== 'Last day, no accommodation';
  const mealsArray = day.meals?.split(', ').filter((m) => m && m !== 'None') || [];

  return (
    <section className="relative">
      {/* Day Header - Full bleed image */}
      <div className="relative h-[60vh] overflow-hidden lg:h-[70vh]">
        <Image
          src={destinationImage}
          alt={day.destination || day.title}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />

        <div className="absolute right-0 bottom-0 left-0 p-8 lg:p-16">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="mb-4 flex items-end gap-6">
                <span className="-mb-2 font-serif text-8xl leading-none text-white/20 lg:text-9xl">
                  {String(day.day).padStart(2, '0')}
                </span>
                <div>
                  <p className="mb-2 text-sm tracking-wider text-white/60 uppercase">{day.date}</p>
                  {day.destination && (
                    <p className="flex items-center gap-2 text-base text-white/80">
                      <MapPin className="h-4 w-4" />
                      {day.destination}
                    </p>
                  )}
                </div>
              </div>
              <h2 className="max-w-3xl font-serif text-4xl leading-tight text-white lg:text-5xl xl:text-6xl">
                {day.title}
              </h2>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Day Narrative */}
      {day.description && (
        <div className="bg-white pt-16 pb-8 lg:pt-24 lg:pb-12">
          <div className="mx-auto max-w-4xl px-8 lg:px-16">
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-xl leading-relaxed text-stone-600 italic lg:text-2xl"
            >
              {day.description}
            </motion.p>
          </div>
        </div>
      )}

      {/* Activities */}
      {hasActivities && (
        <div className="bg-white py-16 lg:py-24">
          <div className="mx-auto max-w-5xl px-8 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <p className="mb-4 text-xs font-light tracking-[0.3em] text-stone-400 uppercase">
                Today's Experiences
              </p>
              <h3 className="font-serif text-3xl text-stone-800 lg:text-4xl">
                {day.activities.length} {day.activities.length === 1 ? 'Activity' : 'Activities'}{' '}
                Planned
              </h3>
            </motion.div>

            {/* Timeline layout */}
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute top-0 bottom-0 left-[11px] w-px bg-stone-200" />

              <div className="space-y-10">
                {day.activities.map((activity, idx) => {
                  const Icon = getActivityIcon(activity.activity);
                  const timeOfDay = getTimeOfDay(activity.time);

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative flex gap-8"
                    >
                      {/* Timeline dot */}
                      <div className="relative z-10 flex shrink-0 flex-col items-center">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-stone-200 bg-white transition-colors group-hover:border-stone-400">
                          <Icon className="h-3 w-3 text-stone-400 transition-colors group-hover:text-stone-600" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1 border-l-2 border-transparent pb-2 pl-0 transition-colors group-hover:border-stone-300">
                        {/* Time label */}
                        <div className="mb-2 flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-[0.15em] text-stone-400 uppercase">
                            <TimeIcon time={activity.time} className="h-3.5 w-3.5" />
                            {timeOfDay}
                          </span>
                          {activity.location && (
                            <>
                              <span className="h-0.5 w-0.5 rounded-full bg-stone-300" />
                              <span className="flex items-center gap-1 text-xs text-stone-400">
                                <MapPin className="h-3 w-3" />
                                {activity.location}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Activity name */}
                        <h4 className="mb-3 font-serif text-2xl text-stone-800">
                          {activity.activity}
                        </h4>

                        {/* Description */}
                        {activity.description && (
                          <p className="max-w-2xl text-base leading-relaxed font-light text-stone-500">
                            {activity.description}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer / Transportation */}
      {day.transportation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden bg-stone-800 text-white"
        >
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-stone-900/50 via-transparent to-stone-700/30" />

          <div className="relative mx-auto max-w-5xl px-8 py-16 lg:px-16 lg:py-20">
            {/* Transport icon */}
            <div className="mb-6">
              {day.transportation.mode.startsWith('flight') ? (
                <Plane className="h-8 w-8 text-white/60" />
              ) : (
                <Car className="h-8 w-8 text-white/60" />
              )}
            </div>

            <p className="mb-8 text-sm font-light tracking-[0.2em] text-white/50 uppercase">
              {day.transportation.mode.startsWith('flight')
                ? 'Flying to your next destination'
                : 'Travelling to your next destination'}
            </p>

            {/* Origin → Destination */}
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <span className="font-serif text-2xl text-white lg:text-3xl">
                {day.transportation.originName}
              </span>
              <div className="flex items-center gap-2 text-white/40">
                <div className="h-px w-8 bg-white/30" />
                <ChevronRight className="h-5 w-5" />
                <div className="h-px w-8 bg-white/30" />
              </div>
              <span className="font-serif text-2xl text-white lg:text-3xl">
                {day.transportation.destinationName}
              </span>
            </div>

            {/* Details row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/60">
              <span>{day.transportation.modeLabel}</span>
              {day.transportation.durationFormatted && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{day.transportation.durationFormatted}</span>
                </>
              )}
              {day.transportation.distanceKm && (
                <>
                  <span className="h-1 w-1 rounded-full bg-white/30" />
                  <span>{day.transportation.distanceKm} km</span>
                </>
              )}
            </div>

            {/* Optional notes */}
            {day.transportation.notes && (
              <p className="mt-6 max-w-2xl text-base leading-relaxed font-light text-white/50 italic">
                {day.transportation.notes}
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Accommodation */}
      {hasAccommodation && (
        <div className="border-t border-stone-100 bg-white">
          <div
            className={cn(
              'grid grid-cols-1 lg:grid-cols-2',
              isEven && 'lg:[&>*:first-child]:order-2',
            )}
          >
            {/* Image Gallery */}
            <div className="h-[400px] lg:h-[600px]">
              <CinematicGallery images={accommodationImages} alt={day.accommodation || ''} />
            </div>

            {/* Content */}
            <div className="flex flex-col justify-center bg-[#faf9f7] p-8 lg:p-16 xl:p-20">
              <div className="max-w-lg">
                <p className="mb-4 text-xs font-light tracking-[0.3em] text-stone-400 uppercase">
                  Your Accommodation
                </p>
                <h3 className="mb-3 font-serif text-3xl text-stone-800 lg:text-4xl">
                  {day.accommodation}
                </h3>

                {day.destination && (
                  <p className="mb-8 flex items-center gap-2 text-sm text-stone-500">
                    <MapPin className="h-4 w-4" />
                    {day.destination}
                  </p>
                )}

                {/* Overview */}
                {accommodationOverview && (
                  <div
                    className="prose prose-stone mb-10 max-w-none text-base leading-relaxed font-light text-stone-600 lg:text-lg"
                    dangerouslySetInnerHTML={{ __html: accommodationOverview }}
                  />
                )}

                {/* Details */}
                <div className="flex items-start gap-0">
                  <div className="pr-6">
                    <p className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                      Stay
                    </p>
                    <p className="mt-1 text-sm font-medium text-stone-800">1 Night</p>
                  </div>

                  {mealsArray.length > 0 && (
                    <>
                      <div className="mx-2 mt-1 h-8 w-px bg-stone-200" />
                      <div className="pl-6">
                        <p className="text-[10px] font-light tracking-[0.2em] text-stone-400 uppercase">
                          Meals
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          {mealsArray.map((meal, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-sm font-medium text-stone-700"
                            >
                              {meal === 'Breakfast' && (
                                <Coffee className="h-3.5 w-3.5 text-amber-600" />
                              )}
                              {meal === 'Lunch' && (
                                <UtensilsCrossed className="h-3.5 w-3.5 text-orange-600" />
                              )}
                              {meal === 'Dinner' && (
                                <Wine className="h-3.5 w-3.5 text-rose-600" />
                              )}
                              {meal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// ============================================================================
// FOOTER - Elegant closing
// ============================================================================
const Footer = ({ data, onConfirm }: { data: ItineraryData; onConfirm: () => void }) => (
  <footer className="bg-stone-950 text-white">
    {/* CTA Section */}
    <div className="border-b border-stone-800 px-8 py-24 text-center lg:px-16 lg:py-32">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl"
      >
        <p className="mb-8 text-xs font-light tracking-[0.3em] text-stone-500 uppercase">
          Begin Your Story
        </p>
        <h2 className="mb-8 font-serif text-4xl lg:text-5xl">Ready to embark?</h2>
        <p className="mb-12 text-lg leading-relaxed font-light text-stone-400">
          Every great journey begins with a single step. Let us guide you through an adventure that
          will stay with you forever.
        </p>
        <button
          onClick={onConfirm}
          className="group inline-flex items-center gap-3 bg-white px-10 py-5 text-base font-medium tracking-wide text-stone-900 transition-colors hover:bg-stone-100"
        >
          Start Planning
          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </div>

    {/* Brand Footer */}
    <div className="px-8 py-12 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-4">
          {data.organization?.logoUrl && (
            <Image
              src={data.organization.logoUrl}
              alt={data.organization.name || ''}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover opacity-70"
            />
          )}
          {data.organization?.name && (
            <p className="text-sm font-light text-stone-500">
              Crafted with care by {data.organization.name}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 text-stone-600">
          <Star className="h-4 w-4" />
          <span className="text-sm font-light">Extraordinary journeys, extraordinary memories</span>
        </div>
      </div>
    </div>
  </footer>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
interface DiscoveryThemeProps {
  data: ItineraryData;
  onHeroImageChange?: (url: string) => void;
}

export default function DiscoveryTheme({ data, onHeroImageChange }: DiscoveryThemeProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmName, setConfirmName] = useState(data.clientName || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmError, setConfirmError] = useState('');

  const handleHeroImageChange = () => {
    if (onHeroImageChange) {
      window.dispatchEvent(new CustomEvent('openHeroImagePicker'));
    }
  };

  const handleConfirmProposal = async () => {
    if (!confirmName.trim()) return;

    setIsConfirming(true);
    setConfirmError('');

    try {
      const result = await confirmProposal(data.id, confirmName.trim());

      if (result.success) {
        setConfirmStatus('success');
      } else {
        setConfirmStatus('error');
        setConfirmError(result.error || 'Failed to confirm proposal');
      }
    } catch {
      setConfirmStatus('error');
      setConfirmError('An unexpected error occurred');
    } finally {
      setIsConfirming(false);
    }
  };

  const openConfirmModal = () => setShowConfirmModal(true);

  return (
    <div className="w-full bg-white">
      <HeroSection
        data={data}
        onImageChange={onHeroImageChange ? handleHeroImageChange : undefined}
      />
      <IntroductionSection data={data} />
      <JourneyOverview data={data} />
      <PricingSection data={data} onConfirm={openConfirmModal} />

      {data.itinerary.map((day, index) => (
        <React.Fragment key={day.day}>
          {index > 0 && (
            <div className="flex items-center justify-center py-8 bg-white">
              <div className="h-px w-16 bg-stone-200" />
              <div className="mx-4 h-1.5 w-1.5 rounded-full bg-stone-300" />
              <div className="h-px w-16 bg-stone-200" />
            </div>
          )}
          <DaySection day={day} data={data} isEven={index % 2 === 1} />
        </React.Fragment>
      ))}

      <Footer data={data} onConfirm={openConfirmModal} />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => confirmStatus === 'idle' && setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"
            >
              {confirmStatus === 'success' ? (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Check className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mb-2 font-serif text-2xl text-stone-900">Proposal Confirmed!</h3>
                  <p className="mb-6 text-stone-600">
                    Thank you for confirming. The tour operator has been notified and will contact
                    you shortly to finalize your booking.
                  </p>
                  <button
                    onClick={() => {
                      setShowConfirmModal(false);
                      setConfirmStatus('idle');
                    }}
                    className="rounded-lg bg-stone-800 px-6 py-3 text-sm font-medium text-white hover:bg-stone-900"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="mb-2 font-serif text-2xl text-stone-900">Confirm Your Journey</h3>
                  <p className="mb-6 text-sm text-stone-600">
                    By confirming, you agree to proceed with this trip. The tour operator will be
                    notified and will contact you to finalize the details.
                  </p>

                  <div className="mb-6">
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-stone-500 uppercase">
                      Your Name
                    </label>
                    <input
                      type="text"
                      value={confirmName}
                      onChange={(e) => setConfirmName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:ring-2 focus:ring-stone-200 focus:outline-none"
                    />
                  </div>

                  {confirmStatus === 'error' && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                      {confirmError}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setConfirmStatus('idle');
                        setConfirmError('');
                      }}
                      disabled={isConfirming}
                      className="flex-1 rounded-lg border border-stone-200 px-6 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmProposal}
                      disabled={isConfirming || !confirmName.trim()}
                      className="flex-1 rounded-lg bg-green-700 px-6 py-3 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-50"
                    >
                      {isConfirming ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Confirming...
                        </span>
                      ) : (
                        'Confirm & Notify'
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
