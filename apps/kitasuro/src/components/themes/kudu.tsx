'use client'

import React, { useRef, useMemo } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  CheckCircle2, ArrowRight, Star,
  Trees, Mountain, XCircle, MapPin, Utensils, Home
} from 'lucide-react';
import Image from 'next/image';
import {
  Map,
  MapRoute,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
} from '@repo/ui/map';
import type { ItineraryData, NationalParkInfo } from '@/types/itinerary-types';

// --- TRIP MAP COMPONENT ---
function TripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { locations } = data;

  if (!locations || locations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-white/40">Map data not available</p>
      </div>
    );
  }

  // Calculate center from all locations
  const center = useMemo(() => {
    const lngs = locations.map((l) => l.coordinates[0]);
    const lats = locations.map((l) => l.coordinates[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ] as [number, number];
  }, [locations]);

  // Extract coordinates for the route line
  const routeCoordinates = useMemo(
    () => locations.map((l) => l.coordinates as [number, number]),
    [locations]
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

      {/* Markers */}
      {locations.map((loc, idx) => (
        <MapMarker
          key={loc.name}
          longitude={loc.coordinates[0]}
          latitude={loc.coordinates[1]}
        >
          <MarkerContent>
            <motion.div
              className="flex h-4 w-4 items-center justify-center rounded-full bg-green-400 shadow-md"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 100,
                delay: idx * 0.3,
              }}
            />
          </MarkerContent>
          <MarkerTooltip>
            <span className="text-xs font-medium">{loc.name}</span>
          </MarkerTooltip>
        </MapMarker>
      ))}
    </Map>
  );
}

// --- FULL SCREEN SNAP SECTION ---
const NarrativeSection = ({
  children,
  imageUrl,
  imageRight = true,
  isPricing = false,
  onImageChange
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
    offset: ["start end", "end start"]
  });

  // Subtle parallax - just slight vertical movement, no aggressive scaling
  const y = useTransform(scrollYProgress, [0, 1], ["-3%", "3%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.02, 1.06]);

  return (
    <section
      ref={containerRef}
      className="relative h-screen w-full snap-start snap-always flex flex-col lg:flex-row overflow-hidden bg-[#F4F4F1] border-b border-black/5"
    >
      {isPricing ? (
        <div className="w-full h-full flex items-center justify-center p-8 md:p-24 bg-[#141A13] text-white">
          {children}
        </div>
      ) : (
        <>
          <div className={`w-full lg:w-1/2 h-full flex flex-col justify-center px-8 md:px-16 lg:px-24 z-20 ${imageRight ? 'order-1' : 'order-2'}`}>
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
            className={`w-full lg:w-1/2 h-full relative overflow-hidden ${imageRight ? 'order-2' : 'order-1'}`}
            onMouseEnter={() => onImageChange && setIsImageHovered(true)}
            onMouseLeave={() => setIsImageHovered(false)}
          >
            {/* Image container with subtle parallax */}
            <motion.div
              style={{ y, scale }}
              className="absolute inset-0 w-full h-[108%] -top-[4%]"
            >
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Background Visual"
                  fill
                  className="object-cover object-center"
                  sizes="50vw"
                />
              ) : (
                 <div className="w-full h-full bg-stone-200" />
              )}
            </motion.div>

            {/* Subtle gradient overlay for depth */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 pointer-events-none" />

            {/* Edit overlay */}
            {onImageChange && (
              <div
                className={`absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 cursor-pointer ${
                  isImageHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onImageChange}
              >
                <div className="flex flex-col items-center gap-3 text-white">
                  <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-widest">Change Image</span>
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
    organization
  } = data;

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#F4F4F1] selection:bg-emerald-800 selection:text-white">
      
      {/* 1. INTRODUCTION: HERO */}
      <NarrativeSection
        imageUrl={heroImage}
        onImageChange={onHeroImageChange ? () => {
          const event = new CustomEvent('openHeroImagePicker');
          window.dispatchEvent(event);
        } : undefined}
      >
        <div className="mb-6 flex items-center gap-4">
          <span className="h-[1px] w-12 bg-emerald-800"></span>
          <span className="text-xs font-bold uppercase tracking-[0.4em] text-emerald-800">{location}</span>
        </div>
        {clientName && (
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 mb-4">
            Prepared for {clientName}
          </p>
        )}
        <h1 className="text-6xl md:text-7xl font-serif font-black leading-tight mb-8 text-slate-900">
          {title}
        </h1>
        <div className="prose prose-lg text-slate-700 border-l-2 border-emerald-800/30 pl-8 py-2">
          {subtitle && (
            <p className="text-xl font-serif italic mb-6">"{subtitle}"</p>
          )}
          <p className="text-sm uppercase tracking-widest font-bold opacity-60">{data.duration} Expedition</p>
          {organization?.name && (
            <p className="text-xs uppercase tracking-widest opacity-40 mt-4">by {organization.name}</p>
          )}
        </div>
      </NarrativeSection>

      {/* 2. SUMMARY: THE EXPEDITION */}
      <NarrativeSection imageUrl={itinerary[0]?.accommodation ? accommodations.find(a => a.name === itinerary[0]?.accommodation)?.image : heroImage} imageRight={false}>
        <h2 className="text-5xl font-serif font-bold mb-8 text-slate-900">The Expedition</h2>
        <p className="text-lg text-slate-600 leading-relaxed mb-10 font-serif italic">
            This journey takes you through the heart of {location}.
            {itinerary.length} days of adventure, culture, and unforgettable moments.
        </p>
        <div className="grid grid-cols-2 gap-8">
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-800"><Mountain size={16}/> <span className="text-[10px] font-bold uppercase tracking-widest">Duration</span></div>
              <p className="text-xl font-serif">{data.duration}</p>
           </div>
           <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-800"><Home size={16}/> <span className="text-[10px] font-bold uppercase tracking-widest">Accommodations</span></div>
              <p className="text-xl font-serif">{accommodations.length} Unique Stays</p>
           </div>
        </div>
      </NarrativeSection>

      {/* 3. DAILY ITINERARY LOOP */}
      {itinerary.map((day, index) => {
        // Get national park info if available
        const parkInfo: NationalParkInfo | null =
          nationalParks && day.nationalParkId
            ? (nationalParks[day.nationalParkId] ?? null)
            : null;

        // Get accommodation details
        const accommodationDetails = accommodations.find(a => a.name === day.accommodation);

        // Check previous day for redundant info
        const previousDay = index > 0 ? itinerary[index - 1] : null;
        const isSameAccommodation = previousDay?.accommodation === day.accommodation;
        const previousParkId = previousDay?.nationalParkId;
        const shouldShowParkInfo = parkInfo !== null && day.nationalParkId !== previousParkId;

        // Determine the best image for this day section
        // Priority: Custom preview image > Park image > Accommodation image > Hero fallback
        const dayImage = day.previewImage
          || (shouldShowParkInfo && parkInfo?.featured_image_url ? parkInfo.featured_image_url : null)
          || accommodationDetails?.image
          || heroImage;

        // Alternating layout
        const isRight = index % 2 === 0;

        return (
          <NarrativeSection
            key={day.day}
            imageUrl={dayImage}
            imageRight={!isRight}
            onImageChange={onDayImageChange ? () => {
              const event = new CustomEvent('openDayImagePicker', { detail: { dayNumber: day.day } });
              window.dispatchEvent(event);
            } : undefined}
          >
             <div className="text-emerald-800 font-bold text-xs uppercase tracking-[0.4em] mb-4">Day {String(day.day).padStart(2, '0')} — {day.date}</div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-slate-900">{day.title}</h2>

            {/* National Park Badge */}
            {shouldShowParkInfo && parkInfo && (
              <div className="mb-4 inline-flex items-center gap-2 bg-emerald-800/10 text-emerald-800 px-3 py-1.5 rounded-full">
                <MapPin size={12} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{parkInfo.name}</span>
              </div>
            )}

            {day.description && (
                <p className="text-base text-slate-600 leading-relaxed mb-6">
                {day.description}
                </p>
            )}

            {/* Activities with descriptions */}
            <div className="flex flex-col gap-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                {day.activities.map((act, actIdx) => (
                    <div key={actIdx} className="flex items-start gap-4 py-3 border-b border-black/5 last:border-0">
                        <Trees className="text-emerald-800 shrink-0 mt-1" size={18} />
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-bold uppercase tracking-wider">{act.activity}</span>
                              <span className="text-[10px] text-slate-400 uppercase">{act.time}</span>
                            </div>
                            {act.description && (
                              <p className="text-sm text-slate-500 leading-relaxed">{act.description}</p>
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

            {/* Footer: Accommodation & Meals */}
            <div className="pt-4 border-t border-black/10 space-y-3">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  <Home size={14} className="text-emerald-800" />
                  <span className={`text-xs uppercase tracking-widest ${isSameAccommodation ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                    {day.accommodation}
                    {isSameAccommodation && <span className="ml-1 text-slate-300">(Cont.)</span>}
                  </span>
                </div>
                {day.meals && (
                  <div className="flex items-center gap-2">
                    <Utensils size={14} className="text-emerald-800" />
                    <span className="text-xs text-slate-500 italic">{day.meals}</span>
                  </div>
                )}
              </div>
              {/* Accommodation Description */}
              {!isSameAccommodation && accommodationDetails?.description && (
                <p className="text-xs text-slate-500 leading-relaxed pl-6">
                  {accommodationDetails.description}
                </p>
              )}
            </div>
          </NarrativeSection>
        );
      })}

      {/* 4. PRICING SECTION */}
      <NarrativeSection isPricing>
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <div className="flex gap-1 mb-6 text-yellow-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <h2 className="text-5xl font-serif font-black mb-8 tracking-tighter">The Investment</h2>

            {/* Inclusions */}
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.3em] text-emerald-500 font-bold mb-4">Inclusions</h3>
              <div className="space-y-3 text-white/70 max-h-[35vh] overflow-y-auto pr-2">
                {includedItems && includedItems.map((inc, i) => (
                  <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-2">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs uppercase tracking-wider">{inc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Exclusions */}
            {excludedItems && excludedItems.length > 0 && (
              <div>
                <h3 className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold mb-4">Exclusions</h3>
                <div className="space-y-3 text-white/50 max-h-[20vh] overflow-y-auto pr-2">
                  {excludedItems.map((exc, i) => (
                    <div key={i} className="flex items-start gap-3 border-b border-white/5 pb-2">
                        <XCircle size={14} className="text-white/30 shrink-0 mt-0.5" />
                        <span className="text-xs uppercase tracking-wider">{exc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur-lg p-10 border border-white/10 rounded-sm">
            {clientName && (
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/40 mb-2">Prepared for</p>
            )}
            {clientName && (
              <p className="text-lg font-serif text-white mb-6">{clientName}</p>
            )}
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-500 font-bold mb-8">Confidential Proposal</p>
            <div className="flex justify-between items-end border-b border-white/20 pb-6 mb-6">
               <div>
                  <p className="text-4xl md:text-5xl font-serif font-bold">{pricing.total}</p>
                   {pricing.perPerson && (
                      <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">
                        {pricing.perPerson} per person
                      </p>
                   )}
               </div>
            </div>

            {/* Map Preview */}
            {mapData && mapData.locations && mapData.locations.length > 0 && (
              <div className="h-40 mb-6 rounded overflow-hidden">
                <TripMap data={mapData} />
              </div>
            )}

            <button className="w-full bg-emerald-700 text-white py-5 font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-all duration-500 flex justify-center items-center gap-3">
               Confirm Proposal <ArrowRight size={16} />
            </button>
            {organization?.name && (
              <p className="text-center text-[10px] text-white/30 mt-4">by {organization.name}</p>
            )}
          </div>
        </div>
      </NarrativeSection>

      {/* 5. IMPORTANT NOTES SECTION */}
      {importantNotes && (importantNotes.description || (importantNotes.points && importantNotes.points.length > 0)) && (
        <NarrativeSection imageUrl={heroImage} imageRight={false}>
          <h2 className="text-4xl font-serif font-bold mb-6 text-slate-900">Important Notes</h2>
          {importantNotes.description && (
            <p className="text-lg text-slate-600 leading-relaxed mb-8 font-serif italic">
              {importantNotes.description}
            </p>
          )}
          {importantNotes.points && importantNotes.points.length > 0 && (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
              {importantNotes.points.map((point, i) => (
                <div key={i} className="flex items-start gap-4 py-3 border-b border-black/5 last:border-0">
                  <span className="text-emerald-800 font-bold text-lg">•</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          )}
        </NarrativeSection>
      )}

      {/* FLOATING PAGE TRACKER */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-50">
        {[...Array(itinerary.length + (importantNotes ? 4 : 3))].map((_, i) => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-black/20" />
        ))}
      </div>

    </div>
  );
}