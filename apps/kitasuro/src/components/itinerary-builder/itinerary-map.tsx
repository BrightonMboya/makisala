'use client'

import React, { useMemo } from 'react'
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
    ZoomableGroup
} from "react-simple-maps"
import { destinationDetails } from '@/lib/data/itinerary-data'
import { Day } from './builder-context'

// Rwanda is roughly 28.8E to 30.9E longitude, and 1S to 2.9S latitude.
// We can use a geoCentroid or specific projection config.
// For Rwanda, rotating to [-30, 2] and scaling up works.

const geoUrl = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/rwanda/rwanda-districts.json"

interface ItineraryMapProps {
    days: Day[]
    className?: string
}

export function ItineraryMap({ days, className }: ItineraryMapProps) {
    const route = useMemo(() => {
        const uniqueDestinations = new Set<string>()
        const points: { name: string; coordinates: [number, number], day: number }[] = []

        days.forEach(day => {
            if (day.destination && destinationDetails[day.destination]) {
                const { coordinates } = destinationDetails[day.destination]
                // Only add if not the same as the last point to avoid loops in the line drawing if staying multiple days
                const lastPoint = points[points.length - 1]
                if (!lastPoint || lastPoint.name !== day.destination) {
                     points.push({
                        name: day.destination,
                        coordinates: [coordinates.lng, coordinates.lat],
                        day: day.dayNumber
                    })
                }
            }
        })
        return points
    }, [days])

    return (
        <div className={`w-full h-[400px] bg-sky-50 rounded-xl overflow-hidden shadow-inner border border-stone-200 ${className}`}>
            <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                    scale: 30000, 
                    center: [30.0, -2.0] // Center of Rwanda roughly
                }}
                className="w-full h-full"
            >
                <ZoomableGroup>
                    <Geographies geography={geoUrl}>
                        {({ geography }) =>
                            geography.map((geo: any) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#E5E7EB" // stone-200
                                    stroke="#D6D3D1" // stone-300
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#D1D5DB", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {/* Route Line */}
                    {route.length > 1 && (
                        <Line
                            coordinates={route.map(p => p.coordinates)}
                            stroke="#16A34A" // green-600
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeDasharray="4 4" // Dashed line for safari route feel
                        />
                    )}

                    {/* Markers */}
                    {route.map(({ name, coordinates, day }, index) => (
                        <Marker key={`${name}-${index}`} coordinates={coordinates}>
                            <circle r={6} fill="#16A34A" stroke="#fff" strokeWidth={2} />
                            <text
                                textAnchor="middle"
                                y={-10}
                                style={{ 
                                    fontFamily: 'system-ui', 
                                    fontSize: 8, 
                                    fill: "#374151", 
                                    fontWeight: 'bold',
                                    textShadow: "0px 0px 3px white"
                                }}
                            >
                                {destinationDetails[name]?.description ? name.replace(/-/g, ' ').toUpperCase() : name}
                            </text>
                        </Marker>
                    ))}
                </ZoomableGroup>
            </ComposableMap>
        </div>
    )
}
