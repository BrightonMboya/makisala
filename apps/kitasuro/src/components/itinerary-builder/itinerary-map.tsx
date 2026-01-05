'use client';

import React, { useMemo } from 'react';
import {
  Map,
  MapRoute,
  MapMarker,
  MarkerContent,
  MarkerTooltip,
  MapControls,
} from '@repo/ui/map';
import type { BuilderDay as Day } from '@/types/itinerary-types';

interface ItineraryMapProps {
  days: Day[];
  className?: string;
}

export function ItineraryMap({ days, className }: ItineraryMapProps) {
  const route = useMemo(() => {
    const points: { name: string; coordinates: [number, number]; day: number }[] = [];

    // TODO: Fetch coordinates from database (nationalParks table should have coordinates)
    // For now, use default coordinates for Rwanda
    const defaultCoords: [number, number] = [30.0619, -1.9441]; // Kigali

    days.forEach((day) => {
      if (day.destination) {
        // Only add if not the same as the last point to avoid loops in the line drawing if staying multiple days
        const lastPoint = points[points.length - 1];
        if (!lastPoint || lastPoint.name !== day.destination) {
          points.push({
            name: day.destination,
            coordinates: defaultCoords, // TODO: Get from database
            day: day.dayNumber,
          });
        }
      }
    });
    return points;
  }, [days]);

  // Extract coordinates for the route line
  const routeCoordinates = useMemo(
    () => route.map((p) => p.coordinates),
    [route]
  );

  return (
    <div
      className={`h-[400px] w-full overflow-hidden rounded-xl border border-stone-200 shadow-inner ${className}`}
    >
      <Map
        center={[30.0, -2.0]} // Center of Rwanda
        zoom={7}
        minZoom={6}
        maxZoom={12}
      >
        <MapControls position="bottom-right" showZoom />

        {/* Route Line */}
        {routeCoordinates.length > 1 && (
          <MapRoute
            coordinates={routeCoordinates}
            color="#16A34A"
            width={3}
            opacity={0.9}
            dashArray={[4, 4]}
          />
        )}

        {/* Markers */}
        {route.map(({ name, coordinates, day }, index) => (
          <MapMarker
            key={`${name}-${index}`}
            longitude={coordinates[0]}
            latitude={coordinates[1]}
          >
            <MarkerContent>
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-600 text-[10px] font-bold text-white shadow-lg">
                {index + 1}
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <div className="text-xs font-medium">
                Day {day}: {name.replace(/-/g, ' ')}
              </div>
            </MarkerTooltip>
          </MapMarker>
        ))}
      </Map>
    </div>
  );
}
