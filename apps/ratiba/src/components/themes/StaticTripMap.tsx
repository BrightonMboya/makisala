import { env } from '@/lib/env';
import {
  planStaticMap,
  mapboxBasemapUrl,
  type LngLat,
} from '@/lib/static-map';
import type { ItineraryData } from '@/types/itinerary-types';

/**
 * Print-only route map. Renders a baked MapTiler basemap with the route line and
 * numbered pins drawn as an overlay, so it prints identically in every engine
 * (unlike the WebGL TripMap, which prints blank). Visuals mirror TripMap's pins.
 *
 * Design canvas: a wide banner. planStaticMap projects into this exact box, and
 * the overlay is positioned in percentages, so it scales with the rendered width.
 */

// Logical canvas at 8:3 banner aspect. MapTiler renders this at @2x (2048x768),
// which stays under its 2048px/side static-map limit and is crisp at print DPI.
// The overlay is percentage-based, so only the aspect ratio has to match the box.
const MAP_W = 1024;
const MAP_H = 384;

export function StaticTripMap({ data }: { data: ItineraryData['mapData'] }) {
  const { locations, startLocation, endLocation } = data;

  if (!locations || locations.length === 0) {
    return (
      <div
        data-print-map
        className="relative flex aspect-[8/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-stone-100/50 bg-stone-50"
      >
        <p className="text-sm text-stone-400">Map data not available</p>
      </div>
    );
  }

  // Route order matches TripMap: start, then destinations, then end.
  const routeCoords: LngLat[] = [
    ...(startLocation ? [startLocation.coordinates as LngLat] : []),
    ...locations.map((l) => l.coordinates as LngLat),
    ...(endLocation ? [endLocation.coordinates as LngLat] : []),
  ];

  const plan = planStaticMap(routeCoords, MAP_W, MAP_H);
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const basemapUrl = token ? mapboxBasemapUrl(plan, token) : null;

  const points = routeCoords.map((c) => plan.project(c));
  const polyline = points.map((p) => `${p.xPct},${p.yPct}`).join(' ');

  return (
    <div
      data-print-map
      className="relative aspect-[8/3] w-full overflow-hidden rounded-2xl border border-stone-100/50 bg-stone-50"
    >
      <div className="absolute top-4 left-4 z-20">
        <h3 className="text-[10px] font-bold tracking-[0.2em] text-stone-400 uppercase">
          Route Map
        </h3>
      </div>

      {basemapUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={basemapUrl}
          alt="Route map"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Route line, in the same 0..100 coordinate space as the pins. */}
      {routeCoords.length > 1 && (
        <svg
          className="absolute inset-0 z-10 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <polyline
            points={polyline}
            fill="none"
            stroke="#A8A29E"
            strokeWidth={0.35}
            strokeDasharray="0.8 0.8"
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.9}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* Start pin */}
      {startLocation && (
        <Pin pos={plan.project(startLocation.coordinates as LngLat)}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-green-600 text-[8px] font-bold text-white shadow-md">
            GO
          </div>
        </Pin>
      )}

      {/* Numbered destination pins */}
      {locations.map((loc, idx) => (
        <Pin key={loc.name} pos={plan.project(loc.coordinates as LngLat)}>
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-stone-800 text-[9px] font-bold text-white shadow-md">
            {idx + 1}
          </div>
        </Pin>
      ))}

      {/* End pin */}
      {endLocation && (
        <Pin pos={plan.project(endLocation.coordinates as LngLat)}>
          <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-600 text-[8px] font-bold text-white shadow-md">
            END
          </div>
        </Pin>
      )}
    </div>
  );
}

function Pin({
  pos,
  children,
}: {
  pos: { xPct: number; yPct: number };
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${pos.xPct}%`, top: `${pos.yPct}%` }}
    >
      {children}
    </div>
  );
}
