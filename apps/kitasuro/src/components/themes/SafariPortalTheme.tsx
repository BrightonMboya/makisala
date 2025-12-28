"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import { ItineraryData } from "@/data/itineraries";

function TripMap({ data }: { data: ItineraryData["mapData"] }) {
  const { geojson, locations, scale, rotate } = data;
  // Handle empty locations array
  if (!locations || locations.length === 0) {
    return (
      <div className="w-full h-full min-h-[400px] bg-stone-100/50 rounded-xl overflow-hidden border border-stone-200 flex items-center justify-center">
        <p className="text-stone-400 text-sm">Map data not available</p>
      </div>
    );
  }
  return (
    <div className="w-full h-full min-h-[400px] bg-stone-100/50 rounded-xl overflow-hidden border border-stone-200">
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{ rotate, scale }}
        className="w-full h-full fill-none"
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
                style={{ default: { outline: "none" } }}
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
            <text textAnchor="middle" y={-10} className="fill-stone-500 text-[8px] uppercase tracking-widest font-bold">
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
  const [activeSection, setActiveSection] = useState<"overview" | number>("overview");
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
        let currentSection: "overview" | number = "overview";
        
        // Check overview first
        const overviewEl = sectionRefs.current.get("overview");
        if (overviewEl) {
          const overviewTop = overviewEl.offsetTop;
          const overviewBottom = overviewTop + overviewEl.offsetHeight;
          if (viewportTop >= overviewTop && viewportTop < overviewBottom) {
            currentSection = "overview";
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
      container.addEventListener("scroll", handleScroll);
      handleScroll(); // Initial call
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [data.itinerary]);

  const navItems = [
    { id: "overview", label: "Overview" },
    { id: "itinerary", label: "Itinerary" },
    { id: "stays", label: "Your Stays" },
    { id: "map", label: "Map" },
    { id: "details", label: "Pricing & Details" },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element && rightContentRef.current) {
      const container = rightContentRef.current;
      const elementTop = element.offsetTop - 100;
      container.scrollTo({
        top: elementTop,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-white text-stone-900 font-sans selection:bg-stone-100">
      {/* Fixed Left Side with Parallax Image */}
      <div className="w-[45%] h-full fixed left-0 top-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSection === "overview" ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ 
                y: `${scrollProgress * 30}%`,
              }}
              className="relative w-full h-[120%]"
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
                  <div className="text-xs uppercase tracking-[0.3em] font-medium text-white/80">
                    Prepared for
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                    {data.title.toUpperCase()}
                  </h1>
                  <div className="text-sm font-light text-white/90">
                    {data.duration}
                  </div>
                </div>
          </div>
            </motion.div>
          ) : (
            (() => {
              const day = data.itinerary.find(d => d.day === activeSection);
              if (!day) return null;
              const accommodation = data.accommodations.find(acc => 
                day.accommodation.toLowerCase().includes(acc.name.toLowerCase()) ||
                acc.name.toLowerCase().includes(day.accommodation.toLowerCase())
              );
              const imageSrc = accommodation?.image || data.heroImage;
              const locationName = accommodation?.location || day.accommodation.split(',')[0] || data.location;
              
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
                  className="relative w-full h-[120%]"
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
                      <div className="text-base font-serif italic text-white/90">
                        - {day.date.split(',')[0]}
                      </div>
                      <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight">
                        {locationName.toUpperCase().split(' ').slice(0, 2).join(' ')}
                      </h1>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/90">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
      <div
        ref={rightContentRef}
        className="w-[55%] ml-[45%] h-full overflow-y-auto"
      >
        {/* Top Nav */}
        <nav className="sticky top-0 z-50 bg-white border-b border-stone-100">
          <div className="px-8 py-4 flex justify-between items-center">
            <button className="p-2 hover:bg-stone-100 rounded">
              <svg className="w-6 h-6 text-stone-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="font-serif text-lg tracking-tight text-stone-800">
              Your Logo Here
            </div>
            <div className="flex gap-4">
              <button className="p-2 hover:bg-stone-100 rounded">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-stone-100 rounded">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button className="p-2 hover:bg-stone-100 rounded">
                <svg className="w-5 h-5 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
          </div>
        </div>
      </nav>

        {/* Content Sections */}
        <div className="px-8 py-12 space-y-24">

          {/* Overview/Quote Section */}
          <section 
            id="overview" 
            ref={(el) => {
              if (el) sectionRefs.current.set("overview", el);
            }}
            className="min-h-[80vh] flex items-center justify-center py-24"
          >
            <div className="max-w-3xl px-8 space-y-12">
              <blockquote className="text-4xl md:text-5xl font-bold text-stone-800 leading-tight text-center">
                "{data.subtitle || 'An extraordinary journey awaits'}"
              </blockquote>
              <div className="text-center text-stone-500 italic text-lg">
                - {data.title}
               </div>
        </div>
      </section>

      {/* Itinerary */}
          <section id="itinerary" className="space-y-12">
            <div className="space-y-2">
              <h2 className="text-2xl font-serif text-stone-800">Itinerary details</h2>
              <p className="text-stone-500 text-sm italic">Travel Brief</p>
            </div>

            <div className="space-y-20">
              {data.itinerary.map((day) => {
                const accommodation = data.accommodations.find(acc => 
                  day.accommodation.toLowerCase().includes(acc.name.toLowerCase()) ||
                  acc.name.toLowerCase().includes(day.accommodation.toLowerCase())
                );
                const locationName = accommodation?.location || day.accommodation.split(',')[0] || data.location;
                
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
                        <h3 className="text-2xl font-serif text-stone-800">{locationName}</h3>
                        <div className="flex items-center gap-2 text-sm text-stone-500">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>{locationName}</span>
                </div>
              </div>
            </div>

                    <div className="space-y-6">
                    <div>
                        <h4 className="text-lg font-semibold text-stone-800 mb-3">{day.title}</h4>
                        {day.activities[0]?.description && (
                          <p className="text-stone-600 leading-relaxed">{day.activities[0].description}</p>
                        )}
                  </div>

                      {day.activities.length > 0 && (
                        <div className="space-y-4">
                        {day.activities.map((act, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs bg-stone-100 px-2 py-1 rounded font-semibold text-stone-600">{act.time}</span>
                                <h5 className="font-semibold text-stone-700">{act.activity}</h5>
                              </div>
                              {act.description && i > 0 && (
                                <p className="text-stone-500 text-sm leading-relaxed ml-20">{act.description}</p>
                              )}
                          </div>
                        ))}
                     </div>
                      )}
                      
                      {day.accommodation && day.accommodation !== 'N/A' && (
                        <div className="pt-4 border-t border-stone-100">
                          <div className="text-sm text-stone-500 italic">Overnight {day.accommodation}</div>
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
              <h2 className="text-3xl font-serif text-stone-800 mb-2">Signature Stays</h2>
              <p className="text-stone-500 text-sm">
               Handpicked sanctuaries chosen for their exclusivity, sustainability, and sense of place.
             </p>
          </div>
            <div className="space-y-12">
            {data.accommodations.map((lodge) => (
              <div key={lodge.id} className="group cursor-pointer">
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4">
                  <Image src={lodge.image} alt={lodge.name} fill className="object-cover transition-transform duration-1000 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur rounded-full text-[9px] uppercase tracking-[0.2em] font-bold text-stone-800">
                    {lodge.location}
                  </div>
                </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-serif text-stone-800 group-hover:text-stone-500 transition-colors">
                    {lodge.name}
                  </h3>
                    <p className="text-stone-500 text-sm leading-relaxed">
                    {lodge.description}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* Map */}
          <section id="map" className="space-y-8">
            <div>
              <h2 className="text-3xl font-serif text-stone-800 mb-2">The Route Map</h2>
              <p className="text-stone-500 text-sm">
                Navigate through the detailed trail of your upcoming adventure.
                   </p>
                </div>
                <div className="space-y-6">
                   {data.mapData.locations.map((loc, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-2xl font-serif italic text-stone-300">0{i+1}</span>
                        <div className="h-px flex-1 bg-stone-200" />
                  <span className="text-sm uppercase tracking-[0.2em] font-bold text-stone-600">{loc.name}</span>
                     </div>
                   ))}
                </div>
            <div className="h-[400px] rounded-xl overflow-hidden">
             <TripMap data={data.mapData} />
        </div>
      </section>

      {/* Details (Pricing, etc) */}
          <section id="details" className="space-y-8 pb-24">
            <div className="bg-stone-900 rounded-3xl p-12 text-white">
              <div className="space-y-8">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-bold mb-4 block">Final Confirmation</span>
                  <h2 className="text-4xl font-serif leading-tight">Your Private Safari Proposal</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-8 py-8 border-y border-white/10">
                   <div className="space-y-1">
                     <span className="text-[10px] text-stone-500 uppercase tracking-widest">Total Investment</span>
                     <p className="text-3xl font-serif">{data.pricing.total}</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-[10px] text-stone-500 uppercase tracking-widest">Deposit Required</span>
                     <p className="text-3xl font-serif">25%</p>
                   </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">What's Included</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {data.includedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-stone-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <button className="bg-white text-stone-900 px-8 py-4 rounded-full text-sm uppercase tracking-[0.2em] font-bold hover:bg-stone-100 transition-all w-full">
                  Accept & Secure Dates
                </button>
              </div>
            </div>

            <footer className="pt-12 border-t border-stone-200 text-center space-y-6">
              <div className="font-serif text-2xl italic text-stone-300">Kitasuro Travel</div>
              <div className="flex justify-center gap-8 text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">
               <a href="#" className="hover:text-stone-900 transition-colors">Instagram</a>
               <a href="#" className="hover:text-stone-900 transition-colors">WhatsApp</a>
               <a href="#" className="hover:text-stone-900 transition-colors">Contact</a>
            </div>
              <div className="text-[9px] uppercase tracking-widest text-stone-300">
               © 2025 Kitasuro • Private & Confidential
              </div>
            </footer>
          </section>
            </div>
         </div>
    </div>
  );
}
