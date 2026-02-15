import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { format } from 'date-fns';
import MinimalisticTheme from '@/components/themes/MinimalisticTheme';
import SafariPortalTheme from '@/components/themes/SafariPortalTheme';
import KuduTheme from '@/components/themes/kudu';
import DiscoveryTheme from '@/components/themes/DiscoveryTheme';
import { CommentsProvider } from '@/components/comments/CommentsProvider';
import { CommentsOverlay } from '@/components/comments/CommentsOverlay';
import { PDFDownloadButton } from '@/components/pdf-download-button';
import { createServerCaller } from '@/server/trpc/caller';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import { getOrgPlan, PLAN_CONFIG } from '@/lib/plans';

type Props = {
  params: Promise<{ id: string }>;
};

const getCachedProposal = cache(async (id: string) => {
  const trpc = await createServerCaller();
  return trpc.proposals.getById({ id });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getCachedProposal(id);

  if (!proposal) {
    return {
      title: 'Proposal not found | Kitasuro',
    };
  }

  const dayCount = proposal.days.length;
  const title = proposal.tourTitle || proposal.name;
  const orgName = proposal.organization?.name;

  const descriptionParts: string[] = [];
  if (dayCount > 0) descriptionParts.push(`${dayCount}-day`);
  if (proposal.tourType) descriptionParts.push(proposal.tourType.toLowerCase());
  if (proposal.countries?.length) descriptionParts.push(`across ${proposal.countries.join(', ')}`);
  if (proposal.startCity && proposal.endCity && proposal.startCity !== proposal.endCity) {
    descriptionParts.push(`· ${proposal.startCity} → ${proposal.endCity}`);
  }
  if (proposal.startDate) {
    descriptionParts.push(`· Starting ${format(new Date(proposal.startDate), 'MMM d, yyyy')}`);
  }

  const description =
    descriptionParts.length > 0
      ? descriptionParts.join(' ')
      : `Travel proposal${orgName ? ` by ${orgName}` : ''}`;

  return {
    title: orgName ? `${title} — ${orgName}` : title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: orgName ? `${title} — ${orgName}` : title,
      description,
      type: 'website',
    },
  };
}

export default async function ItineraryPage({ params }: Props) {
  const { id } = await params;

  try {
    const proposal = await getCachedProposal(id);

    if (!proposal) {
      notFound();
    }

    // Transform proposal data to ItineraryData format
    const transformedData = await transformProposalToItineraryData(proposal);

    if (!transformedData) {
      notFound();
    }

    // Determine plan features for this proposal's organization
    const orgId = proposal.organizationId;
    const orgPlan = orgId ? await getOrgPlan(orgId) : null;
    const commentsEnabled = orgPlan ? orgPlan.limits.comments : false;
    const showWatermark = orgPlan ? !orgPlan.limits.noWatermark : true;

    return (
      <CommentsProvider proposalId={id} readOnly={!commentsEnabled}>
        <CommentsOverlay>
          {transformedData.theme === 'safari-portal' ? (
            <SafariPortalTheme data={transformedData} />
          ) : transformedData.theme === 'kudu' ? (
            <KuduTheme data={transformedData} />
          ) : transformedData.theme === 'discovery' ? (
            <DiscoveryTheme data={transformedData} />
          ) : (
            <MinimalisticTheme data={transformedData} />
          )}
          {showWatermark && (
            <div className="fixed bottom-4 right-4 z-40 rounded-full bg-black/70 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
              Powered by Kitasuro
            </div>
          )}
        </CommentsOverlay>
      </CommentsProvider>
    );
  } catch (err) {
    console.error('Error loading proposal:', err);
    notFound();
  }
}
