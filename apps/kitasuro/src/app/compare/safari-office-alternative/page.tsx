import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Ratiba vs Safari Office: Alternative for Tour Companies',
  description:
    'Compare Ratiba vs Safari Office for proposal turnaround, team collaboration, fixed pricing, and branded itinerary delivery.',
  keywords: [
    'Ratiba vs Safari Office',
    'Safari Office alternative',
    'tour operator CRM comparison',
    'itinerary proposal software',
    'safari operations software',
  ],
  alternates: {
    canonical: '/compare/safari-office-alternative',
  },
  openGraph: {
    title: 'Ratiba vs Safari Office: Alternative for Tour Companies',
    description:
      'Compare workflow speed, collaboration depth, proposal branding, and pricing model between Ratiba and Safari Office.',
    url: '/compare/safari-office-alternative',
    type: 'article',
  },
};

export default function SafariOfficeAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Safari Office"
      pagePath="/compare/safari-office-alternative"
      heroTitle="Safari Office alternative for teams that want a cleaner proposal stack"
      heroDescription="Ratiba helps consultants and operations teams build client-ready proposals faster, collaborate clearly, and keep costs predictable with fixed monthly pricing."
      featureRows={[
        {
          feature: 'Proposal workflow built for sales velocity',
          kitasuro: {
            enabled: true,
            note: 'Designed for fast enquiry-to-proposal turnaround',
          },
          competitor: {
            enabled: false,
            note: 'Speed depends heavily on process setup',
          },
        },
        {
          feature: 'Cross-team collaboration in one interface',
          kitasuro: {
            enabled: true,
            note: 'Sales and ops edits stay aligned in one workspace',
          },
          competitor: {
            enabled: false,
            note: 'Often needs more process coordination',
          },
        },
        {
          feature: 'Predictable monthly pricing model',
          kitasuro: {
            enabled: true,
            note: 'Fixed plans that remain easy to forecast',
          },
          competitor: {
            enabled: false,
            note: 'Cost structure varies by package and terms',
          },
        },
        {
          feature: 'Brand-specific images in proposals',
          kitasuro: {
            enabled: true,
            note: 'Supports custom brand visuals and consistent output',
          },
          competitor: {
            enabled: true,
            note: 'Supported with workflow differences',
          },
        },
        {
          feature: 'Interactive proposal sharing',
          kitasuro: {
            enabled: true,
            note: 'Client-friendly links with collaboration context',
          },
          competitor: {
            enabled: true,
            note: 'Available, but varies by workflow',
          },
        },
        {
          feature: 'Day-level feedback loops',
          kitasuro: {
            enabled: true,
            note: 'Comments tied to itinerary sections for clarity',
          },
          competitor: {
            enabled: false,
            note: 'Depends on feedback process',
          },
        },
      ]}
      switchReasons={[
        'You need faster proposal production with fewer manual handoffs.',
        'You want collaboration inside the proposal, not separate channels.',
        'You want predictable pricing that does not climb sharply by seat count.',
        'You need more consistent proposal quality across consultants.',
      ]}
      testimonials={[
        {
          quote:
            'We need to stop assembling proposals across too many tools and move to one clean flow from brief to send.',
          author: 'Evaluation Call',
          role: 'Travel Consultant',
          company: 'Destination Specialist Team',
        },
        {
          quote:
            'Operations needs to review proposal details in context so changes are faster and less error-prone.',
          author: 'Evaluation Call',
          role: 'Head of Operations',
          company: 'Regional Tour Company',
        },
        {
          quote:
            'We want clients to respond inside the proposal flow instead of sending fragmented feedback in different channels.',
          author: 'Evaluation Call',
          role: 'Commercial Director',
          company: 'Safari Sales Team',
        },
      ]}
      faqs={[
        {
          question: 'How do we compare real-world costs?',
          answer:
            'Model your expected team size and seat assumptions with the calculator, then compare total annual cost and workflow efficiency.',
        },
        {
          question: 'Is Ratiba useful if we already have an established process?',
          answer:
            'Yes. You can start by replacing one high-friction part of your current process, then expand based on measurable improvements.',
        },
        {
          question: 'What is the biggest operational gain from switching?',
          answer:
            'Most teams gain speed and clarity: fewer disconnected steps between building the itinerary, reviewing internally, and presenting to clients.',
        },
        {
          question: 'Can Ratiba support branded, premium-looking proposals?',
          answer:
            'Yes. Teams can use custom visual assets and maintain a consistent brand presentation across proposals.',
        },
      ]}
    />
  );
}
