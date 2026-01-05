'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ComposableMap, Geographies, Geography, Line, Marker } from 'react-simple-maps';
import type { ItineraryData, NationalParkInfo } from '@/types/itinerary-types';

function TripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { geojson, locations, scale, rotate } = data;
  // Handle empty locations array
  if (!locations || locations.length === 0) {
    return (
      <div className="flex h-full min-h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100/50">
        <p className="text-sm text-stone-400">Map data not available</p>
      </div>
    );
  }
  return (
    <div className="h-full min-h-[400px] w-full overflow-hidden rounded-xl border border-stone-200 bg-stone-100/50">
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{ rotate, scale }}
        className="h-full w-full fill-none"
      >
        <Geographies geography={geojson}>
          {({ geographies }) =>
            geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#FFFFFF"
                stroke="#D6D3D1"
                strokeWidth={0.5}
                style={{ default: { outline: 'none' } }}
              />
            ))
          }
        </Geographies>
        {locations.map((loc, idx) => {
          if (idx === 0) return null;
          return (
            <Line
              key={idx}
              from={locations[idx - 1].coordinates}
              to={loc.coordinates}
              stroke="#A8A29E"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          );
        })}
        {locations.map((loc) => (
          <Marker key={loc.name} coordinates={loc.coordinates}>
            <circle r={3} fill="#444" />
            <text
              textAnchor="middle"
              y={-10}
              className="fill-stone-500 text-[8px] font-bold tracking-widest uppercase"
            >
              {loc.name}
            </text>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}

export default function SafariPortalTheme({ data }: { data: ItineraryData }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<'overview' | number>('overview');
  const rightContentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    const handleScroll = () => {
      if (rightContentRef.current) {
        const container = rightContentRef.current;
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const progress = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
        setScrollProgress(progress);
        setIsScrolled(scrollTop > 100);

        // Determine which section is in view
        const viewportTop = scrollTop + 200; // Offset for better detection
        let currentSection: 'overview' | number = 'overview';

        // Check overview first
        const overviewEl = sectionRefs.current.get('overview');
        if (overviewEl) {
          const overviewTop = overviewEl.offsetTop;
          const overviewBottom = overviewTop + overviewEl.offsetHeight;
          if (viewportTop >= overviewTop && viewportTop < overviewBottom) {
            currentSection = 'overview';
          }
        }

        // Check each day section
        data.itinerary.forEach((day) => {
          const dayEl = sectionRefs.current.get(`day-${day.day}`);
          if (dayEl) {
            const dayTop = dayEl.offsetTop;
            const dayBottom = dayTop + dayEl.offsetHeight;
            if (viewportTop >= dayTop && viewportTop < dayBottom) {
              currentSection = day.day;
            }
          }
        });

        setActiveSection(currentSection);
      }
    };
    const container = rightContentRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      handleScroll(); // Initial call
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [data.itinerary]);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'itinerary', label: 'Itinerary' },
    { id: 'stays', label: 'Your Stays' },
    { id: 'map', label: 'Map' },
    { id: 'details', label: 'Pricing & Details' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && rightContentRef.current) {
      const container = rightContentRef.current;
      const elementTop = element.offsetTop - 100;
      container.scrollTo({
        top: elementTop,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white font-sans text-stone-900 selection:bg-stone-100">
      {/* Fixed Left Side with Parallax Image */}
      <div className="fixed top-0 left-0 h-full w-[45%] overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSection === 'overview' ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                y: `${scrollProgress * 30}%`,
              }}
              className="relative h-[120%] w-full"
            >
              <Image
                src={data.heroImage}
                alt={data.title}
                fill
                className="object-cover"
                priority
                sizes="45vw"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

              {/* Overlay Content on Left */}
              <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
                <div className="space-y-4">
                  <div className="text-xs font-medium tracking-[0.3em] text-white/80 uppercase">
                    Prepared for
                  </div>
                  <h1 className="text-5xl leading-tight font-bold md:text-7xl">
                    {data.title.toUpperCase()}
                  </h1>
                  <div className="text-sm font-light text-white/90">{data.duration}</div>
                </div>
              </div>
            </motion.div>
          ) : (
            (() => {
              const day = data.itinerary.find((d) => d.day === activeSection);
              if (!day) return null;
              const accommodation = data.accommodations.find(
                (acc) =>
                  day.accommodation.toLowerCase().includes(acc.name.toLowerCase()) ||
                  acc.name.toLowerCase().includes(day.accommodation.toLowerCase()),
              );
              const imageSrc = accommodation?.image || data.heroImage;
              const locationName =
                accommodation?.location || day.accommodation.split(',')[0] || data.location;

              return (
                <motion.div
                  key={`day-${day.day}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  style={{
                    y: `${scrollProgress * 30}%`,
                  }}
                  className="relative h-[120%] w-full"
                >
                  <Image
                    src={imageSrc}
                    alt={day.title}
                    fill
                    className="object-cover"
                    sizes="45vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

                  {/* Overlay Content on Left */}
                  <div className="absolute inset-0 flex flex-col justify-between p-12 text-white">
                    <div className="space-y-3">
                      <div className="font-serif text-base text-white/90 italic">
                        - {day.date.split(',')[0]}
                      </div>
                      <h1 className="text-5xl leading-tight font-bold tracking-tight md:text-7xl">
                        {locationName.toUpperCase().split(' ').slice(0, 2).join(' ')}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{locationName}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })()
          )}
        </AnimatePresence>
      </div>

      {/* Scrollable Right Side */}
      <div ref={rightContentRef} className="ml-[45%] h-full w-[55%] overflow-y-auto">
        {/* Top Nav */}
        <nav className="sticky top-0 z-50 border-b border-stone-100 bg-white">
          <div className="flex items-center justify-between px-8 py-4">
            <button className="rounded p-2 hover:bg-stone-100">
              <svg
                className="h-6 w-6 text-stone-800"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            {data.organization?.logoUrl ? (
              <Image src={data.organization.logoUrl} alt={data.organization.name} width={120} height={40} className="object-contain" />
            ) : (
              <div className="font-serif text-lg tracking-tight text-stone-800">{data.organization?.name || 'Your Logo Here'}</div>
            )}
            <div className="flex gap-4">
              <button className="rounded p-2 hover:bg-stone-100">
                <svg
                  className="h-5 w-5 text-stone-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>
              <button className="rounded p-2 hover:bg-stone-100">
                <svg
                  className="h-5 w-5 text-stone-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </button>
              <button className="rounded p-2 hover:bg-stone-100">
                <svg
                  className="h-5 w-5 text-stone-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Content Sections */}
        <div className="space-y-24 px-8 py-12">
          {/* Overview/Quote Section */}
          <section
            id="overview"
            ref={(el) => {
              if (el) sectionRefs.current.set('overview', el);
            }}
            className="flex min-h-[80vh] items-center justify-center py-24"
          >
            <div className="max-w-3xl space-y-12 px-8">
              <blockquote className="text-center text-4xl leading-tight font-bold text-stone-800 md:text-5xl">
                "{data.subtitle || 'An extraordinary journey awaits'}"
              </blockquote>
              <div className="text-center text-lg text-stone-500 italic">- {data.title}</div>
            </div>
          </section>

          {/* Itinerary */}
          <section id="itinerary" className="space-y-12">
            <div className="space-y-2">
              <h2 className="font-serif text-2xl text-stone-800">Itinerary details</h2>
              <p className="text-sm text-stone-500 italic">Travel Brief</p>
            </div>

            <div className="space-y-20">
              {data.itinerary.map((day, dayIndex) => {
                const accommodation = data.accommodations.find(
                  (acc) =>
                    day.accommodation.toLowerCase().includes(acc.name.toLowerCase()) ||
                    acc.name.toLowerCase().includes(day.accommodation.toLowerCase()),
                );
                const locationName =
                  accommodation?.location || day.accommodation.split(',')[0] || data.location;

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
                  <div
                    key={day.day}
                    id={`day-${day.day}`}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(`day-${day.day}`, el);
                    }}
                    className="space-y-8"
                  >
                    <div className="flex items-start gap-6">
                      <div className="relative flex-shrink-0">
                        <Image
                          src={accommodation?.image || data.heroImage}
                          alt={day.title}
                          width={100}
                          height={100}
                          className="rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="text-sm text-stone-400">{day.date}</div>
                        <h3 className="font-serif text-2xl text-stone-800">{locationName}</h3>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>{locationName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-3 text-lg font-semibold text-stone-800">{day.title}</h4>
                        {day.description && (
                          <p className="leading-relaxed text-stone-600">{day.description}</p>
                        )}
                        {!day.description && day.activities[0]?.description && (
                          <p className="leading-relaxed text-stone-600">
                            {day.activities[0].description}
                          </p>
                        )}
                      </div>

                      {/* National Park Information Section - only show if different from previous day */}
                      {shouldShowParkInfo && parkInfo && (
                        <div className="space-y-6 pt-4">
                          {parkInfo.featured_image_url && (
                            <div className="relative h-64 w-full overflow-hidden rounded-xl">
                              <Image
                                src={parkInfo.featured_image_url}
                                alt={parkInfo.name}
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <div className="absolute bottom-4 left-4">
                                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase">
                                  {parkInfo.name} National Park
                                </span>
                              </div>
                            </div>
                          )}

                          {parkInfo.park_overview &&
                            Array.isArray(parkInfo.park_overview) &&
                            parkInfo.park_overview.length > 0 && (
                              <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
                                <h5 className="mb-4 text-sm font-semibold tracking-[0.1em] text-stone-600 uppercase">
                                  Park Information
                                </h5>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                  {parkInfo.park_overview.map(
                                    (
                                      item: { title?: string; name?: string; description: string },
                                      idx: number,
                                    ) => {
                                      // Handle both 'title' and 'name' fields (schema uses 'name', but data might use 'title')
                                      const itemTitle = item.title || item.name || 'Information';
                                      return (
                                        <div key={idx} className="space-y-1">
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

                      {day.activities.length > 0 && (
                        <div className="space-y-4">
                          {day.activities.map((act, i) => (
                            <div key={i} className="space-y-2">
                              <div className="flex items-center gap-3">
                                <span className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
                                  {act.time}
                                </span>
                                <h5 className="font-semibold text-stone-700">{act.activity}</h5>
                              </div>
                              {act.description && i > 0 && (
                                <p className="ml-20 text-sm leading-relaxed text-stone-500">
                                  {act.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {day.accommodation && day.accommodation !== 'N/A' && (
                        <div className="border-t border-stone-100 pt-4">
                          <div className="text-sm text-stone-500 italic">
                            Overnight {day.accommodation}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Stays */}
          <section id="stays" className="space-y-8">
            <div>
              <h2 className="mb-2 font-serif text-3xl text-stone-800">Signature Stays</h2>
              <p className="text-sm text-stone-500">
                Handpicked sanctuaries chosen for their exclusivity, sustainability, and sense of
                place.
              </p>
            </div>
            <div className="space-y-12">
              {data.accommodations.map((lodge) => (
                <div key={lodge.id} className="group cursor-pointer">
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl">
                    <Image
                      src={lodge.image}
                      alt={lodge.name}
                      fill
                      className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-[9px] font-bold tracking-[0.2em] text-stone-800 uppercase backdrop-blur">
                      {lodge.location}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-xl text-stone-800 transition-colors group-hover:text-stone-500">
                      {lodge.name}
                    </h3>
                    <p className="text-sm leading-relaxed text-stone-500">{lodge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Map */}
          <section id="map" className="space-y-8">
            <div>
              <h2 className="mb-2 font-serif text-3xl text-stone-800">The Route Map</h2>
              <p className="text-sm text-stone-500">
                Navigate through the detailed trail of your upcoming adventure.
              </p>
            </div>
            <div className="space-y-6">
              {data.mapData.locations.map((loc, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="font-serif text-2xl text-stone-300 italic">0{i + 1}</span>
                  <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-sm font-bold tracking-[0.2em] text-stone-600 uppercase">
                    {loc.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-[400px] overflow-hidden rounded-xl">
              <TripMap data={data.mapData} />
            </div>
          </section>

          {/* Details (Pricing, etc) */}
          <section id="details" className="space-y-8 pb-24">
            <div className="rounded-3xl bg-stone-900 p-12 text-white">
              <div className="space-y-8">
                <div>
                  <span className="mb-4 block text-[10px] font-bold tracking-[0.4em] text-stone-400 uppercase">
                    Final Confirmation
                  </span>
                  <h2 className="font-serif text-4xl leading-tight">
                    Your Private Safari Proposal
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-8 border-y border-white/10 py-8">
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-widest text-stone-500 uppercase">
                      Total Investment
                    </span>
                    <p className="font-serif text-3xl">{data.pricing.total}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-widest text-stone-500 uppercase">
                      Deposit Required
                    </span>
                    <p className="font-serif text-3xl">25%</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase">
                    What's Included
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {data.includedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-stone-300">
                        <div className="h-1.5 w-1.5 rounded-full bg-stone-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full rounded-full bg-white px-8 py-4 text-sm font-bold tracking-[0.2em] text-stone-900 uppercase transition-all hover:bg-stone-100">
                  Accept & Secure Dates
                </button>
              </div>
            </div>

            <footer className="space-y-6 border-t border-stone-200 pt-12 text-center">
              <div className="font-serif text-2xl text-stone-300 italic">{data.organization?.name || 'Kitasuro Travel'}</div>
              <div className="flex justify-center gap-8 text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase">
                <a href="#" className="transition-colors hover:text-stone-900">
                  Instagram
                </a>
                <a href="#" className="transition-colors hover:text-stone-900">
                  WhatsApp
                </a>
                <a href="#" className="transition-colors hover:text-stone-900">
                  Contact
                </a>
              </div>
              <div className="text-[9px] tracking-widest text-stone-300 uppercase">
                © 2025 Kitasuro • Private & Confidential
              </div>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
