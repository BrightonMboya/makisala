import { Link, StyleSheet, Text, View } from '@react-pdf/renderer';
import { env } from '@/lib/env';
import type { ItineraryData } from '@/types/itinerary-types';
import {
  Body,
  DisplayTitle,
  Label,
  MetaItem,
  PAGE,
  PdfPage,
  Rule,
  SPACE,
  SectionLabel,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';
import { travelerLabel } from '../helpers';

/**
 * Pricing: the costed breakdown against what is and isn't included. Inclusions are
 * the most disputed part of a safari quote, so they get a full sidebar.
 */

const SIDEBAR_WIDTH = 186;
const HEADER_HEIGHT = 128;

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    paddingHorizontal: PAGE.marginX,
    justifyContent: 'center',
    gap: SPACE.sm,
  },
  meta: { flexDirection: 'row', gap: SPACE.lg, marginTop: 2 },
  columns: { flexDirection: 'row', flex: 1 },
  main: { flex: 1, paddingHorizontal: PAGE.marginX, paddingTop: SPACE.lg },
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingHorizontal: SPACE.md,
    paddingTop: SPACE.lg,
    gap: SPACE.sm,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 5 },
  rowLabel: { flex: 1 },
  rowQty: { width: 62, textAlign: 'right' },
  rowTotal: { width: 62, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline',
    gap: SPACE.md,
    marginTop: SPACE.md,
    marginBottom: 2,
  },
  listItem: { flexDirection: 'row', gap: SPACE.sm, alignItems: 'flex-start' },
  dot: { width: 2.5, height: 2.5, borderRadius: 1.25, marginTop: 4.5 },
  cta: {
    marginTop: SPACE.lg,
    paddingVertical: 9,
    paddingHorizontal: SPACE.lg,
    alignSelf: 'flex-start',
    textDecoration: 'none',
  },
  ctaText: { fontFamily: 'Outfit', fontSize: TYPE.body, fontWeight: 600 },
});

/** Absolute: a downloaded PDF has no origin to resolve a relative path against. */
function bookingUrl(id: string): string {
  return `${env.NEXT_PUBLIC_APP_URL}/proposal/${id}/book`;
}

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function List({ title, items }: { title: string; items: string[] }) {
  const { palette } = usePdfDoc();
  if (items.length === 0) return null;
  return (
    <View style={{ gap: SPACE.sm }}>
      <Text
        style={{ fontFamily: 'Outfit', fontSize: TYPE.h2, fontWeight: 600, color: palette.ink }}
      >
        {title}
      </Text>
      {items.map((item, i) => (
        <View key={i} style={styles.listItem}>
          <View style={[styles.dot, { backgroundColor: palette.brand }]} />
          <View style={{ flex: 1 }}>
            <Small color={palette.body}>{item}</Small>
          </View>
        </View>
      ))}
    </View>
  );
}

export function PricingPage({ data }: { data: ItineraryData }) {
  const { palette } = usePdfDoc();
  const { pricing } = data;
  const overview = data.tripOverview;
  const travelers = travelerLabel(data);
  const breakdown = pricing.breakdown ?? [];
  const extras = pricing.extras ?? [];

  return (
    <PdfPage padded={false}>
      <View style={[styles.header, { backgroundColor: palette.brandDeep }]}>
        <SectionLabel onDark>Pricing</SectionLabel>
        <DisplayTitle color={palette.onBrand}>
          {data.clientName ? `Proposal for ${data.clientName}` : 'Proposal'}
        </DisplayTitle>
        <View style={styles.meta}>
          <MetaItem label="Tour Length" value={data.duration} onDark />
          {overview?.travelDates?.start ? (
            <MetaItem label="Start Tour" value={overview.travelDates.start} onDark />
          ) : null}
          {overview?.travelDates?.end ? (
            <MetaItem label="End Tour" value={overview.travelDates.end} onDark />
          ) : null}
          {travelers ? <MetaItem label="Travelers" value={travelers} onDark /> : null}
        </View>
      </View>

      <View style={styles.columns}>
        <View style={styles.main}>
          <SectionLabel>Breakdown of Costs</SectionLabel>
          <View style={{ height: SPACE.md }} />
          <Rule />
          {breakdown.map((row, i) => (
            <View key={i}>
              <View style={styles.row}>
                <View style={styles.rowLabel}>
                  <Text
                    style={{
                      fontFamily: 'Inter',
                      fontSize: TYPE.body,
                      fontWeight: 600,
                      color: palette.ink,
                    }}
                  >
                    {row.label}
                  </Text>
                </View>
                <View style={styles.rowQty}>
                  <Small color={palette.muted}>
                    {row.quantity}x {money(row.unitPrice, pricing.currency)}
                  </Small>
                </View>
                <View style={styles.rowTotal}>
                  <Small color={palette.ink}>{money(row.lineTotal, pricing.currency)}</Small>
                </View>
              </View>
              <Rule />
            </View>
          ))}

          <View style={styles.totalRow}>
            <Text
              style={{
                fontFamily: 'Outfit',
                fontSize: TYPE.h2,
                fontWeight: 600,
                color: palette.ink,
              }}
            >
              Total in {pricing.currency}
            </Text>
            <Text
              style={{
                fontFamily: 'Outfit',
                fontSize: TYPE.h1,
                fontWeight: 700,
                color: palette.brand,
              }}
            >
              {pricing.total}
            </Text>
          </View>
          {pricing.perPerson ? (
            <View style={{ alignItems: 'flex-end' }}>
              <Small>{pricing.perPerson} per person</Small>
            </View>
          ) : null}

          {extras.length > 0 ? (
            <View style={{ marginTop: SPACE.xl, gap: SPACE.sm }}>
              <SectionLabel>Optional, not included</SectionLabel>
              <View style={{ height: SPACE.xs }} />
              <Rule />
              {extras.map((extra, i) => (
                <View key={i}>
                  <View style={styles.row}>
                    <View style={styles.rowLabel}>
                      <Small color={palette.ink}>{extra.label}</Small>
                    </View>
                    <View style={{ width: 120, alignItems: 'flex-end' }}>
                      <Text
                        style={{
                          fontFamily: 'Inter',
                          fontSize: TYPE.small,
                          fontWeight: 600,
                          color: palette.ink,
                        }}
                      >
                        {extra.price}
                      </Text>
                      {extra.unit ? <Small>{extra.unit}</Small> : null}
                    </View>
                  </View>
                  <Rule />
                </View>
              ))}
            </View>
          ) : null}

          <Link src={bookingUrl(data.id)} style={[styles.cta, { backgroundColor: palette.brand }]}>
            <Text style={[styles.ctaText, { color: palette.onBrand }]}>Confirm Proposal</Text>
          </Link>
          <View style={{ marginTop: SPACE.xs }}>
            <Small color={palette.muted}>Opens your proposal online to confirm these dates.</Small>
          </View>
        </View>

        <View style={[styles.sidebar, { backgroundColor: palette.brandTint }]}>
          <List title="Included" items={data.includedItems} />
          {data.excludedItems.length > 0 ? <View style={{ height: SPACE.md }} /> : null}
          <List title="Excluded" items={data.excludedItems} />
        </View>
      </View>
    </PdfPage>
  );
}

/**
 * Payment terms, on their own sheet. Operators paste full booking conditions here
 * and they routinely run past a page, so this flows full-width rather than sitting
 * in a column. Nothing here may be wrap={false}: react-pdf clips an over-long
 * unwrappable block, which silently drops terms from a quote.
 */
export function TermsPage({ data }: { data: ItineraryData }) {
  const terms = data.organization?.paymentTerms;
  if (!terms) return null;

  return (
    <PdfPage>
      <SectionLabel>Payment Terms</SectionLabel>
      <View style={{ height: SPACE.md }} />
      <Body>{terms}</Body>
    </PdfPage>
  );
}
