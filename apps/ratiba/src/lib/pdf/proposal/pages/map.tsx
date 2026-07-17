import { StyleSheet, Svg, Polyline, Text, View } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import { mapboxBasemapUrl, planStaticMap, type LngLat, type StaticMapPlan } from '@/lib/static-map';
import { env } from '@/lib/env';
import {
  DisplayTitle,
  Label,
  PdfPage,
  Photo,
  Rule,
  SPACE,
  SectionLabel,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { hasRealAccommodation } from '../helpers';

/**
 * Map: the route as a baked basemap with the line and pins drawn over it.
 *
 * Shares planStaticMap/mapboxBasemapUrl with the themes, so basemap and
 * overlay resolve through one projection and the pins can't drift off their points.
 */

// This map owns most of a portrait page, so it runs taller than a banner crop.
// rather than sitting in a scroll, and a wide slot wastes the sheet. Mapbox caps a
// static image side at 1280px, so 1024 renders @2x under the limit while staying
// crisp at print DPI.
const MAP_W = 1024;
const MAP_H = 768;

// A safari route is read against terrain and parks, which the default light basemap
// flattens into grey. Outdoors keeps the relief and protected-area shading.
const MAP_STYLE = 'outdoors-v12';

function routeCoords(mapData: ItineraryData['mapData']): LngLat[] {
  return [
    ...(mapData.startLocation ? [mapData.startLocation.coordinates as LngLat] : []),
    ...mapData.locations.map((l) => l.coordinates as LngLat),
    ...(mapData.endLocation ? [mapData.endLocation.coordinates as LngLat] : []),
  ];
}

/**
 * The basemap URL for a proposal, or null when there's nothing to draw or no token.
 *
 * Exported so the image planner can request the same URL the page will read back
 * out of the ImageBook — it must be byte-identical or the lookup misses.
 */
export function mapImageUrl(data: ItineraryData): string | null {
  const coords = routeCoords(data.mapData);
  if (coords.length === 0) return null;
  const token = env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;
  return mapboxBasemapUrl(planStaticMap(coords, MAP_W, MAP_H), token, MAP_STYLE);
}

const styles = StyleSheet.create({
  map: { width: '100%', aspectRatio: MAP_W / MAP_H, position: 'relative' },
  pin: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  pinText: { fontFamily: 'Inter', fontSize: 5.5, fontWeight: 700 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  legendDay: { width: 46 },
  legendPlace: { flex: 1 },
  legendStay: { flex: 1.2 },
});

function Pin({
  plan,
  coord,
  label,
  background,
  size = 13,
}: {
  plan: StaticMapPlan;
  coord: LngLat;
  label: string;
  background: string;
  size?: number;
}) {
  const { palette } = usePdfDoc();
  const { xPct, yPct } = plan.project(coord);
  return (
    <View
      style={[
        styles.pin,
        {
          left: `${xPct}%`,
          top: `${yPct}%`,
          // Percentage offsets resolve against the parent, so the pin is centred on
          // its point by pulling back half its own size.
          marginLeft: -size / 2,
          marginTop: -size / 2,
          width: size,
          height: size,
          backgroundColor: background,
          borderWidth: 1.25,
          borderColor: palette.paper,
        },
      ]}
    >
      <Text style={[styles.pinText, { color: palette.onBrand }]}>{label}</Text>
    </View>
  );
}

export function MapPage({ data }: { data: ItineraryData }) {
  const { palette } = usePdfDoc();
  const coords = routeCoords(data.mapData);
  if (coords.length === 0) return null;

  const plan = planStaticMap(coords, MAP_W, MAP_H);
  const url = mapImageUrl(data);
  const polyline = coords
    .map((c) => {
      const { xPct, yPct } = plan.project(c);
      return `${xPct},${yPct}`;
    })
    .join(' ');

  return (
    <PdfPage>
      <SectionLabel>Map</SectionLabel>
      <View style={{ height: SPACE.sm }} />
      <DisplayTitle>Route overview per day</DisplayTitle>
      <View style={{ height: SPACE.lg }} />

      <View style={styles.map}>
        <Photo src={url ?? undefined} style={{ width: '100%', height: '100%' }} />

        {coords.length > 1 ? (
          <Svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <Polyline
              points={polyline}
              fill="none"
              stroke={palette.brandDeep}
              strokeWidth={0.35}
              strokeDasharray="0.9 0.9"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </Svg>
        ) : null}

        {data.mapData.startLocation ? (
          <Pin
            plan={plan}
            coord={data.mapData.startLocation.coordinates as LngLat}
            label="GO"
            background={palette.brandDeep}
            size={16}
          />
        ) : null}
        {data.mapData.locations.map((location, index) => (
          <Pin
            key={location.name}
            plan={plan}
            coord={location.coordinates as LngLat}
            label={String(index + 1)}
            background={palette.brand}
          />
        ))}
        {data.mapData.endLocation ? (
          <Pin
            plan={plan}
            coord={data.mapData.endLocation.coordinates as LngLat}
            label="END"
            background={palette.ink}
            size={16}
          />
        ) : null}
      </View>

      <View style={{ height: SPACE.lg }} />

      {data.mapData.startLocation ? (
        <View style={styles.legendRow}>
          <View style={styles.legendDay}>
            <Label>Start</Label>
          </View>
          <View style={styles.legendPlace}>
            <Small color={palette.ink}>{data.mapData.startLocation.name}</Small>
          </View>
          <View style={styles.legendStay} />
        </View>
      ) : null}

      <Rule />
      <View style={styles.legendRow}>
        <View style={styles.legendDay}>
          <Label>Day</Label>
        </View>
        <View style={styles.legendPlace}>
          <Label>Destination</Label>
        </View>
        <View style={styles.legendStay}>
          <Label>Accommodation</Label>
        </View>
      </View>
      <Rule />

      {data.itinerary.map((day) => (
        <View key={day.day} style={styles.legendRow}>
          <View style={styles.legendDay}>
            <Small color={palette.muted}>Day {day.day}</Small>
          </View>
          <View style={styles.legendPlace}>
            <Small color={palette.ink}>{day.destination || day.title}</Small>
          </View>
          <View style={styles.legendStay}>
            <Small color={palette.body}>
              {hasRealAccommodation(day) ? day.accommodation : 'No accommodation'}
            </Small>
          </View>
        </View>
      ))}

      {data.mapData.endLocation ? (
        <>
          <Rule />
          <View style={styles.legendRow}>
            <View style={styles.legendDay}>
              <Label>End</Label>
            </View>
            <View style={styles.legendPlace}>
              <Small color={palette.ink}>{data.mapData.endLocation.name}</Small>
            </View>
            <View style={styles.legendStay} />
          </View>
        </>
      ) : null}
    </PdfPage>
  );
}
