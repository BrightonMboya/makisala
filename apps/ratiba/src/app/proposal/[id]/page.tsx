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
import { LanguageToggle } from '@/components/proposal/LanguageToggle';
import { createServerCaller } from '@/server/trpc/caller';
import { transformProposalToItineraryData } from '@/lib/proposal-transform';
import { getOrgPlan } from '@/lib/plans';
import { log, serializeError } from '@/lib/logger';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

const getCachedProposal = cache(async (id: string) => {
  const trpc = await createServerCaller();
  return trpc.proposals.getById({ id });
});

const getCachedTranslation = cache(async (proposalId: string, language: string) => {
  if (language === 'en') return null;
  const trpc = await createServerCaller();
  return trpc.translations.getTranslation({ proposalId, language });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const proposal = await getCachedProposal(id);

  if (!proposal) {
    return {
      title: 'Proposal not found | Ratiba',
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

export default async function ItineraryPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { lang } = await searchParams;

  try {
    const proposal = await getCachedProposal(id);

    if (!proposal) {
      notFound();
    }

    // Determine which language to show:
    // ?lang=en forces English, ?lang=xx forces that language,
    // otherwise use the proposal's configured language
    const proposalLang = (proposal as any).language || 'en';
    const activeLang = lang || proposalLang;

    const translation = await getCachedTranslation(id, activeLang);
    const orgId = proposal.organizationId;
    const transformedData = transformProposalToItineraryData(
      proposal,
      activeLang !== 'en' ? (translation as Record<string, any> | null) : null,
    );
    const orgPlan = orgId ? await getOrgPlan(orgId) : null;

    if (!transformedData) {
      notFound();
    }

    const commentsEnabled = orgPlan ? orgPlan.limits.comments : false;
    const showWatermark = orgPlan ? !orgPlan.limits.noWatermark : true;
    const showLanguageToggle = proposalLang !== 'en';

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
          {showLanguageToggle && (
            <LanguageToggle
              proposalId={id}
              currentLang={activeLang}
              targetLang={proposalLang}
            />
          )}
          {showWatermark && (
            <div className="fixed right-4 bottom-4 z-40 rounded-full bg-black/70 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
              Powered by Ratiba
            </div>
          )}
        </CommentsOverlay>
      </CommentsProvider>
    );
  } catch (err) {
    log.error('Error loading proposal', { error: serializeError(err) });
    notFound();
  }
}
