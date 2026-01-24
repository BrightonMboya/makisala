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
import type { BuilderDay as Day, Location } from '@/types/itinerary-types';

interface ItineraryMapProps {
  days: Day[];
  className?: string;
  nationalParksMap?: Record<string, { name: string; latitude?: string | null; longitude?: string | null }>;
  startLocation?: Location;
  endLocation?: Location;
}

export function ItineraryMap({ days, className, nationalParksMap = {}, startLocation, endLocation }: ItineraryMapProps) {
  const route = useMemo(() => {
    const points: { name: string; coordinates: [number, number]; day: number }[] = [];

    days.forEach((day) => {
      if (day.destination) {
        // Only add if not the same as the last point to avoid loops in the line drawing if staying multiple days
        const lastPoint = points[points.length - 1];
        if (!lastPoint || lastPoint.name !== day.destination) {
          const park = nationalParksMap[day.destination];
          // All national parks must have coordinates in the database
          if (park?.longitude && park?.latitude) {
            points.push({
              name: park.name,
              coordinates: [parseFloat(park.longitude), parseFloat(park.latitude)],
              day: day.dayNumber,
            });
          }
        }
      }
    });
    return points;
  }, [days, nationalParksMap]);

  // Extract coordinates for the route line (including start/end)
  const routeCoordinates = useMemo(() => {
    const coords: [number, number][] = [];
    if (startLocation) coords.push(startLocation.coordinates);
    route.forEach((p) => coords.push(p.coordinates));
    if (endLocation) coords.push(endLocation.coordinates);
    return coords;
  }, [route, startLocation, endLocation]);

  // Calculate center based on all route points including start/end
  // Note: Default center is only used when no destinations are selected yet (initial empty state)
  const mapCenter = useMemo((): [number, number] => {
    const allCoords = [...routeCoordinates];
    if (allCoords.length === 0) return [30.0619, -1.9441];
    const lngs = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    return [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ];
  }, [routeCoordinates]);

  return (
    <div
      className={`h-[400px] w-full overflow-hidden rounded-xl border border-stone-200 shadow-inner ${className}`}
    >
      <Map
        center={mapCenter}
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

        {/* Start Location Marker */}
        {startLocation && (
          <MapMarker
            longitude={startLocation.coordinates[0]}
            latitude={startLocation.coordinates[1]}
          >
            <MarkerContent>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-md">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>
            </MarkerContent>
            <MarkerTooltip>
              <span className="text-xs font-medium">Start: {startLocation.name}</span>
            </MarkerTooltip>
          </MapMarker>
        )}

        {/* Destination Markers */}
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

        {/* End Location Marker */}
        {endLocation && (
          <MapMarker
            longitude={endLocation.coordinates[0]}
            latitude={endLocation.coordinates[1]}
          >
            <MarkerContent>
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-md">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
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
