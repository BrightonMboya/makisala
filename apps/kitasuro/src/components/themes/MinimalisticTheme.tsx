'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Line, Marker } from 'react-simple-maps';
import type { ItineraryData, NationalParkInfo } from '@/types/itinerary-types';

function TripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { geojson, locations, scale, rotate } = data;
  // Handle empty locations array
  if (!locations || locations.length === 0) {
    return (
      <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl border border-stone-100/50 bg-stone-50 p-4">
        <p className="text-sm text-stone-400">Map data not available</p>
      </div>
    );
  }
  const start = locations[0]?.coordinates!;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-stone-100/50 bg-stone-50 p-4">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
          Route Map
        </h3>
      </div>
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: rotate,
          scale: scale,
        }}
        className="h-full w-full fill-none"
      >
        <Geographies geography={geojson}>
          {({ geographies }) =>
            geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#FFFFFF"
                stroke="#E7E5E4"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Route Path */}
        {locations.map((loc, idx) => {
          if (idx === 0) return null;
          const prevLocation = locations[idx - 1];
          if (!prevLocation) return null;
          return (
            <Line
              key={idx}
              from={prevLocation.coordinates}
              to={loc.coordinates}
              stroke="#A8A29E"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Markers */}
        {locations.map((loc, idx) => (
          <Marker key={loc.name} coordinates={loc.coordinates}>
            <motion.circle
              r={4}
              fill="#292524"
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100, delay: idx * 0.5 }}
            />
            <text
              textAnchor={idx % 2 === 0 ? 'start' : 'end'}
              y={idx % 2 === 0 ? 20 : -12}
              x={idx % 2 === 0 ? 10 : -10}
              className="fill-stone-500 font-sans text-[10px] font-bold italic"
              style={{ fontSize: '10px' }}
            >
              {loc.name}
            </text>
          </Marker>
        ))}

        {/* Airplane/Progress Marker Animation */}
        <Marker coordinates={start}>
          <motion.circle
            r={3}
            fill="#292524"
            initial={{ opacity: 0 }}
            whileInView={{
              opacity: [0, 1, 1],
              x: locations.map((_, i) => i * -15),
              y: locations.map((_, i) => i * -18),
            }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
              delay: 0.5,
            }}
          />
        </Marker>
      </ComposableMap>
    </div>
  );
}

export default function MinimalisticTheme({ data }: { data: ItineraryData }) {
  return (
    <div className="min-h-screen bg-[#FDFCFB] font-light text-stone-800 selection:bg-stone-200">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <Image
          src={data.heroImage}
          alt={data.title}
          fill
          className="animate-reveal scale-105 object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col items-center justify-center px-6 text-center">
          <span className="animate-fade-in-up mb-4 text-xs tracking-[0.3em] text-white/80 uppercase">
            Kitasuro Travel • Private Journey
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

                  // Only show park info if it's different from the previous day
                  const previousDay = dayIndex > 0 ? data.itinerary[dayIndex - 1] : null;
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
                              <span className="font-serif text-lg text-stone-700 italic">
                                {day.accommodation}
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

            {/* Your Stays Section */}
            <div className="space-y-16">
              <h2 className="text-sm tracking-[0.2em] text-stone-400 uppercase">Your Stays</h2>
              <div className="space-y-16">
                {data.accommodations.map((lodge) => (
                  <div key={lodge.id} className="group space-y-8">
                    <div className="relative h-[500px] w-full overflow-hidden rounded-3xl shadow-2xl shadow-stone-200/50">
                      <Image
                        src={lodge.image}
                        alt={lodge.name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    </div>
                    <div className="max-w-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase">
                          Featured Retreat
                        </span>
                        <div className="h-px w-8 bg-stone-200" />
                        <span className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase">
                          {lodge.location}
                        </span>
                      </div>
                      <h3 className="font-serif text-3xl text-stone-800">{lodge.name}</h3>
                      <p className="leading-relaxed text-balance text-stone-600 italic">
                        "{lodge.description}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

                <button className="w-full rounded-xl bg-stone-800 px-8 py-5 text-sm font-medium tracking-[0.2em] text-white uppercase transition-colors hover:bg-stone-900">
                  Confirm Proposal
                </button>
                <p className="mt-6 text-center text-[10px] text-stone-400 italic">
                  Validity period: 10 days from receipt
                </p>
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
