import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Kitasuro vs Wetu: Best Alternative for Tour Operators',
  description:
    'Compare Kitasuro vs Wetu for itinerary builder workflows, proposal collaboration, branding control, and fixed pricing for safari operators.',
  keywords: [
    'Kitasuro vs Wetu',
    'Wetu alternative',
    'tour operator software comparison',
    'safari itinerary software',
    'travel proposal software',
  ],
  alternates: {
    canonical: '/compare/wetu-alternative',
  },
  openGraph: {
    title: 'Kitasuro vs Wetu: Best Alternative for Tour Operators',
    description:
      'Feature-by-feature comparison of Kitasuro and Wetu for collaboration, branding, and pricing predictability.',
    url: '/compare/wetu-alternative',
    type: 'article',
  },
};

export default function WetuAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Wetu"
      pagePath="/compare/wetu-alternative"
      heroTitle="A modern Wetu alternative for proposal-first safari teams"
      heroDescription="If your team wants faster collaboration, predictable pricing, and stronger brand control, Kitasuro helps you deliver polished itineraries with less operational friction."
      featureRows={[
        {
          feature: 'Team collaboration on live proposals',
          kitasuro: {
            enabled: true,
            note: 'Built into proposal workflow with contextual feedback',
          },
          competitor: {
            enabled: false,
            note: 'Often managed across extra workflow layers',
          },
        },
        {
          feature: 'Client comments tied to itinerary context',
          kitasuro: {
            enabled: true,
            note: 'Comments stay attached to days and trip details',
          },
          competitor: {
            enabled: false,
            note: 'Depends on setup and team process',
          },
        },
        {
          feature: 'Fixed monthly pricing options',
          kitasuro: {
            enabled: true,
            note: 'Flat monthly plans (not strictly per seat growth)',
          },
          competitor: {
            enabled: false,
            note: 'Pricing and packaging can vary by account and contract',
          },
        },
        {
          feature: 'Custom brand images and proposal styling',
          kitasuro: {
            enabled: true,
            note: 'Upload images and present consistent branded proposals',
          },
          competitor: {
            enabled: true,
            note: 'Supported, with setup differences',
          },
        },
        {
          feature: 'Interactive link-based proposal delivery',
          kitasuro: {
            enabled: true,
            note: 'Shareable proposal URLs for review and acceptance flow',
          },
          competitor: {
            enabled: true,
            note: 'Possible depending on usage model',
          },
        },
        {
          feature: 'Sales-to-ops handoff in one workspace',
          kitasuro: {
            enabled: true,
            note: 'Shared source of truth for itinerary and pricing updates',
          },
          competitor: {
            enabled: false,
            note: 'Can require more internal coordination',
          },
        },
      ]}
      switchReasons={[
        'Your team needs cleaner collaboration between consultants and operations.',
        'You want predictable pricing while team size changes.',
        'You want stronger visual control with custom brand imagery.',
        'You want shorter proposal turnaround during peak enquiry periods.',
      ]}
      testimonials={[
        {
          quote:
            'We need proposal software that lets consultants send a polished first draft on the same day an enquiry comes in.',
          author: 'Evaluation Call',
          role: 'Senior Safari Consultant',
          company: 'East Africa Tour Operator',
        },
        {
          quote:
            'Our team loses time when sales and operations work from different versions. We want one shared itinerary workflow.',
          author: 'Evaluation Call',
          role: 'Operations Manager',
          company: 'Safari DMC Team',
        },
        {
          quote:
            'Predictable monthly pricing and premium branded proposals are both important for how we sell high-value trips.',
          author: 'Evaluation Call',
          role: 'Founder',
          company: 'Luxury Travel Agency',
        },
      ]}
      faqs={[
        {
          question: 'How should we evaluate pricing vs other platforms?',
          answer:
            'Compare the total team cost, not only entry price. Use the calculator to estimate how seat-based pricing scales against Kitasuro fixed monthly plans.',
        },
        {
          question: 'Can we trial this before moving fully?',
          answer:
            'Yes. Start with one itinerary workflow and compare your team speed, quality, and client response before wider rollout.',
        },
        {
          question: 'Is Kitasuro only for small teams?',
          answer:
            'No. The workflow is useful for both small operators and larger teams because collaboration, consistency, and turnaround speed become more important as volume grows.',
        },
        {
          question: 'Can we keep our brand identity in every proposal?',
          answer:
            'Yes. Kitasuro supports custom visual assets and proposal styling so every proposal looks like it came from your team, not a generic template.',
        },
      ]}
    />
  );
}
