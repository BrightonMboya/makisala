import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Day, ItineraryData } from '@/types/itinerary-types';
import {
  Badge,
  Body,
  CONTENT_WIDTH,
  DisplayTitle,
  Label,
  PAGE,
  PdfPage,
  Photo,
  SPACE,
  Scrim,
  SectionLabel,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { PHOTO_TILE } from '../theme';
import { accommodationFor, groupByMoment, hasRealAccommodation, mealLines } from '../helpers';
import type { DayPhotoPlan } from '../helpers';

/** Decided up front by planAllDayPhotos; pages just read them. */
function usePhotoPlan(day: Day): DayPhotoPlan {
  const { photoPlans } = usePdfDoc();
  return photoPlans.get(day.day) ?? { intro: [], detail: [], gallery: [] };
}

/**
 * The day spread: a collage intro, a detail page pairing the lodge against the
 * day's activities, then any remaining photos as a gallery. Each day always opens
 * on a fresh page — a deliberate cost in paper, since days are how a client
 * navigates a proposal.
 */

const COLLAGE_HEIGHT = 250;
const BAR_HEIGHT = 40;

const styles = StyleSheet.create({
  collage: { height: COLLAGE_HEIGHT, flexDirection: 'row', gap: 2 },
  collageMain: { flex: 1.6, position: 'relative' },
  collageSide: { flex: 1, gap: 2 },
  collageSideTop: { flexDirection: 'row', gap: 2, flex: 1 },
  // A day with no photography: the collage overlay's type on a solid brand field.
  plainHead: {
    height: 150,
    justifyContent: 'flex-end',
    paddingHorizontal: PAGE.marginX,
    paddingBottom: 22,
  },
  collageOverlay: { position: 'absolute', left: PAGE.marginX, right: SPACE.md, bottom: 18 },
  dayLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: 4 },
  dayNumber: { fontFamily: 'Outfit', fontSize: TYPE.h2, fontWeight: 700 },
  dayDate: { fontFamily: 'Inter', fontSize: TYPE.small },
  bar: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: PAGE.marginX,
    gap: 1,
  },
  intro: {
    flexDirection: 'row',
    gap: SPACE.lg,
    paddingHorizontal: PAGE.marginX,
    paddingTop: SPACE.lg,
  },
  introText: { flex: 1 },
  introPhoto: { flex: 1, height: 150 },

  detailHead: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.lg },
  columns: { flexDirection: 'row', gap: SPACE.lg, flex: 1 },
  col: { flex: 1, gap: SPACE.sm },
  stackPhoto: { width: '100%', height: 118 },
  group: { gap: 3, marginBottom: SPACE.sm },
  activity: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25, marginTop: 4.5 },
  panel: { padding: SPACE.md, gap: SPACE.sm, marginTop: SPACE.sm },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACE.sm },
  gridCell: {
    width: (CONTENT_WIDTH - SPACE.sm * (PHOTO_TILE.columns - 1)) / PHOTO_TILE.columns,
    height: PHOTO_TILE.height,
  },
});

function DayEyebrow({ day, onDark }: { day: Day; onDark?: boolean }) {
  const { palette } = usePdfDoc();
  const color = onDark ? palette.onBrand : palette.brand;
  return (
    <View style={styles.dayLine}>
      <View style={{ width: 22, height: 1, backgroundColor: color }} />
      <Text style={[styles.dayNumber, { color }]}>Day {day.day}</Text>
      <Text style={[styles.dayDate, { color: onDark ? palette.brandTint : palette.muted }]}>
        {day.date}
      </Text>
    </View>
  );
}

/** Collage intro: the destination, day title, lodge bar, and day description. */
export function DayIntroPage({ data, day }: { data: ItineraryData; day: Day }) {
  const { palette } = usePdfDoc();
  const photos = usePhotoPlan(day).intro;
  const [lead, ...rest] = photos;

  // Photo's placeholder is for one failed fetch among many; across a whole page it
  // reads as broken rather than as "no photo", so a photo-less day (usually the
  // last) gets a typographic header instead.
  const hasPhotos = photos.length > 0;

  return (
    <PdfPage padded={false}>
      {hasPhotos ? (
        <View style={styles.collage}>
          <View style={styles.collageMain}>
            <Photo src={lead} style={{ width: '100%', height: '100%' }} />
            <Scrim height="70%" />
            <View style={styles.collageOverlay}>
              <DayEyebrow day={day} onDark />
              <DisplayTitle size={TYPE.display} color={palette.onBrand}>
                {day.destination || day.title}
              </DisplayTitle>
            </View>
          </View>
          {rest.length > 0 ? (
            <View style={styles.collageSide}>
              <View style={styles.collageSideTop}>
                <Photo src={rest[0]} style={{ flex: 1, height: '100%' }} />
                {rest[1] ? <Photo src={rest[1]} style={{ flex: 1, height: '100%' }} /> : null}
              </View>
              {rest[2] ? <Photo src={rest[2]} style={{ flex: 1, width: '100%' }} /> : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.plainHead, { backgroundColor: palette.brandDeep }]}>
          <DayEyebrow day={day} onDark />
          <DisplayTitle size={TYPE.display} color={palette.onBrand}>
            {day.destination || day.title}
          </DisplayTitle>
        </View>
      )}

      {hasRealAccommodation(day) ? (
        <View style={[styles.bar, { backgroundColor: palette.brand }]}>
          <Label color={palette.brandTint}>Accommodation</Label>
          <Text
            style={{
              fontFamily: 'Outfit',
              fontSize: TYPE.h1,
              fontWeight: 600,
              color: palette.onBrand,
            }}
          >
            {day.accommodation}
          </Text>
        </View>
      ) : null}

      {day.description ? (
        <View style={styles.intro}>
          <View style={styles.introText}>
            <Body>{day.description}</Body>
          </View>
          {/* Guarded: without it a photo-less day renders an empty captioned frame. */}
          {photos[1] ? (
            <Photo
              src={photos[1]}
              style={styles.introPhoto}
              caption={day.destination || undefined}
            />
          ) : null}
        </View>
      ) : null}
    </PdfPage>
  );
}

/** Detail: the lodge on the left, the day's activities on the right. */
export function DayDetailPage({ data, day }: { data: ItineraryData; day: Day }) {
  const { palette } = usePdfDoc();
  const accommodation = accommodationFor(data, day);
  const groups = groupByMoment(day.activities);
  const meals = mealLines(day);
  const photos = usePhotoPlan(day).detail;
  const alternatives = day.accommodationAlternatives ?? [];

  return (
    <PdfPage>
      <View style={styles.detailHead}>
        <View style={{ width: 22, height: 1, backgroundColor: palette.brand }} />
        <Text style={[styles.dayNumber, { color: palette.brand }]}>Day {day.day}</Text>
        <Text style={[styles.dayDate, { color: palette.muted }]}>{day.date}</Text>
      </View>

      <View style={styles.columns}>
        <View style={styles.col}>
          {hasRealAccommodation(day) ? (
            <>
              <SectionLabel>Accommodation</SectionLabel>
              <Text
                style={{
                  fontFamily: 'Outfit',
                  fontSize: TYPE.h1,
                  fontWeight: 600,
                  color: palette.ink,
                }}
              >
                {day.accommodation}
              </Text>
              {accommodation?.location ? <Badge>{accommodation.location}</Badge> : null}
              {accommodation?.description ? <Body>{accommodation.description}</Body> : null}
              {alternatives.length > 0 ? (
                <View
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: SPACE.sm,
                    backgroundColor: palette.brandTint,
                    marginTop: 2,
                  }}
                >
                  <Small color={palette.brandDeep}>
                    {alternatives.length} alternative{alternatives.length === 1 ? '' : 's'} for this
                    night. See Alternative Accommodations.
                  </Small>
                </View>
              ) : null}
              {photos.map((url) => (
                <Photo key={url} src={url} style={styles.stackPhoto} tag={day.accommodation} />
              ))}
            </>
          ) : (
            <>
              <SectionLabel>Accommodation</SectionLabel>
              <Body>No accommodation on this night.</Body>
            </>
          )}
        </View>

        <View style={styles.col}>
          <SectionLabel>Activities</SectionLabel>
          <View style={{ height: SPACE.xs }} />
          {groups.map((group, i) => (
            <View key={`${group.moment}-${i}`} style={styles.group} wrap={false}>
              {group.moment ? (
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: TYPE.small,
                    fontWeight: 700,
                    color: palette.ink,
                  }}
                >
                  {group.moment}
                </Text>
              ) : null}
              {group.activities.map((activity, j) => (
                <View key={j} style={styles.activity}>
                  <View style={[styles.dot, { backgroundColor: palette.brand }]} />
                  <View style={{ flex: 1 }}>
                    <Body>{activity.description || activity.activity}</Body>
                    {activity.location ? <Small>{activity.location}</Small> : null}
                  </View>
                </View>
              ))}
            </View>
          ))}

          {meals.length > 0 ? (
            <View wrap={false}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: TYPE.small,
                  fontWeight: 700,
                  color: palette.ink,
                  marginTop: SPACE.sm,
                  marginBottom: 3,
                }}
              >
                Meal Plan: Day {day.day}
              </Text>
              {meals.map((meal) => (
                <View key={meal} style={styles.activity}>
                  <View style={[styles.dot, { backgroundColor: palette.brand }]} />
                  <View style={{ flex: 1 }}>
                    <Body>{meal}</Body>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </PdfPage>
  );
}

/**
 * Remaining lodge photography. Renders nothing when the intro and detail pages
 * already used everything, so short proposals don't grow filler pages.
 */
export function DayGalleryPage({ day }: { day: Day }) {
  const photos = usePhotoPlan(day).gallery;
  if (photos.length === 0) return null;
  return (
    <PdfPage>
      <View style={styles.detailHead}>
        <DayEyebrow day={day} />
      </View>
      {/* No per-tile tag: every photo is the same lodge, named on the pages before. */}
      <View style={styles.grid}>
        {photos.map((url) => (
          <Photo key={url} src={url} style={styles.gridCell} />
        ))}
      </View>
    </PdfPage>
  );
}
