/**
 * Web Mercator projection helpers for the print-surface static route map.
 *
 * The interactive route map (packages/ui map.tsx) is MapLibre/WebGL, which prints
 * blank because page.pdf() and URL->PDF engines can't rasterize a live GL canvas.
 * For print we swap in a baked raster basemap (Mapbox static images) and draw the
 * route line + numbered pins ourselves as an SVG/HTML overlay. Basemap and overlay
 * must share ONE projection or the pins drift off their points, so all of it flows
 * through the center/zoom computed here.
 *
 * Coordinates are [lng, lat] to match ItineraryData.mapData throughout the app.
 */

const TILE_SIZE = 256;

// Match the interactive map's clamp (Map bounds minZoom={4} maxZoom={12}).
const MIN_ZOOM = 4;
const MAX_ZOOM = 12;

export type LngLat = [number, number];

export type StaticMapPlan = {
  centerLng: number;
  centerLat: number;
  zoom: number;
  width: number;
  height: number;
  /** Project a coordinate to a { xPct, yPct } position (0..100) within the image. */
  project: (coord: LngLat) => { xPct: number; yPct: number };
};

function lngToWorldX(lng: number): number {
  return (lng + 180) / 360; // 0..1 across the world
}

function latToWorldY(lat: number): number {
  const clampedLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const s = Math.sin((clampedLat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); // 0..1, top to bottom
}

function worldYToLat(y: number): number {
  // Inverse of latToWorldY: sin(lat) = tanh(pi*(1 - 2y)).
  return (Math.asin(Math.tanh(Math.PI * (1 - 2 * y))) * 180) / Math.PI;
}

/**
 * Compute the center + zoom that frames every coordinate within a width x height
 * image, then return a projector for overlaying the route line and markers.
 */
export function planStaticMap(
  coords: LngLat[],
  width: number,
  height: number,
): StaticMapPlan {
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // ~20% padding on each side, mirroring the interactive map's bounds padding.
  const lngPad = (maxLng - minLng) * 0.2 || 0.5;
  const latPad = (maxLat - minLat) * 0.2 || 0.5;
  const west = minLng - lngPad;
  const east = maxLng + lngPad;
  const south = minLat - latPad;
  const north = maxLat + latPad;

  const centerLng = (west + east) / 2;
  const centerWorldY = (latToWorldY(north) + latToWorldY(south)) / 2;
  const centerLat = worldYToLat(centerWorldY);

  // Fit the padded bbox: largest zoom where the span still fits both dimensions.
  const worldSpanX = Math.abs(lngToWorldX(east) - lngToWorldX(west)) || 1e-6;
  const worldSpanY = Math.abs(latToWorldY(north) - latToWorldY(south)) || 1e-6;
  const zoomX = Math.log2(width / (TILE_SIZE * worldSpanX));
  const zoomY = Math.log2(height / (TILE_SIZE * worldSpanY));
  const rawZoom = Math.min(zoomX, zoomY);
  const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, rawZoom));

  const scale = TILE_SIZE * Math.pow(2, zoom);
  const centerPxX = lngToWorldX(centerLng) * scale;
  const centerPxY = latToWorldY(centerLat) * scale;

  const project = (coord: LngLat): { xPct: number; yPct: number } => {
    const px = width / 2 + (lngToWorldX(coord[0]) * scale - centerPxX);
    const py = height / 2 + (latToWorldY(coord[1]) * scale - centerPxY);
    return { xPct: (px / width) * 100, yPct: (py / height) * 100 };
  };

  return { centerLng, centerLat, zoom, width, height, project };
}

/**
 * Build a Mapbox Static Images URL for the basemap only (no overlay; the route
 * line and pins are drawn separately so they share planStaticMap's projection
 * exactly). `@2x` keeps it crisp at print DPI; logo/attribution are dropped for a
 * clean print surface. Same lng,lat,zoom convention as the projection above.
 *
 * (MapTiler's free plan blocks server-rendered static maps; Mapbox includes them.)
 */
export function mapboxBasemapUrl(
  plan: StaticMapPlan,
  token: string,
  style = 'light-v11',
): string {
  const { centerLng, centerLat, zoom, width, height } = plan;
  const z = Math.round(zoom * 100) / 100;
  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `${centerLng},${centerLat},${z}/${width}x${height}@2x` +
    `?access_token=${token}&attribution=false&logo=false`
  );
}
