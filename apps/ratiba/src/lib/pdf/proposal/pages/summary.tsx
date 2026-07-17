import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import {
  Body,
  DisplayTitle,
  Label,
  PAGE,
  PdfPage,
  Photo,
  Rule,
  SPACE,
  SectionLabel,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { hasRealAccommodation, mealLines } from '../helpers';

/**
 * Summary: the whole trip on one page — a day-by-day table beside the highlights.
 *
 * Deliberately the densest page in the document. It is the one page a client who
 * skims everything else still reads, so it has to stand alone.
 */

const HEADER_HEIGHT = 200;
const SIDEBAR_WIDTH = 168;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', height: HEADER_HEIGHT },
  headerText: {
    flex: 1,
    paddingHorizontal: PAGE.marginX,
    paddingVertical: 22,
    justifyContent: 'center',
    gap: SPACE.md,
  },
  headerPhoto: { width: 230, height: '100%' },
  dates: { flexDirection: 'row', gap: SPACE.lg },
  columns: { flexDirection: 'row', flex: 1 },
  main: { flex: 1, paddingHorizontal: PAGE.marginX, paddingTop: SPACE.lg, gap: SPACE.sm },
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.lg,
    gap: SPACE.md,
  },
  dayRow: { paddingVertical: SPACE.sm, gap: 3 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm },
  dayChip: { paddingVertical: 2, paddingHorizontal: 5, borderRadius: 2 },
  dayChipText: { fontFamily: 'Inter', fontSize: TYPE.micro, fontWeight: 600 },
  dayTitle: { fontFamily: 'Outfit', fontSize: TYPE.h3, fontWeight: 600 },
  detailRow: { flexDirection: 'row', gap: SPACE.sm },
  detailLabel: { width: 62 },
  detailValue: { flex: 1 },
  highlight: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  highlightMark: { width: 4, height: 4, marginTop: 4 },
});

export function SummaryPage({ data }: { data: ItineraryData }) {
  const { palette } = usePdfDoc();
  const overview = data.tripOverview;
  const destinations = overview?.destinations ?? [];

  return (
    <PdfPage padded={false}>
      <View style={[styles.header, { backgroundColor: palette.brandDeep }]}>
        <View style={styles.headerText}>
          <SectionLabel onDark>Summary</SectionLabel>
          <DisplayTitle size={TYPE.display} color={palette.onBrand}>
            {data.title}
          </DisplayTitle>
          <View style={styles.dates}>
            {overview?.travelDates?.start ? (
              <View style={{ gap: 2 }}>
                <Label color={palette.brandTint}>Start</Label>
                <Text style={{ fontFamily: 'Inter', fontSize: TYPE.small, color: palette.onBrand }}>
                  {overview.travelDates.start}
                  {overview.startCity ? `, ${overview.startCity}` : ''}
                </Text>
              </View>
            ) : null}
            {overview?.travelDates?.end ? (
              <View style={{ gap: 2 }}>
                <Label color={palette.brandTint}>End</Label>
                <Text style={{ fontFamily: 'Inter', fontSize: TYPE.small, color: palette.onBrand }}>
                  {overview.travelDates.end}
                  {overview.endCity ? `, ${overview.endCity}` : ''}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Photo src={data.heroImage} style={styles.headerPhoto} />
      </View>

      <View style={styles.columns}>
        <View style={styles.main}>
          <SectionLabel>Day by Day</SectionLabel>
          <View style={{ height: SPACE.xs }} />
          {data.itinerary.map((day) => (
            <View key={day.day} style={styles.dayRow} wrap={false}>
              <View style={styles.dayHead}>
                <View style={[styles.dayChip, { backgroundColor: palette.brand }]}>
                  <Text style={[styles.dayChipText, { color: palette.onBrand }]}>
                    Day {day.day}
                  </Text>
                </View>
                <Text style={[styles.dayTitle, { color: palette.ink }]}>
                  {day.destination || day.title}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Small color={palette.muted}>Stay</Small>
                </View>
                <View style={styles.detailValue}>
                  <Small color={palette.ink}>
                    {hasRealAccommodation(day) ? day.accommodation : 'No accommodation'}
                  </Small>
                </View>
              </View>
              <View style={styles.detailRow}>
                <View style={styles.detailLabel}>
                  <Small color={palette.muted}>Meals</Small>
                </View>
                <View style={styles.detailValue}>
                  <Small color={palette.ink}>{mealLines(day).join(' · ') || 'None'}</Small>
                </View>
              </View>
              <Rule style={{ marginTop: SPACE.sm }} />
            </View>
          ))}
        </View>

        <View style={[styles.sidebar, { backgroundColor: palette.brandTint }]}>
          <SectionLabel>Highlights</SectionLabel>
          <View style={{ gap: SPACE.sm }}>
            {destinations.map((destination) => (
              <View key={destination} style={styles.highlight}>
                <View style={[styles.highlightMark, { backgroundColor: palette.brand }]} />
                <View style={{ flex: 1 }}>
                  <Small color={palette.ink}>{destination}</Small>
                </View>
              </View>
            ))}
          </View>

          {data.subtitle ? (
            <>
              <Rule color={palette.hairline} />
              <Body style={{ fontSize: TYPE.small }}>{data.subtitle}</Body>
            </>
          ) : null}
        </View>
      </View>
    </PdfPage>
  );
}
