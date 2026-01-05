'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map,
  MapRoute,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  AnimatedRouteMarker,
} from '@repo/ui/map';
import type { ItineraryData, NationalParkInfo } from '@/types/itinerary-types';
import { confirmProposal } from '@/app/itineraries/actions';

function TripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { locations, startLocation, endLocation } = data;

  // Handle empty locations array
  if (!locations || locations.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-stone-100/50 bg-stone-50 p-4">
        <p className="text-sm text-stone-400">Map data not available</p>
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

  // Calculate center from all locations
  const center = useMemo(() => {
    const lngs = allLocations.map((l) => l.coordinates[0]);
    const lats = allLocations.map((l) => l.coordinates[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ] as [number, number];
  }, [allLocations]);

  // Extract coordinates for the route line
  const routeCoordinates = useMemo(
    () => allLocations.map((l) => l.coordinates as [number, number]),
    [allLocations]
  );

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-stone-100/50">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
          Route Map
        </h3>
      </div>
      <Map center={center} zoom={7} minZoom={5} maxZoom={12}>
        {/* Route Line */}
        {routeCoordinates.length > 1 && (
          <MapRoute
            coordinates={routeCoordinates}
            color="#A8A29E"
            width={2}
            opacity={0.9}
            dashArray={[4, 4]}
          />
        )}

        {/* Animated Route Marker */}
        {routeCoordinates.length > 1 && (
          <AnimatedRouteMarker
            coordinates={routeCoordinates}
            color="#16a34a"
            size={10}
            duration={8000}
          />
        )}

        {/* Start Location Marker */}
        {startLocation && (
          <MapMarker
            longitude={startLocation.coordinates[0]}
            latitude={startLocation.coordinates[1]}
          >
            <MarkerContent>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-600 text-[8px] font-bold text-white shadow-md">
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
          <MapMarker
            key={loc.name}
            longitude={loc.coordinates[0]}
            latitude={loc.coordinates[1]}
          >
            <MarkerContent>
              <motion.div
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-stone-800 text-[9px] font-bold text-white shadow-md"
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
          <MapMarker
            longitude={endLocation.coordinates[0]}
            latitude={endLocation.coordinates[1]}
          >
            <MarkerContent>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[8px] font-bold text-white shadow-md">
                END
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <span className="text-xs font-medium">End: {endLocation.name}</span>
            </MarkerTooltip>
          </MapMarker>
        )}
      </Map>
    </div>
  );
}

interface MinimalisticThemeProps {
  data: ItineraryData;
  onHeroImageChange?: (url: string) => void;
}

export default function MinimalisticTheme({ data, onHeroImageChange }: MinimalisticThemeProps) {
  const [isHeroHovered, setIsHeroHovered] = React.useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmName, setConfirmName] = useState(data.clientName || '');
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmError, setConfirmError] = useState('');

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

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-light text-stone-800 selection:bg-stone-200">
      {/* Hero Section */}
      <section
        className="relative h-[85vh] w-full overflow-hidden"
        onMouseEnter={() => onHeroImageChange && setIsHeroHovered(true)}
        onMouseLeave={() => setIsHeroHovered(false)}
      >
        <Image
          src={data.heroImage}
          alt={data.title}
          fill
          className="animate-reveal scale-105 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Edit overlay for hero image */}
        {onHeroImageChange && (
          <div
            className={`absolute inset-0 z-30 flex items-center justify-center bg-black/40 transition-opacity duration-200 ${
              isHeroHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              onClick={() => {
                // We'll use window to communicate since the picker is complex
                const event = new CustomEvent('openHeroImagePicker');
                window.dispatchEvent(event);
              }}
              className="flex flex-col items-center gap-3 text-white hover:scale-105 transition-transform"
            >
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-medium uppercase tracking-wider">Change Hero Image</span>
            </button>
          </div>
        )}

        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="animate-fade-in-up mb-4 text-xs tracking-[0.3em] text-white/80 uppercase">
            {data.clientName ? `Prepared for ${data.clientName} • ` : ''} {data.organization?.name || 'Kitasuro Travel'}
          </span>
          <h1 className="animate-fade-in-up mb-6 max-w-4xl font-serif text-5xl leading-tight text-white [animation-delay:200ms] md:text-7xl">
            {data.title} <br />
            {/* <span className="italic">{data.subtitle}</span> */}
          </h1>
          <div className="animate-fade-in-up flex items-center gap-8 text-sm tracking-widest text-white/90 uppercase [animation-delay:400ms]">
            <span>{data.duration}</span>
            <span className="h-8 w-px bg-white/30" />
            <span>{data.location}</span>
            <span className="h-8 w-px bg-white/30" />
            <span>All Inclusive</span>
          </div>
        </div>

        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="h-16 w-px bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-screen-xl px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 gap-24 lg:grid-cols-[1fr_400px]">
          {/* Left Column: Itinerary */}
          <div className="space-y-32">
            <div>
              <h2 className="mb-12 text-sm tracking-[0.2em] text-stone-400 uppercase">
                The Journey
              </h2>

              <div className="space-y-24">
                {data.itinerary.map((day, dayIndex) => {
                  // Match by national park ID (from picker)
                  const parkInfo: NationalParkInfo | null =
                    data.nationalParks && day.nationalParkId
                      ? (data.nationalParks[day.nationalParkId] ?? null)
                      : null;

                  // Get accommodation details
                  const accommodation = day.accommodation;
                  // Find accommodation details from accommodations array by name match or fallback to ID if possible (though we only store name in Day)
                  // Improved matching: try to find by name since that's what we have in Day
                  const accommodationDetails = data.accommodations.find(a => a.name === day.accommodation);

                   // Check previous day for redundant info
                  const previousDay = dayIndex > 0 ? data.itinerary[dayIndex - 1] : null;
                  
                  // Hide accommodation if it's the same as previous day AND consecutive
                  const isSameAccommodation = previousDay?.accommodation === day.accommodation;
                  const shouldHideAccommodation = isSameAccommodation && dayIndex > 0;

                  // Only show park info if it's different from the previous day
                  const previousParkId = previousDay?.nationalParkId;
                  const shouldShowParkInfo =
                    parkInfo !== null && day.nationalParkId !== previousParkId;

                  return (
                    <div key={day.day} className="group">
                      <div className="flex flex-col gap-8 md:flex-row md:gap-16">
                        <div className="shrink-0 md:w-32">
                          <span className="font-serif text-5xl text-stone-200 italic transition-colors group-hover:text-stone-300">
                            0{day.day}
                          </span>
                          <p className="mt-2 text-xs tracking-widest text-stone-500 uppercase">
                            {day.date}
                          </p>
                        </div>

                        <div className="flex-1 space-y-12">
                          <h3 className="font-serif text-3xl leading-tight text-stone-800 md:text-4xl">
                            {day.title}
                          </h3>

                          {day.description && (
                            <p className="text-lg leading-relaxed text-stone-600">
                              {day.description}
                            </p>
                          )}

                          {/* National Park Information Section - only show if different from previous day */}
                          {shouldShowParkInfo && parkInfo && (
                            <div className="space-y-8">
                              {parkInfo.featured_image_url && (
                                <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                                  <Image
                                    src={parkInfo.featured_image_url}
                                    alt={parkInfo.name}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                  <div className="absolute bottom-6 left-6">
                                    <span className="text-[10px] font-bold tracking-[0.3em] text-white/80 uppercase">
                                      {parkInfo.name} National Park
                                    </span>
                                  </div>
                                </div>
                              )}

                              {parkInfo.park_overview &&
                                Array.isArray(parkInfo.park_overview) &&
                                parkInfo.park_overview.length > 0 && (
                                  <div className="rounded-2xl border border-stone-200 bg-stone-50/50 p-8">
                                    <h4 className="mb-6 text-sm font-medium tracking-[0.2em] text-stone-400 uppercase">
                                      Park Information
                                    </h4>
                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                      {parkInfo.park_overview.map(
                                        (
                                          item: {
                                            title?: string;
                                            name?: string;
                                            description: string;
                                          },
                                          idx: number,
                                        ) => {
                                          // Handle both 'title' and 'name' fields (schema uses 'name', but data might use 'title')
                                          const itemTitle =
                                            item.title || item.name || 'Information';
                                          return (
                                            <div key={idx} className="space-y-2">
                                              <span className="text-xs font-bold tracking-wider text-stone-500 uppercase">
                                                {itemTitle}
                                              </span>
                                              <p className="text-sm leading-relaxed text-stone-700">
                                                {item.description}
                                              </p>
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}

                          {/* Accommodation Image Section - Show if different from previous day */}
                          {!shouldHideAccommodation && accommodation && accommodationDetails && (
                            <div className="mt-8">
                                <div className="relative h-64 w-full overflow-hidden rounded-2xl">
                                    <Image
                                        src={accommodationDetails.image}
                                        alt={accommodationDetails.name}
                                        fill
                                        className="object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                    <div className="absolute bottom-6 left-6 max-w-2xl text-balance">
                                        <span className="text-[10px] font-bold tracking-[0.3em] text-white/80 uppercase">
                                            Your Stay
                                        </span>
                                        <h4 className="mt-1 font-serif text-2xl text-white">
                                            {accommodationDetails.name}
                                        </h4>
                                    </div>
                                </div>
                                {accommodationDetails.description && (
                                    <div className="mt-4 px-1">
                                         <p className="text-sm leading-relaxed text-stone-700">
                                            {accommodationDetails.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                          )}

                          <div className="space-y-10 border-l border-stone-200 pl-8">
                            {day.activities.map((activity, idx) => (
                              <div key={idx} className="relative">
                                <div className="absolute top-2 -left-[37px] h-2 w-2 rounded-full bg-stone-500 outline outline-8 outline-[#FDFCFB]" />
                                <div className="space-y-2">
                                  <div className="flex items-baseline gap-4">
                                    <span className="text-[10px] font-medium tracking-tighter text-stone-500 uppercase">
                                      {activity.time}
                                    </span>
                                    <h4 className="text-lg font-medium text-stone-700">
                                      {activity.activity}
                                    </h4>
                                  </div>
                                  <p className="max-w-2xl leading-relaxed text-balance text-stone-600">
                                    {activity.description}
                                  </p>
                                  {activity.location && (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] tracking-wider text-stone-500 uppercase">
                                      <svg
                                        width="10"
                                        height="10"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                      >
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                                        <circle cx="12" cy="10" r="3" />
                                      </svg>
                                      {activity.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col justify-between gap-8 rounded-2xl bg-stone-50 p-8 md:flex-row">
                            <div>
                              <span className="mb-2 block text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                                Accommodation
                              </span>
                              <span className={`font-serif text-lg text-stone-700 italic ${shouldHideAccommodation ? 'opacity-50' : ''}`}>
                                {day.accommodation}
                                {shouldHideAccommodation && <span className="ml-2 text-xs not-italic text-stone-400">(Cont.)</span>}
                              </span>
                            </div>
                            <div className="md:text-right">
                              <span className="mb-2 block text-[10px] tracking-[0.2em] text-stone-400 uppercase">
                                Dining
                              </span>
                              <span className="text-sm text-stone-600 italic">{day.meals}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Your Stays Section - Removed as per request to move images inline */}
          </div>

          {/* Right Column: Details & CTA */}
          <aside className="space-y-16">
            <div className="sticky top-12 space-y-16">
              {/* Proposal Sidebar */}
              <div className="rounded-3xl border border-stone-100 bg-white p-10 shadow-sm">
                <div className="mb-10">
                  <TripMap data={data.mapData} />
                </div>

                <div className="mb-8 border-b border-stone-100 pb-8">
                  <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-stone-400 uppercase">
                    Trip Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">Duration</span>
                      <span className="font-medium">{data.duration}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">Destination</span>
                      <span className="font-medium italic">{data.location}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-400">Pace</span>
                      <span className="font-medium">Curated</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8 border-b border-stone-100 pb-8">
                  <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-stone-400 uppercase">
                    Pricing
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-stone-400">Total Investment</span>
                      <span className="font-serif text-2xl text-stone-800">
                        {data.pricing.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                      <span>Per Person</span>
                      <span>{data.pricing.perPerson}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-10 space-y-8">
                  <div>
                    <h4 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-stone-500" />
                      Inclusions
                    </h4>
                    <ul className="space-y-3">
                      {data.includedItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-stone-600">
                          <span className="font-bold text-stone-400">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {data.excludedItems && data.excludedItems.length > 0 && (
                   <div className="mt-8 pt-8 border-t border-stone-100">
                      <h4 className="mb-4 flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-stone-500 uppercase">
                        <span className="h-1.5 w-1.5 rounded-full bg-stone-300" />
                        Exclusions
                      </h4>
                      <ul className="space-y-3">
                        {data.excludedItems.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-stone-700">
                            <span className="font-bold text-stone-300">-</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                )}

                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full cursor-pointer rounded-xl bg-stone-800 px-8 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-900"
                >
                  Confirm Proposal
                </button>
                <p className="mt-6 text-center text-[10px] text-stone-400 italic">
                  Validity period: 10 days from receipt
                </p>

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
                              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <h3 className="mb-2 font-serif text-2xl text-stone-900">Proposal Confirmed!</h3>
                            <p className="mb-6 text-stone-600">
                              Thank you for confirming. The tour operator has been notified and will contact you shortly to finalize your booking.
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
                            <h3 className="mb-2 font-serif text-2xl text-stone-900">Confirm Your Proposal</h3>
                            <p className="mb-6 text-sm text-stone-600">
                              By confirming, you agree to proceed with this trip. The tour operator will be notified and will contact you to finalize the details.
                            </p>

                            <div className="mb-6">
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Your Name
                              </label>
                              <input
                                type="text"
                                value={confirmName}
                                onChange={(e) => setConfirmName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
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
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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

              {/* Extra Info */}
              <div className="space-y-8 px-4">
                <div>
                  <h4 className="mb-4 text-xs font-bold tracking-[0.2em] text-stone-800 uppercase">
                    Important Notes
                  </h4>
                  <p className="mb-4 text-sm leading-relaxed text-stone-600 italic">
                    {data.importantNotes.description}
                  </p>
                  <ul className="space-y-3 text-[13px] text-stone-500">
                    {data.importantNotes.points.map((p, i) => (
                      <li key={i}>• {p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <style jsx global>{`
        @keyframes reveal {
          from {
            transform: scale(1.1);
            opacity: 0;
          }
          to {
            transform: scale(1.05);
            opacity: 1;
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-reveal {
          animation: reveal 1.5s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}
