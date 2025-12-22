"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Line,
  Marker,
} from "react-simple-maps";
import { ItineraryData, Location } from "@/data/itineraries";

function TripMap({ data }: { data: ItineraryData["mapData"] }) {
  const { geojson, locations, scale, rotate } = data;
  const start = locations[0].coordinates;

  return (
    <div className="relative w-full aspect-square bg-stone-50 rounded-2xl overflow-hidden p-4 border border-stone-100/50">
      <div className="absolute top-4 left-4 z-10">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-bold">Route Map</h3>
      </div>
      <ComposableMap
        projection="geoAzimuthalEqualArea"
        projectionConfig={{
          rotate: rotate,
          scale: scale,
        }}
        className="w-full h-full fill-none"
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
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* Route Path */}
        {locations.map((loc, idx) => {
          if (idx === 0) return null;
          return (
            <Line
              key={idx}
              from={locations[idx - 1].coordinates}
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
              transition={{ type: "spring", damping: 10, stiffness: 100, delay: idx * 0.5 }}
            />
            <text
              textAnchor={idx % 2 === 0 ? "start" : "end"}
              y={idx % 2 === 0 ? 20 : -12}
              x={idx % 2 === 0 ? 10 : -10}
              className="fill-stone-500 text-[10px] font-sans italic font-bold"
              style={{ fontSize: "10px" }}
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
              ease: "easeInOut",
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
    <div className="min-h-screen bg-[#FDFCFB] text-stone-800 font-light selection:bg-stone-200">
      {/* Hero Section */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <Image
          src={data.heroImage}
          alt={data.title}
          fill
          className="object-cover animate-reveal scale-105"
          priority
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6">
          <span className="text-white/80 uppercase tracking-[0.3em] text-xs mb-4 animate-fade-in-up">
            Kitasuro Travel • Private Journey
          </span>
          <h1 className="text-5xl md:text-7xl font-serif text-white mb-6 max-w-4xl leading-tight animate-fade-in-up [animation-delay:200ms]">
            {data.title}: <br />
            <span className="italic">{data.subtitle}</span>
          </h1>
          <div className="flex items-center gap-8 text-white/90 text-sm tracking-widest uppercase animate-fade-in-up [animation-delay:400ms]">
            <span>{data.duration}</span>
            <span className="w-px h-8 bg-white/30" />
            <span>{data.location}</span>
            <span className="w-px h-8 bg-white/30" />
            <span>All Inclusive</span>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-px h-16 bg-gradient-to-t from-white to-transparent" />
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-6 py-24 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-24">
          
          {/* Left Column: Itinerary */}
          <div className="space-y-32">
            <div>
              <h2 className="text-sm uppercase tracking-[0.2em] text-stone-400 mb-12">The Journey</h2>
              
              <div className="space-y-24">
                {data.itinerary.map((day) => (
                  <div key={day.day} className="group">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-16">
                      <div className="md:w-32 shrink-0">
                        <span className="text-5xl font-serif italic text-stone-200 group-hover:text-stone-300 transition-colors">
                          0{day.day}
                        </span>
                        <p className="text-xs uppercase tracking-widest text-stone-500 mt-2">{day.date}</p>
                      </div>
                      
                      <div className="flex-1 space-y-12">
                        <h3 className="text-3xl md:text-4xl font-serif text-stone-800 leading-tight">
                          {day.title}
                        </h3>
                        
                        <div className="space-y-10 border-l border-stone-200 pl-8">
                          {day.activities.map((activity, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[37px] top-2 w-2 h-2 rounded-full bg-stone-500 outline outline-8 outline-[#FDFCFB]" />
                              <div className="space-y-2">
                                <div className="flex items-baseline gap-4">
                                  <span className="text-[10px] font-medium uppercase tracking-tighter text-stone-500">
                                    {activity.time}
                                  </span>
                                  <h4 className="text-lg font-medium text-stone-700">{activity.activity}</h4>
                                </div>
                                <p className="text-stone-600 max-w-2xl leading-relaxed text-balance">
                                  {activity.description}
                                </p>
                                {activity.location && (
                                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-stone-500">
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                                    {activity.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="bg-stone-50 p-8 rounded-2xl flex flex-col md:flex-row gap-8 justify-between">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block mb-2">Accommodation</span>
                            <span className="font-serif italic text-lg text-stone-700">{day.accommodation}</span>
                          </div>
                          <div className="md:text-right">
                            <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 block mb-2">Dining</span>
                            <span className="text-stone-600 italic text-sm">{day.meals}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Your Stays Section */}
            <div className="space-y-16">
              <h2 className="text-sm uppercase tracking-[0.2em] text-stone-400">Your Stays</h2>
              <div className="space-y-16">
                {data.accommodations.map((lodge) => (
                  <div key={lodge.id} className="group space-y-8">
                    <div className="relative h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl shadow-stone-200/50">
                      <Image
                        src={lodge.image}
                        alt={lodge.name}
                        fill
                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>
                    <div className="space-y-4 max-w-2xl">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">Featured Retreat</span>
                        <div className="h-px w-8 bg-stone-200" />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-stone-400">{lodge.location}</span>
                      </div>
                      <h3 className="text-3xl font-serif text-stone-800">{lodge.name}</h3>
                      <p className="text-stone-600 leading-relaxed italic text-balance">
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
              <div className="bg-white border border-stone-100 rounded-3xl p-10 shadow-sm">
                <div className="mb-10">
                  <TripMap data={data.mapData} />
                </div>

                <div className="pb-8 border-b border-stone-100 mb-8">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-stone-400 mb-6 font-medium">Trip Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-400">Duration</span>
                      <span className="font-medium">{data.duration}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-400">Destination</span>
                      <span className="font-medium italic">{data.location}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-stone-400">Pace</span>
                      <span className="font-medium">Curated</span>
                    </div>
                  </div>
                </div>

                <div className="pb-8 border-b border-stone-100 mb-8">
                  <h3 className="text-sm uppercase tracking-[0.2em] text-stone-400 mb-6 font-medium">Pricing</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-stone-400">Total Investment</span>
                      <span className="text-2xl font-serif text-stone-800">{data.pricing.total}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                      <span>Per Person</span>
                      <span>{data.pricing.perPerson}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 mb-10">
                  <div>
                    <h4 className="text-[11px] uppercase tracking-[0.2em] text-stone-500 mb-4 font-bold flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                      Inclusions
                    </h4>
                    <ul className="space-y-3">
                      {data.includedItems.map((item, i) => (
                        <li key={i} className="text-sm text-stone-600 flex items-start gap-3">
                          <span className="text-stone-400 font-bold">+</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <button className="w-full bg-stone-800 text-white rounded-xl py-5 px-8 text-sm uppercase tracking-[0.2em] hover:bg-stone-900 transition-colors font-medium">
                  Confirm Proposal
                </button>
                <p className="text-[10px] text-center text-stone-400 mt-6 italic">
                  Validity period: 10 days from receipt
                </p>
              </div>

              {/* Extra Info */}
              <div className="space-y-8 px-4">
                <div>
                  <h4 className="text-xs uppercase tracking-[0.2em] text-stone-800 mb-4 font-bold">Important Notes</h4>
                  <p className="text-sm text-stone-600 leading-relaxed mb-4 italic">
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
          from { transform: scale(1.1); opacity: 0; }
          to { transform: scale(1.05); opacity: 1; }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-reveal { animation: reveal 1.5s ease-out forwards; }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; opacity: 0; }
      `}</style>
    </div>
  );
}
