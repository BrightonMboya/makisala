import { Document } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import { alternativePhotos } from './helpers';
import type { DayPhotoPlans } from './helpers';
import type { ImageRequest } from './images';
import { CoverPage } from './pages/cover';
import { SummaryPage } from './pages/summary';
import { MapPage, mapImageUrl } from './pages/map';
import { DayDetailPage, DayGalleryPage, DayIntroPage } from './pages/day';
import { PricingPage, TermsPage } from './pages/pricing';
import { AlternativesPage } from './pages/alternatives';
import { AboutPage } from './pages/about';

/**
 * Composes the page archetypes from a single ItineraryData, the same value the web
 * themes render, so the PDF and the live proposal can't drift apart on content.
 */

export interface ProposalDocumentProps {
  data: ItineraryData;
  /** Operator's opening letter. Defaults to one built from the trip facts. */
  letter?: string[];
  contact?: { address?: string; phone?: string; email?: string; website?: string };
}

/**
 * Every image the document will ask for, tagged with how it's used. Rendering is
 * synchronous, so anything not requested here renders as a blank placeholder.
 */
export function planImages(data: ItineraryData, photoPlans: DayPhotoPlans): ImageRequest[] {
  const requests: ImageRequest[] = [];

  if (data.heroImage) requests.push({ url: data.heroImage, role: 'hero' });
  if (data.organization?.logoUrl) requests.push({ url: data.organization.logoUrl, role: 'logo' });

  const map = mapImageUrl(data);
  if (map) requests.push({ url: map, role: 'hero' });

  for (const day of data.itinerary) {
    const plan = photoPlans.get(day.day);
    if (plan) {
      // The intro's lead is a half-page collage panel; the rest render at roughly
      // column width.
      plan.intro.forEach((url, index) => {
        requests.push({ url, role: index === 0 ? 'hero' : 'feature' });
      });
      for (const url of [...plan.detail, ...plan.gallery]) {
        requests.push({ url, role: 'feature' });
      }
    }
    for (const alternative of day.accommodationAlternatives ?? []) {
      for (const url of alternativePhotos(alternative)) requests.push({ url, role: 'thumb' });
    }
  }

  for (const accommodation of data.accommodations) {
    if (accommodation.image) requests.push({ url: accommodation.image, role: 'thumb' });
  }

  return requests;
}

/**
 * Must be built inside withDocScope() — renderProposalPdf() is the entrypoint that
 * does that. Rendering it directly will throw from usePdfDoc().
 */
export function ProposalDocument({ data, letter, contact }: ProposalDocumentProps) {
  return (
    <Document
      title={data.title}
      author={data.organization?.name}
      subject={data.subtitle}
      creator="Ratiba"
      producer="Ratiba"
    >
      <CoverPage data={data} letter={letter ?? buildLetter(data)} />
      <SummaryPage data={data} />
      <MapPage data={data} />

      {/* Flattened, not wrapped per day: <Document> expects <Page> children. */}
      {data.itinerary.flatMap((day) => [
        <DayIntroPage key={`intro-${day.day}`} data={data} day={day} />,
        <DayDetailPage key={`detail-${day.day}`} data={data} day={day} />,
        <DayGalleryPage key={`gallery-${day.day}`} day={day} />,
      ])}

      <PricingPage data={data} />
      <TermsPage data={data} />
      <AlternativesPage data={data} />
      <AboutPage data={data} contact={contact} />
    </Document>
  );
}

/** Fallback so a proposal is never sent with a blank cover. */
function buildLetter(data: ItineraryData): string[] {
  const overview = data.tripOverview;
  const paragraphs = [
    `Thank you for your interest in planning your trip with ${data.organization?.name ?? 'us'}.`,
    "We're excited to share a personalised quote for what promises to be an unforgettable experience.",
  ];

  const start = overview?.travelDates?.start;
  const from = overview?.startCity;
  if (start) {
    paragraphs.push(
      `Your ${data.title} starts on ${start}${from ? ` from ${from}` : ''} and spans ${data.duration}.`,
    );
  }

  paragraphs.push(
    'For further information, please feel free to reach out. We are here to assist and answer any inquiries you may have.',
  );

  return paragraphs;
}
