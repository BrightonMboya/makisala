import { StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import {
  Body,
  DisplayTitle,
  Label,
  LogoChip,
  PAGE,
  PdfPage,
  Photo,
  Rule,
  SPACE,
  Scrim,
  SectionLabel,
  Small,
  TYPE,
  usePdfDoc,
} from '../primitives';

/**
 * The trust page, and the document's last sheet. Review scores and contact detail
 * are what a client checks before replying, so they are given their own page rather
 * than trailing the pricing.
 */

const HERO_HEIGHT = 250;

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, position: 'relative' },
  heroTitle: { position: 'absolute', left: PAGE.marginX, bottom: 20 },
  bar: {
    paddingVertical: SPACE.md,
    paddingHorizontal: PAGE.marginX,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  columns: {
    flexDirection: 'row',
    gap: SPACE.xl,
    paddingHorizontal: PAGE.marginX,
    paddingTop: SPACE.lg,
  },
  col: { flex: 1, gap: SPACE.md },
  contactRow: { flexDirection: 'row', paddingVertical: 3 },
  contactLabel: { width: 66 },
  contactValue: { flex: 1 },
  reviewRow: { flexDirection: 'row', alignItems: 'center', gap: SPACE.sm, paddingVertical: 3 },
});

const PLATFORM_LABEL: Record<string, string> = {
  google: 'Google',
  safaribookings: 'SafariBookings',
  tripadvisor: 'Tripadvisor',
};

function ContactRow({ label, value }: { label: string; value: string }) {
  const { palette } = usePdfDoc();
  return (
    <View style={styles.contactRow}>
      <View style={styles.contactLabel}>
        <Small color={palette.muted}>{label}</Small>
      </View>
      <View style={styles.contactValue}>
        <Small color={palette.ink}>{value}</Small>
      </View>
    </View>
  );
}

export interface AboutPageProps {
  data: ItineraryData;
  /** Overrides the organization's own address and phone. */
  contact?: { address?: string; phone?: string; email?: string; website?: string };
}

export function AboutPage({ data, contact }: AboutPageProps) {
  const { palette } = usePdfDoc();
  const org = data.organization;
  if (!org) return null;

  const reviews = org.reviewLinks?.filter((r) => r.rating != null) ?? [];
  const social = org.socialLinks ?? {};
  const socialEntries = Object.entries(social).filter(([, handle]) => !!handle);

  // Settings store a cleared address as '' rather than null, so these are
  // truthiness-checked throughout rather than compared against null.
  const details = contact ?? { address: org.address ?? undefined, phone: org.phone ?? undefined };
  const contactEntries = [details.address, details.phone, details.email, details.website].filter(
    Boolean,
  );

  // Otherwise: a hero, a name bar, and two empty columns.
  if (
    !org.aboutDescription &&
    reviews.length === 0 &&
    socialEntries.length === 0 &&
    contactEntries.length === 0
  ) {
    return null;
  }

  return (
    <PdfPage padded={false}>
      <View style={styles.hero}>
        <Photo src={data.heroImage} style={{ width: '100%', height: '100%' }} />
        <Scrim height="70%" />
        <View style={styles.heroTitle}>
          <DisplayTitle size={TYPE.cover} color={palette.onBrand}>
            About Us
          </DisplayTitle>
        </View>
      </View>

      <View style={[styles.bar, { backgroundColor: palette.brand }]}>
        <Text
          style={{
            fontFamily: 'Outfit',
            fontSize: TYPE.h1,
            fontWeight: 600,
            color: palette.onBrand,
          }}
        >
          We, {org.name}
        </Text>
        {org.logoUrl ? <LogoChip src={org.logoUrl} width={52} height={26} /> : null}
      </View>

      <View style={styles.columns}>
        <View style={styles.col}>
          {org.aboutDescription ? <Body>{org.aboutDescription}</Body> : null}

          {reviews.length > 0 ? (
            <View style={{ gap: SPACE.sm, marginTop: SPACE.sm }}>
              <SectionLabel>Reviewed on</SectionLabel>
              {reviews.map((review) => (
                <View key={review.platform} style={styles.reviewRow}>
                  <Text
                    style={{
                      fontFamily: 'Outfit',
                      fontSize: TYPE.h2,
                      fontWeight: 700,
                      color: palette.brand,
                    }}
                  >
                    {review.rating?.toFixed(1)}
                  </Text>
                  <Small color={palette.ink}>
                    {PLATFORM_LABEL[review.platform] ?? review.platform}
                  </Small>
                  {review.reviewCount ? <Small>· {review.reviewCount} reviews</Small> : null}
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.col}>
          {/* The country comes from the trip, not the org, so on its own it's a
              heading over a fact the client already knows. */}
          {contactEntries.length > 0 ? (
            <>
              <SectionLabel>Contact Us</SectionLabel>
              <View>
                {details.address ? <ContactRow label="Address" value={details.address} /> : null}
                {data.location ? <ContactRow label="Country" value={data.location} /> : null}
                {details.phone ? <ContactRow label="Phone" value={details.phone} /> : null}
                {details.email ? <ContactRow label="Email" value={details.email} /> : null}
                {details.website ? <ContactRow label="Website" value={details.website} /> : null}
              </View>
            </>
          ) : null}

          {socialEntries.length > 0 ? (
            <>
              {contactEntries.length > 0 ? <Rule /> : null}
              <View style={{ gap: SPACE.xs }}>
                <Label>Follow us on</Label>
                {socialEntries.map(([platform, handle]) => (
                  <ContactRow
                    key={platform}
                    label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                    value={String(handle)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      </View>
    </PdfPage>
  );
}
