import { pdf } from '@react-pdf/renderer';
import type { ItineraryData } from '@/types/itinerary-types';
import { registerProposalFonts } from './fonts';
import { resolveImages } from './images';
import { resolveDestinationPhotos } from './destination-images';
import { planAllDayPhotos } from './helpers';
import { withDocScope } from './scope';
import { defaultPalette, type PdfPalette } from './theme';
import { ProposalDocument, planImages, type ProposalDocumentProps } from './document';

export interface RenderProposalOptions extends Omit<ProposalDocumentProps, 'data'> {
  palette?: PdfPalette;
  /**
   * Seed for destination photo selection. Defaults to the proposal id: stable for
   * the life of a proposal, distinct between operators quoting the same park.
   */
  seed?: string;
}

/**
 * Render a proposal to a PDF buffer. All network work (listing curated destination
 * photos, fetching every image) happens up front; the render itself is CPU-bound.
 */
export async function renderProposalPdf(
  data: ItineraryData,
  { palette = defaultPalette, seed, ...documentProps }: RenderProposalOptions = {},
): Promise<Buffer> {
  registerProposalFonts();

  const destinationPhotos = await resolveDestinationPhotos(data.itinerary);
  const photoPlans = planAllDayPhotos(data, destinationPhotos, seed ?? data.id);
  const images = await resolveImages(planImages(data, photoPlans));

  // pdf() invokes every component synchronously, so the scope only has to be held
  // for this call. See scope.ts.
  const instance = withDocScope(
    {
      palette,
      images,
      photoPlans,
      brandName: data.organization?.name ?? '',
    },
    () => pdf(<ProposalDocument data={data} {...documentProps} />),
  );

  const stream = await instance.toBuffer();
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
