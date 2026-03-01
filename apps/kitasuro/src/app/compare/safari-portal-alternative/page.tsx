import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Ratiba vs Safari Portal (2026): Pricing, Features & Full Comparison',
  description:
    'Compare Ratiba and Safari Portal for safari operators. See real pricing ($49/mo vs $199+/mo), collaboration features, and a side-by-side feature matrix.',
  keywords: [
    'Ratiba vs Safari Portal',
    'Safari Portal alternative',
    'Safari Portal pricing',
    'safari operator software comparison',
    'safari booking software alternative',
    'tour operator proposal platform',
    'best Safari Portal alternative 2026',
  ],
  alternates: {
    canonical: '/compare/safari-portal-alternative',
  },
  openGraph: {
    title: 'Ratiba vs Safari Portal (2026): Pricing, Features & Full Comparison',
    description:
      'Compare Ratiba and Safari Portal for safari operators. Real pricing, collaboration features, and a side-by-side feature matrix.',
    url: '/compare/safari-portal-alternative',
    type: 'article',
  },
};

export default function SafariPortalAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Safari Portal"
      competitorDefaultPerSeat={150}
      pagePath="/compare/safari-portal-alternative"
      heroTitle="Get the same proposal quality at a fraction of the cost"
      heroDescription="Safari Portal starts at $199/mo for a single user. Ratiba starts at $49/mo and includes team collaboration, branded proposals, and client review links — without charging extra for each seat or feature."
      featureRows={[
        {
          feature: 'Real-time team collaboration on proposals',
          kitasuro: {
            enabled: true,
            note: 'Sales and ops co-edit the same proposal with inline comments',
          },
          competitor: {
            enabled: false,
            note: 'Collaboration limited — additional user seats sold as add-ons',
          },
        },
        {
          feature: 'Pricing that stays flat as you grow',
          kitasuro: {
            enabled: true,
            note: 'Plans from $49/mo to $249/mo — no per-seat surcharges',
          },
          competitor: {
            enabled: false,
            note: 'Starts at $199/mo for 1 user; Deluxe at $399/mo for 3 users',
          },
        },
        {
          feature: 'Brand-consistent proposals across consultants',
          kitasuro: {
            enabled: true,
            note: 'Upload your photos, apply brand styling — every proposal matches',
          },
          competitor: {
            enabled: true,
            note: 'Supports branded output, but consistency depends on per-consultant setup',
          },
        },
        {
          feature: 'Interactive client review and acceptance',
          kitasuro: {
            enabled: true,
            note: 'Clients review, comment on days, and accept via a branded link',
          },
          competitor: {
            enabled: true,
            note: 'Client-facing itinerary views available',
          },
        },
        {
          feature: 'Reusable itinerary building blocks',
          kitasuro: {
            enabled: true,
            note: 'Save and reuse day templates, accommodations, and activity blocks',
          },
          competitor: {
            enabled: true,
            note: 'Template reuse supported within the platform',
          },
        },
        {
          feature: 'Full workflow from enquiry to accepted quote',
          kitasuro: {
            enabled: true,
            note: 'One workspace covers build, review, send, and client acceptance',
          },
          competitor: {
            enabled: false,
            note: 'Booking and quoting require separate modules or manual coordination',
          },
        },
      ]}
      switchReasons={[
        'Safari Portal costs $199/mo for one user — a 3-person team pays $399/mo before add-ons.',
        'Adding users requires contacting sales for custom add-on pricing, slowing team growth.',
        'Proposal quality varies by consultant because there is no enforced brand template system.',
        'Client feedback and internal reviews happen outside the tool, creating version confusion.',
      ]}
      testimonials={[
        {
          quote:
            'We had three consultants producing three different-looking proposals. Clients noticed. We needed one standard.',
          author: 'Product Owner',
          role: 'Product Owner',
          company: 'Safari Operator Group',
        },
        {
          quote:
            'The time between receiving an enquiry and sending a quote is where we win or lose the booking. Every extra step costs us.',
          author: 'Sales Lead',
          role: 'Sales Lead',
          company: 'Inbound DMC, Kenya',
        },
        {
          quote:
            'We were paying $399/mo for three seats and still needed workarounds for client approvals. The cost did not match the value.',
          author: 'Managing Director',
          role: 'Managing Director',
          company: 'Boutique Safari Agency',
        },
      ]}
      faqs={[
        {
          question: 'How does Ratiba pricing compare to Safari Portal pricing?',
          answer:
            'Safari Portal charges $199/mo (Starter, 1 user), $299/mo (Standard, 1 user), or $399/mo (Deluxe, 3 users) with extra seats and features as paid add-ons. Ratiba charges $49/mo (Starter), $99/mo (Pro, up to 4 users), or $249/mo (Business, unlimited users) with no add-on fees.',
        },
        {
          question: 'Do we have to migrate everything from Safari Portal at once?',
          answer:
            'No. Start by building your next new enquiry in Ratiba. Compare the turnaround time, client response, and team collaboration before making any wider changes.',
        },
        {
          question: 'Is Ratiba only cheaper, or does it do more?',
          answer:
            'Both. Ratiba includes real-time collaboration, inline client comments, and branded proposal delivery in every plan. Safari Portal charges separately for additional seats, white labeling, and API access.',
        },
        {
          question: 'Can Ratiba handle high-volume safari operators?',
          answer:
            'Yes. The Business plan supports unlimited team members and unlimited proposals. The workflow is built for teams that send multiple proposals per day during peak season.',
        },
      ]}
    />
  );
}
