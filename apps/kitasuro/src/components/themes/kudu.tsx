'use client';

import React, { useMemo, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Car,
  CheckCircle2,
  ChevronRight,
  Home,
  MapPin,
  Plane,
  Star,
  Utensils,
  XCircle,
} from 'lucide-react';
import Image from 'next/image';
import { Map, MapMarker, MapRoute, MarkerContent, MarkerTooltip } from '@repo/ui/map';
import type { ItineraryData, NationalParkInfo } from '@/types/itinerary-types';

// --- TRIP MAP COMPONENT ---
function TripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { locations, startLocation, endLocation } = data;

  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-white/40">Map data not available</p>
      </div>
    );
  }

  // Build full route including start and end locations
  const allLocations = useMemo(() => {
    const locs = [...locations];
    if (startLocation) locs.unshift(startLocation);
    if (endLocation) locs.push(endLocation);
    return locs;
  }, [locations, startLocation, endLocation]);

  // Calculate center from all locations (including start/end)
  const center = useMemo(() => {
    const lngs = allLocations.map((l) => l.coordinates[0]);
    const lats = allLocations.map((l) => l.coordinates[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ] as [number, number];
  }, [allLocations]);

  // Extract coordinates for the route line (start → destinations → end)
  const routeCoordinates = useMemo(
    () => allLocations.map((l) => l.coordinates as [number, number]),
    [allLocations],
  );

  return (
    <Map
      center={center}
      zoom={7}
      minZoom={5}
      maxZoom={12}
      styles={{
        light: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      }}
    >
      {/* Route Line */}
      {routeCoordinates.length > 1 && (
        <MapRoute
          coordinates={routeCoordinates}
          color="#4ade80"
          width={2}
          opacity={0.9}
          dashArray={[4, 4]}
        />
      )}

      {/* Start Location Marker */}
      {startLocation && (
        <MapMarker longitude={startLocation.coordinates[0]} latitude={startLocation.coordinates[1]}>
          <MarkerContent>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-500 text-[8px] font-bold text-white shadow-md">
              GO
            </div>
          </MarkerContent>
          <MarkerTooltip>
            <span className="text-xs font-medium">Start: {startLocation.name}</span>
          </MarkerTooltip>
        </MapMarker>
      )}

      {/* Destination Markers */}
      {locations.map((loc, idx) => (
        <MapMarker key={loc.name} longitude={loc.coordinates[0]} latitude={loc.coordinates[1]}>
          <MarkerContent>
            <motion.div
              className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-green-400 text-[9px] font-bold text-neutral-900 shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 100,
                delay: idx * 0.3,
              }}
            >
              {idx + 1}
            </motion.div>
          </MarkerContent>
          <MarkerTooltip>
            <span className="text-xs font-medium">{loc.name}</span>
          </MarkerTooltip>
        </MapMarker>
      ))}

      {/* End Location Marker */}
      {endLocation && (
        <MapMarker longitude={endLocation.coordinates[0]} latitude={endLocation.coordinates[1]}>
          <MarkerContent>
            <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[8px] font-bold text-white shadow-md">
              END
            </div>
          </MarkerContent>
          <MarkerTooltip>
            <span className="text-xs font-medium">End: {endLocation.name}</span>
          </MarkerTooltip>
        </MapMarker>
      )}
    </Map>
  );
}

// --- FULL SCREEN SNAP SECTION ---
const NarrativeSection = ({
  children,
  imageUrl,
  imageRight = true,
  isPricing = false,
  onImageChange,
}: {
  children: React.ReactNode;
  imageUrl?: string;
  imageRight?: boolean;
  isPricing?: boolean;
  onImageChange?: () => void;
}) => {
  const containerRef = useRef(null);
  const [isImageHovered, setIsImageHovered] = React.useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Subtle parallax - just slight vertical movement, no aggressive scaling
  const y = useTransform(scrollYProgress, [0, 1], ['-3%', '3%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.06]);

  return (
    <section
      ref={containerRef}
      className="relative flex h-screen w-full snap-start snap-always flex-col overflow-hidden border-b border-black/5 bg-[#F4F4F1] lg:flex-row"
    >
      {isPricing ? (
        <div className="flex h-full w-full items-center justify-center bg-[#141A13] p-8 text-white md:p-24">
          {children}
        </div>
      ) : (
        <>
          <div
            className={`z-20 flex h-full w-full flex-col justify-center px-8 md:px-16 lg:w-1/2 lg:px-24 ${imageRight ? 'order-1' : 'order-2'}`}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.5 }}
              transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
            >
              {children}
            </motion.div>
          </div>

          <div
            className={`relative h-full w-full overflow-hidden lg:w-1/2 ${imageRight ? 'order-2' : 'order-1'}`}
            onMouseEnter={() => onImageChange && setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            {/* Image container with subtle parallax */}
            <motion.div style={{ y, scale }} className="absolute inset-0 -top-[4%] h-[108%] w-full">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Background Visual"
                  fill
                  className="object-cover object-center"
                  sizes="50vw"
                />
              ) : (
                <div className="h-full w-full bg-stone-200" />
              )}
            </motion.div>

            {/* Subtle gradient overlay for depth */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10" />

            {/* Edit overlay */}
            {onImageChange && (
              <div
                className={`absolute inset-0 z-30 flex cursor-pointer items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
                  isImageHovered ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onImageChange}
              >
                <div className="flex flex-col items-center gap-3 text-white">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-xs font-medium tracking-widest uppercase">
                    Change Image
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

interface KuduThemeProps {
  data: ItineraryData;
  onHeroImageChange?: (url: string) => void;
  onDayImageChange?: (dayNumber: number, url: string) => void;
}

export default function KuduTheme({ data, onHeroImageChange, onDayImageChange }: KuduThemeProps) {
  const {
    title,
    subtitle,
    location,
    heroImage,
    itinerary,
    pricing,
    includedItems,
    excludedItems,
    accommodations,
    nationalParks,
    importantNotes,
    mapData,
    clientName,
    organization,
    tripOverview,
  } = data;

  return (
    <div className="h-screen snap-y snap-mandatory overflow-y-scroll scroll-smooth bg-[#F4F4F1] selection:bg-emerald-800 selection:text-white">
      {/* 1. INTRODUCTION: HERO */}
      <NarrativeSection
        imageUrl={heroImage}
        onImageChange={
          onHeroImageChange
            ? () => {
                const event = new CustomEvent('openHeroImagePicker');
                window.dispatchEvent(event);
              }
            : undefined
        }
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="h-[1px] w-12 bg-emerald-800"></span>
          <span className="text-xs font-bold tracking-[0.4em] text-emerald-800 uppercase">
            {location}
          </span>
        </div>
        {clientName && (
          <p className="mb-4 text-xs tracking-[0.3em] text-emerald-700 uppercase">
            Prepared for {clientName}
          </p>
        )}
        <h1 className="mb-8 font-serif text-6xl leading-tight font-black text-slate-900 md:text-7xl">
          {title}
        </h1>
        <div className="prose prose-lg border-l-2 border-emerald-800/30 py-2 pl-8 text-slate-700">
          {subtitle && <p className="mb-6 font-serif text-xl italic">"{subtitle}"</p>}
          <p className="text-sm font-bold tracking-widest uppercase opacity-60">
            {data.duration} Expedition
          </p>
          {organization?.name && (
            <p className="mt-4 text-xs tracking-widest uppercase opacity-40">
              by {organization.name}
            </p>
          )}
        </div>

        {/* Trip Overview Strip */}
        {tripOverview && (
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            {tripOverview.tourType && (
              <>
                <span>{tripOverview.tourType}</span>
                <span className="h-1 w-1 rounded-full bg-emerald-800/40" />
              </>
            )}
            {tripOverview.travelerCount && tripOverview.travelerCount > 0 && (
              <>
                <span>
                  {tripOverview.travelerCount}{' '}
                  {tripOverview.travelerCount === 1 ? 'Traveler' : 'Travelers'}
                </span>
                <span className="h-1 w-1 rounded-full bg-emerald-800/40" />
              </>
            )}
            {tripOverview.travelDates && (
              <>
                <span>
                  {tripOverview.travelDates.start.split(',')[0]} —{' '}
                  {tripOverview.travelDates.end.split(',')[0]}
                </span>
                <span className="h-1 w-1 rounded-full bg-emerald-800/40" />
              </>
            )}
            {(tripOverview.startCity || tripOverview.endCity) && (
              <span>
                {tripOverview.startCity === tripOverview.endCity
                  ? tripOverview.startCity
                  : `${tripOverview.startCity || '—'} → ${tripOverview.endCity || '—'}`}
              </span>
            )}
          </div>
        )}
      </NarrativeSection>

      {/* 3. DAILY ITINERARY LOOP */}
      {itinerary.map((day, index) => {
        // Get national park info if available
        const parkInfo: NationalParkInfo | null =
          nationalParks && day.nationalParkId ? (nationalParks[day.nationalParkId] ?? null) : null;

        // Get accommodation details
        const accommodationDetails = accommodations.find((a) => a.name === day.accommodation);

        // Check previous day for redundant info
        const previousDay = index > 0 ? itinerary[index - 1] : null;
        const isSameAccommodation = previousDay?.accommodation === day.accommodation;
        const previousParkId = previousDay?.nationalParkId;
        const shouldShowParkInfo = parkInfo !== null && day.nationalParkId !== previousParkId;

        // Determine the best image for this day section
        // Priority: Custom preview image > Park image > Accommodation image > Hero fallback
        const dayImage =
          day.previewImage ||
          (shouldShowParkInfo && parkInfo?.featured_image_url
            ? parkInfo.featured_image_url
            : null) ||
          accommodationDetails?.image ||
          heroImage;

        // Alternating layout
        const isRight = index % 2 === 0;

        return (
          <NarrativeSection
            key={day.day}
            imageUrl={dayImage}
            imageRight={!isRight}
            onImageChange={
              onDayImageChange
                ? () => {
                    const event = new CustomEvent('openDayImagePicker', {
                      detail: { dayNumber: day.day },
                    });
                    window.dispatchEvent(event);
                  }
                : undefined
            }
          >
            <div className="mb-4 text-xs font-bold tracking-[0.4em] text-emerald-800 uppercase">
              Day {String(day.day).padStart(2, '0')} — {day.date}
            </div>
            <h2 className="mb-4 font-serif text-4xl font-bold text-slate-900 md:text-5xl">
              {day.title}
            </h2>

            {/* National Park Badge */}
            {shouldShowParkInfo && parkInfo && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-800/10 px-3 py-1.5 text-emerald-800">
                <MapPin size={12} />
                <span className="text-[10px] font-bold tracking-widest uppercase">
                  {parkInfo.name}
                </span>
              </div>
            )}

            {day.description && (
              <p className="mb-6 text-base leading-relaxed text-slate-600">{day.description}</p>
            )}

            {/* Activities with timeline */}
            <div className="mb-6 max-h-[40vh] overflow-y-auto pr-2">
              <div className="border-l border-emerald-800/20 pl-6">
                {day.activities.map((act, actIdx) => (
                  <div key={actIdx} className="relative py-3">
                    {/* Timeline dot */}
                    <div className="absolute -left-[27px] top-4 h-2 w-2 rounded-full bg-emerald-800" />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold tracking-wider uppercase">
                          {act.activity}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase">{act.time}</span>
                      </div>
                      {act.description && (
                        <p className="text-sm leading-relaxed text-slate-500">{act.description}</p>
                      )}
                      {act.location && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 uppercase">
                          <MapPin size={10} /> {act.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transfer / Transportation */}
            {day.transportation && (
              <div className="mb-4 rounded-sm bg-emerald-800/10 px-4 py-3">
                <div className="mb-1 flex items-center gap-2">
                  {day.transportation.mode.startsWith('flight') ? (
                    <Plane size={14} className="shrink-0 text-emerald-800" />
                  ) : (
                    <Car size={14} className="shrink-0 text-emerald-800" />
                  )}
                  <span className="text-sm font-bold tracking-wider text-emerald-800 uppercase">
                    {day.transportation.originName}
                  </span>
                  <ChevronRight size={12} className="shrink-0 text-emerald-800/50" />
                  <span className="text-sm font-bold tracking-wider text-emerald-800 uppercase">
                    {day.transportation.destinationName}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] tracking-wider text-emerald-800/70 uppercase">
                  <span>{day.transportation.modeLabel}</span>
                  {day.transportation.durationFormatted && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-emerald-800/40" />
                      <span>{day.transportation.durationFormatted}</span>
                    </>
                  )}
                  {day.transportation.distanceKm && (
                    <>
                      <span className="h-0.5 w-0.5 rounded-full bg-emerald-800/40" />
                      <span>{day.transportation.distanceKm} km</span>
                    </>
                  )}
                </div>
                {day.transportation.notes && (
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800/60 italic">
                    {day.transportation.notes}
                  </p>
                )}
              </div>
            )}

            {/* Footer: Accommodation & Meals */}
            <div className="space-y-3 border-t border-black/10 pt-4">
              <div className={`flex items-start gap-6 ${isSameAccommodation ? 'opacity-40' : ''}`}>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold tracking-[0.3em] text-emerald-800/60 uppercase">
                    Stay
                  </span>
                  <div className="flex items-center gap-2">
                    <Home size={13} className="text-emerald-800" />
                    <span className="text-xs font-medium tracking-widest text-slate-700 uppercase">
                      {day.accommodation}
                    </span>
                  </div>
                </div>
                {day.meals && (
                  <>
                    <div className="mt-2 h-8 w-px bg-black/10" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-bold tracking-[0.3em] text-emerald-800/60 uppercase">
                        Meals
                      </span>
                      <div className="flex items-center gap-2">
                        <Utensils size={13} className="text-emerald-800" />
                        <span className="text-xs text-slate-500 italic">{day.meals}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Accommodation Description */}
              {!isSameAccommodation && accommodationDetails?.description && (
                <p className="pl-5 text-xs leading-relaxed text-slate-500">
                  {accommodationDetails.description}
                </p>
              )}
            </div>
          </NarrativeSection>
        );
      })}

      {/* 4. PRICING SECTION */}
      <NarrativeSection isPricing>
        <div className="grid w-full max-w-6xl items-start gap-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 flex gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill="currentColor" />
              ))}
            </div>
            <h2 className="mb-8 font-serif text-5xl font-black tracking-tighter">The Investment</h2>

            {/* Inclusions */}
            <div className="mb-8">
              <h3 className="mb-4 text-[10px] font-bold tracking-[0.3em] text-emerald-500 uppercase">
                Inclusions
              </h3>
              <div className="max-h-[35vh] space-y-3 overflow-y-auto pr-2 text-white/70">
                {includedItems &&
                  includedItems.map((inc, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-2">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-xs tracking-wider uppercase">{inc}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Exclusions */}
            {excludedItems && excludedItems.length > 0 && (
              <div>
                <h3 className="mb-4 text-[10px] font-bold tracking-[0.3em] text-white/40 uppercase">
                  Exclusions
                </h3>
                <div className="max-h-[20vh] space-y-3 overflow-y-auto pr-2 text-white/50">
                  {excludedItems.map((exc, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-2">
                      <XCircle size={14} className="mt-0.5 shrink-0 text-white/30" />
                      <span className="text-xs tracking-wider uppercase">{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-sm border border-white/10 bg-white/5 p-10 backdrop-blur-lg">
            {clientName && (
              <p className="mb-2 text-[10px] tracking-[0.3em] text-white/40 uppercase">
                Prepared for
              </p>
            )}
            {clientName && <p className="mb-6 font-serif text-lg text-white">{clientName}</p>}
            <p className="mb-8 text-[10px] font-bold tracking-[0.4em] text-emerald-500 uppercase">
              Confidential Proposal
            </p>
            <div className="mb-6 flex items-end justify-between border-b border-white/20 pb-6">
              <div>
                <p className="font-serif text-4xl font-bold md:text-5xl">{pricing.total}</p>
                {pricing.perPerson && (
                  <p className="mt-1 text-[10px] tracking-widest uppercase opacity-60">
                    {pricing.perPerson} per person
                  </p>
                )}
              </div>
            </div>

            {/* Map Preview */}
            {mapData && mapData.locations && mapData.locations.length > 0 && (
              <div className="mb-6 h-40 overflow-hidden rounded">
                <TripMap data={mapData} />
              </div>
            )}

            <button className="flex w-full items-center justify-center gap-3 bg-emerald-700 py-5 text-xs font-bold tracking-widest text-white uppercase transition-all duration-500 hover:bg-emerald-600">
              Confirm Proposal <ArrowRight size={16} />
            </button>
            {organization?.name && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {organization.logoUrl && (
                  <Image
                    src={organization.logoUrl}
                    alt={organization.name}
                    width={24}
                    height={24}
                    className="rounded-full object-cover"
                  />
                )}
                <span className="text-[10px] text-white/30">by {organization.name}</span>
              </div>
            )}
          </div>
        </div>
      </NarrativeSection>

      {/* 5. IMPORTANT NOTES SECTION */}
      {importantNotes &&
        (importantNotes.description ||
          (importantNotes.points && importantNotes.points.length > 0)) && (
          <NarrativeSection imageUrl={heroImage} imageRight={false}>
            <h2 className="mb-6 font-serif text-4xl font-bold text-slate-900">Important Notes</h2>
            {importantNotes.description && (
              <p className="mb-8 font-serif text-lg leading-relaxed text-slate-600 italic">
                {importantNotes.description}
              </p>
            )}
            {importantNotes.points && importantNotes.points.length > 0 && (
              <div className="max-h-[50vh] space-y-4 overflow-y-auto pr-2">
                {importantNotes.points.map((point, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 border-b border-black/5 py-3 last:border-0"
                  >
                    <span className="text-lg font-bold text-emerald-800">•</span>
                    <p className="text-sm leading-relaxed text-slate-600">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </NarrativeSection>
        )}

      {/* FLOATING PAGE TRACKER */}
      <div className="fixed top-1/2 right-8 z-50 hidden -translate-y-1/2 flex-col gap-6 lg:flex">
        {[...Array(itinerary.length + (importantNotes ? 4 : 3))].map((_, i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-black/20" />
        ))}
      </div>
    </div>
  );
}
