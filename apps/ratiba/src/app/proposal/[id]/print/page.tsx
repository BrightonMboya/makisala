import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import SafariPortalTheme from '@/components/themes/SafariPortalTheme';
import KuduTheme from '@/components/themes/kudu';
import DiscoveryTheme from '@/components/themes/DiscoveryTheme';
import { PrintFrame } from '@/components/proposal/PrintFrame';
import { createServerCaller } from '@/server/trpc/caller';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import type { ThemeType } from '@/types/itinerary-types';
import { log, serializeError } from '@/lib/logger';

/**
 * Print surface for a proposal: the exact same theme components as the public
 * page, but stripped of app chrome (comments, watermark, language toggle) and
 * wrapped for static capture. Chromium navigates here and prints it to PDF.
 *
 * `?theme=` overrides the stored theme so a single proposal can be previewed in
 * any theme while we dial the design in. `?lang=` mirrors the public page.
 */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ theme?: string; lang?: string }>;
};

const VALID_THEMES: ThemeType[] = ['minimalistic', 'safari-portal', 'kudu', 'discovery'];

// The theme every PDF renders in unless explicitly overridden with ?theme=.
const PDF_DEFAULT_THEME: ThemeType = 'minimalistic';

const getCachedProposal = cache(async (id: string) => {
  const trpc = await createServerCaller();
  return trpc.proposals.getById({ id });
});

const getCachedTranslation = cache(async (proposalId: string, language: string) => {
  if (language === 'en') return null;
  const trpc = await createServerCaller();
  return trpc.translations.getTranslation({ proposalId, language });
});

// The document <title> becomes the PDF's title (shown in viewers and used as the
// default download filename), so derive it from the proposal instead of letting
// it inherit the app-wide default. `title.absolute` bypasses the root layout's
// "%s | Ratiba ..." template so the PDF reads just the proposal name.
export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const robots = { index: false, follow: false } as const;
  try {
    const { id } = await params;
    const { lang } = await searchParams;

    const proposal = await getCachedProposal(id);
    if (!proposal) return { robots };

    const proposalLang = (proposal as { language?: string }).language || 'en';
    const activeLang = lang || proposalLang;
    const translation = await getCachedTranslation(id, activeLang);

    const transformedData = transformProposalToItineraryData(
      proposal,
      activeLang !== 'en' ? (translation as Record<string, unknown> | null) : null,
    );

    return {
      title: transformedData?.title ? { absolute: transformedData.title } : undefined,
      robots,
    };
  } catch {
    return { robots };
  }
}

export default async function ProposalPrintPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { theme: themeParam, lang } = await searchParams;

  try {
    const proposal = await getCachedProposal(id);
    if (!proposal) notFound();

    const proposalLang = (proposal as { language?: string }).language || 'en';
    const activeLang = lang || proposalLang;
    const translation = await getCachedTranslation(id, activeLang);

    const transformedData = transformProposalToItineraryData(
      proposal,
      activeLang !== 'en' ? (translation as Record<string, unknown> | null) : null,
    );
    if (!transformedData) notFound();

    // PDFs standardize on the Minimalistic theme for now (it's the one tuned to
    // paginate cleanly). `?theme=` still overrides for side-by-side previewing.
    const override = themeParam && VALID_THEMES.includes(themeParam as ThemeType) ? (themeParam as ThemeType) : null;
    const theme = override ?? PDF_DEFAULT_THEME;
    const data = { ...transformedData, theme };

    return (
      <>
        {/* Print sizing: desktop-width "paper" at A4 aspect ratio (1 : 1.414) so
            the PDF mirrors the on-screen desktop layout. renderProposalPdf uses
            preferCSSPageSize so this @page rule drives pagination. */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @page { size: 1280px 1810px; margin: 0; }
              html, body { margin: 0; padding: 0; background: #ffffff; }
              /* App chrome that should never appear in a printed proposal. */
              [data-ratiba-chrome] { display: none !important; }
              /* On-screen-only affordances (scroll hints, carousel dots/counter). */
              [data-print-hide] { display: none !important; }
              /* Next.js dev-tools indicator (dev only; harmless selector in prod). */
              nextjs-portal, #__next-dev-tools-indicator,
              [data-nextjs-toast], [data-next-badge-root] { display: none !important; }
              /* Floating navigation / scroll indicators / progress dots don't belong in a PDF. */
              [data-print-root] .fixed { display: none !important; }

              /* Kudu is a full-viewport scroll-snap theme: every section lives inside
                 one 100vh internally-scrolling container, so a naive print captures
                 only the first screen. Unroll it into natural document flow and
                 unclip the inner scroll regions so all content prints. */
              [data-print-theme="kudu"] [class*="snap-y"],
              [data-print-theme="kudu"] [class*="snap-mandatory"] {
                height: auto !important;
                min-height: 0 !important;
                overflow: visible !important;
                scroll-snap-type: none !important;
              }
              [data-print-theme="kudu"] [class*="h-screen"] {
                height: auto !important;
                min-height: 100vh;
              }
              [data-print-theme="kudu"] [class*="overflow-y-auto"],
              [data-print-theme="kudu"] [class*="overflow-y-scroll"] {
                overflow: visible !important;
              }
              [data-print-theme="kudu"] [class*="max-h-["] {
                max-height: none !important;
              }

              /* ----------------------------------------------------------------
                 PDF fidelity hardening (all themes). The themes are built for
                 continuous on-screen scroll; printing slices them into fixed
                 1280x1810 pages, which exposes three defects that also render
                 differently across viewers (Chrome's viewer vs macOS Preview).
                 ---------------------------------------------------------------- */

              /* (a) backdrop-filter and mix-blend force Chromium to flatten whole
                 regions into 2x bitmaps: it bloats the file (janky scrolling once
                 downloaded) and every viewer rasterizes the blend a little
                 differently. Neither adds anything to a static capture. */
              [data-print-root] *,
              [data-print-root] *::before,
              [data-print-root] *::after {
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
                mix-blend-mode: normal !important;
              }

              /* (b) Never slice an atomic block across a page boundary. A
                 full-bleed image torn in two is the "broken page" seen in Preview;
                 a heading orphaned from its body reads as a layout bug. */
              [data-print-root] h1, [data-print-root] h2,
              [data-print-root] h3, [data-print-root] h4 {
                break-inside: avoid;
                break-after: avoid;
              }
              [data-print-root] tr, [data-print-root] li, [data-print-root] figure {
                break-inside: avoid;
              }
              /* Discovery's full-bleed image blocks (day header + accommodation
                 gallery) and the route map are each shorter than one page, so keep
                 them whole: they push to the next page instead of tearing. */
              [data-print-theme="discovery"] [class*="h-[60vh]"],
              [data-print-theme="discovery"] [class*="h-[400px]"],
              [data-print-theme="discovery"] [class*="h-[50vh]"] {
                break-inside: avoid;
              }

              /* ----------------------------------------------------------------
                 Minimalistic is the default PDF theme, but its on-screen layout is
                 a sticky 2-column sidebar (itinerary + a 400px "Proposal Sidebar").
                 Sticky positioning and a short side column can't paginate, so flatten
                 it: one column, un-stuck, with the route map full-width instead of a
                 316px square lost in an empty column.
                 ---------------------------------------------------------------- */
              [data-print-theme="minimalistic"] [class*="grid-cols-[1fr_400px]"] {
                display: block !important;
              }
              [data-print-theme="minimalistic"] [class*="sticky"] {
                position: static !important;
              }
              /* Give the sidebar card room once it flows below the itinerary. */
              [data-print-theme="minimalistic"] aside {
                margin-top: 4rem;
              }
              /* The map is aspect-square (would be ~1200px tall at full width):
                 make it a sensible full-width banner instead. */
              [data-print-theme="minimalistic"] [class*="aspect-square"]:has([data-print-map]) {
                aspect-ratio: auto !important;
                height: 460px !important;
                width: 100% !important;
              }
            `,
          }}
        />
        <div data-print-root data-print-theme={theme}>
          <PrintFrame>
            {theme === 'safari-portal' ? (
              <SafariPortalTheme data={data} />
            ) : theme === 'kudu' ? (
              <KuduTheme data={data} />
            ) : theme === 'discovery' ? (
              <DiscoveryTheme data={data} />
            ) : (
              <MinimalisticTheme data={data} />
            )}
          </PrintFrame>
        </div>
      </>
    );
  } catch (err) {
    log.error('Error loading proposal print page', { error: serializeError(err) });
    notFound();
  }
}
