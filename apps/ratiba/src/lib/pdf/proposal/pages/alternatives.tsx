import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import {
  CONTENT_WIDTH,
  DisplayTitle,
  Label,
  PdfPage,
  Photo,
  Rule,
  SPACE,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { PHOTO_TILE } from '../theme';
import { accommodationFor, alternativePhotos, hasRealAccommodation } from '../helpers';

/**
 * Alternative Accommodations: each night's booked lodge with the swaps available
 * against it, and what each swap costs.
 *
 * Kept as one section at the back rather than inline per day: it's a decision the
 * client makes across the whole trip, and inlining it interrupts the day narrative.
 */

const styles = StyleSheet.create({
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: SPACE.sm,
  },
  // Horizontal padding matches the day header and the alternative rows, so every
  // thumb in the section shares one left edge. The booked row has no panel behind
  // it, so without this it alone sits flush to the page margin.
  booked: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
    paddingVertical: SPACE.sm,
    paddingHorizontal: SPACE.sm,
  },
  thumb: { width: 66, height: 44 },
  altBlock: { marginTop: 4 },
  altRow: {
    flexDirection: 'row',
    gap: SPACE.sm,
    alignItems: 'center',
    padding: SPACE.sm,
  },
  // No horizontal inset: the tiles have to match the day gallery's exactly, which
  // means spanning the same content width the gallery page does.
  strip: { flexDirection: 'row', gap: SPACE.sm, paddingBottom: SPACE.sm },
  stripPhoto: {
    width: (CONTENT_WIDTH - SPACE.sm * (PHOTO_TILE.columns - 1)) / PHOTO_TILE.columns,
    height: PHOTO_TILE.height,
  },
  altBody: { flex: 1, gap: 1 },
  price: { alignItems: 'flex-end' },
  detail: { flexDirection: 'row', gap: 4 },
});

/** The strip laid out in the shared grid's rows. */
function photoRows(photos: string[]): string[][] {
  const rows: string[][] = [];
  for (let i = 0; i < photos.length; i += PHOTO_TILE.columns) {
    rows.push(photos.slice(i, i + PHOTO_TILE.columns));
  }
  return rows;
}

export function AlternativesPage({ data }: { data: ItineraryData }) {
  const { palette } = usePdfDoc();

  const days = data.itinerary.filter(
    (day) => hasRealAccommodation(day) && (day.accommodationAlternatives?.length ?? 0) > 0,
  );
  if (days.length === 0) return null;

  return (
    <PdfPage>
      <DisplayTitle>Alternative Accommodations</DisplayTitle>
      <View style={{ height: SPACE.lg }} />

      {days.map((day) => {
        const alternatives = day.accommodationAlternatives ?? [];
        return (
          // Wraps: a night's photo strips can outgrow a page, and react-pdf clips an
          // over-long wrap={false} block rather than flowing it, silently dropping
          // alternatives. Each row keeps itself intact instead.
          <View key={day.day} style={{ marginBottom: SPACE.lg }}>
            <View style={[styles.dayHeader, { backgroundColor: palette.brand }]}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: TYPE.small,
                  fontWeight: 600,
                  color: palette.onBrand,
                }}
              >
                Accommodation · Day {day.day}
              </Text>
              <Small color={palette.brandTint}>{day.destination ?? ''}</Small>
            </View>

            <View style={styles.booked}>
              <Photo src={accommodationFor(data, day)?.image} style={styles.thumb} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: 'Outfit',
                    fontSize: TYPE.h2,
                    fontWeight: 600,
                    color: palette.ink,
                  }}
                >
                  {day.accommodation}
                </Text>
                <Small>Meal Plan: {day.meals}</Small>
              </View>
              <Label>Booked</Label>
            </View>
            <Rule />

            {alternatives.map((alternative, i) => {
              const [lead, ...strip] = alternativePhotos(alternative);
              const rows = photoRows(strip);
              return (
                <View
                  key={i}
                  style={[styles.altBlock, { backgroundColor: palette.paperWarm }]}
                  wrap={false}
                >
                  <View style={styles.altRow}>
                    <Photo src={lead} style={styles.thumb} />
                    <View style={styles.altBody}>
                      <Text
                        style={{
                          fontFamily: 'Outfit',
                          fontSize: TYPE.h3,
                          fontWeight: 600,
                          color: palette.ink,
                        }}
                      >
                        {alternative.name}
                      </Text>
                      {alternative.rooms ? (
                        <View style={styles.detail}>
                          <Small color={palette.muted}>Rooms:</Small>
                          <Small color={palette.body}>{alternative.rooms}</Small>
                        </View>
                      ) : null}
                      {alternative.meals ? (
                        <View style={styles.detail}>
                          <Small color={palette.muted}>Meal Plan:</Small>
                          <Small color={palette.body}>{alternative.meals}</Small>
                        </View>
                      ) : null}
                    </View>
                    {alternative.priceLabel ? (
                      <View style={styles.price}>
                        <Text
                          style={{
                            fontFamily: 'Outfit',
                            fontSize: TYPE.h2,
                            fontWeight: 700,
                            color: palette.brand,
                          }}
                        >
                          {alternative.priceLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {rows.map((row, r) => (
                    <View key={r} style={styles.strip}>
                      {row.map((url) => (
                        <Photo key={url} src={url} style={styles.stripPhoto} />
                      ))}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        );
      })}
    </PdfPage>
  );
}
