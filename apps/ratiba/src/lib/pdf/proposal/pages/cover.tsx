import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import {
  Body,
  DisplayTitle,
  MetaItem,
  PAGE,
  PdfPage,
  LogoChip,
  Photo,
  SPACE,
  Scrim,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { travelerLabel } from '../helpers';

/**
 * Cover: a brand meta strip, a full-bleed hero carrying the title, and the
 * operator's opening letter.
 *
 * The hero is a fixed slab rather than a flex child — the letter beneath it runs
 * to whatever length the operator wrote, and a proportional hero would pump the
 * page as copy changes.
 */

const HERO_HEIGHT = 430;

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PAGE.marginX,
    paddingVertical: 10,
  },
  logo: { width: 62, height: 30, objectFit: 'contain' },
  meta: { flexDirection: 'row', gap: SPACE.lg },
  hero: { height: HERO_HEIGHT, position: 'relative' },
  heroOverlay: {
    position: 'absolute',
    left: PAGE.marginX,
    right: PAGE.marginX,
    bottom: 26,
  },
  quoteLine: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, marginBottom: SPACE.sm },
  quoteText: { fontFamily: 'Outfit', fontSize: TYPE.h2, fontWeight: 500 },
  letter: { paddingHorizontal: PAGE.marginX, paddingTop: SPACE.lg, gap: SPACE.md },
  signOff: { marginTop: SPACE.md, gap: 2 },
  contact: { flexDirection: 'row', alignItems: 'center', gap: SPACE.md, marginTop: SPACE.md },
  contactLines: { gap: 1 },
});

export interface CoverPageProps {
  data: ItineraryData;
  /** Operator's opening letter. Paragraphs are rendered in order. */
  letter?: string[];
}

export function CoverPage({ data, letter = [] }: CoverPageProps) {
  const { palette } = usePdfDoc();
  const org = data.organization;
  const overview = data.tripOverview;
  const travelers = travelerLabel(data);

  return (
    <PdfPage padded={false}>
      <View style={[styles.strip, { backgroundColor: palette.brandTint }]}>
        {org?.logoUrl ? (
          <LogoChip src={org.logoUrl} />
        ) : (
          <Text
            style={{
              fontFamily: 'Outfit',
              fontSize: TYPE.h2,
              fontWeight: 700,
              color: palette.brandDeep,
            }}
          >
            {org?.name ?? ''}
          </Text>
        )}
        <View style={styles.meta}>
          {overview?.tourType ? <MetaItem label="Tour Type" value={overview.tourType} /> : null}
          <MetaItem label="Tour Length" value={data.duration} />
          {overview?.travelDates?.start ? (
            <MetaItem label="Start Tour" value={overview.travelDates.start} />
          ) : null}
          {overview?.travelDates?.end ? (
            <MetaItem label="End Tour" value={overview.travelDates.end} />
          ) : null}
        </View>
      </View>

      <View style={styles.hero}>
        <Photo src={data.heroImage} style={{ width: '100%', height: '100%' }} />
        <Scrim height="65%" />
        <View style={styles.heroOverlay}>
          {data.clientName ? (
            <View style={styles.quoteLine}>
              <Text style={[styles.quoteText, { color: palette.onBrand }]}>
                Quote for {data.clientName}
              </Text>
              {travelers ? (
                <Text
                  style={{
                    fontFamily: 'Inter',
                    fontSize: TYPE.small,
                    color: palette.onBrand,
                    opacity: 0.85,
                  }}
                >
                  · {travelers}
                </Text>
              ) : null}
            </View>
          ) : null}
          <DisplayTitle size={TYPE.cover} color={palette.onBrand}>
            {data.title}
          </DisplayTitle>
        </View>
      </View>

      <View style={styles.letter}>
        {data.clientName ? (
          <Text
            style={{
              fontFamily: 'Inter',
              fontSize: TYPE.body,
              fontWeight: 600,
              color: palette.ink,
            }}
          >
            Dear {data.clientName},
          </Text>
        ) : null}
        {letter.map((paragraph, i) => (
          <Body key={i}>{paragraph}</Body>
        ))}

        <View style={styles.signOff}>
          <Body>We hope to hear from you soon.</Body>
          <Body>Best regards,</Body>
        </View>

        {org ? (
          <View style={styles.contact}>
            <LogoChip src={org.logoUrl ?? undefined} width={46} height={24} />
            <View style={styles.contactLines}>
              <Text
                style={{
                  fontFamily: 'Inter',
                  fontSize: TYPE.body,
                  fontWeight: 600,
                  color: palette.ink,
                }}
              >
                {org.name}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    </PdfPage>
  );
}
