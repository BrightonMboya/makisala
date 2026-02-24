import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Kitasuro vs Safari Portal: Alternative for Safari Operators',
  description:
    'Compare Kitasuro vs Safari Portal for proposal collaboration, pricing predictability, itinerary quality control, and team workflow clarity.',
  keywords: [
    'Kitasuro vs Safari Portal',
    'Safari Portal alternative',
    'safari software comparison',
    'tour operator proposal platform',
    'travel itinerary management software',
  ],
  alternates: {
    canonical: '/compare/safari-portal-alternative',
  },
  openGraph: {
    title: 'Kitasuro vs Safari Portal: Alternative for Safari Operators',
    description:
      'See how Kitasuro compares with Safari Portal on collaboration, branding, and fixed-vs-seat pricing.',
    url: '/compare/safari-portal-alternative',
    type: 'article',
  },
};

export default function SafariPortalAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Safari Portal"
      pagePath="/compare/safari-portal-alternative"
      heroTitle="Safari Portal alternative with stronger collaboration and cost control"
      heroDescription="Kitasuro helps safari operators standardize proposal quality across teams, reduce version chaos, and keep pricing predictable as they scale."
      featureRows={[
        {
          feature: 'Proposal collaboration with full context',
          kitasuro: {
            enabled: true,
            note: 'Shared proposal workspace with clear change visibility',
          },
          competitor: {
            enabled: false,
            note: 'Support varies by setup and process',
          },
        },
        {
          feature: 'Pricing predictability as team grows',
          kitasuro: {
            enabled: true,
            note: 'Fixed monthly plans reduce seat-based cost creep',
          },
          competitor: {
            enabled: false,
            note: 'Commercial model depends on package structure',
          },
        },
        {
          feature: 'Brand consistency across consultants',
          kitasuro: {
            enabled: true,
            note: 'Custom images and styling for consistent output',
          },
          competitor: {
            enabled: true,
            note: 'Available, but consistency varies by process',
          },
        },
        {
          feature: 'Client-friendly proposal experiences',
          kitasuro: {
            enabled: true,
            note: 'Interactive links optimized for review and response',
          },
          competitor: {
            enabled: true,
            note: 'Possible, depending on workflow setup',
          },
        },
        {
          feature: 'Content and itinerary reuse',
          kitasuro: {
            enabled: true,
            note: 'Reusable building blocks for faster repeat proposals',
          },
          competitor: {
            enabled: true,
            note: 'Reusable workflows differ by implementation',
          },
        },
        {
          feature: 'Operational clarity from enquiry to acceptance',
          kitasuro: {
            enabled: true,
            note: 'One workflow reduces fragmented communication',
          },
          competitor: {
            enabled: false,
            note: 'May require extra tools or coordination',
          },
        },
      ]}
      switchReasons={[
        'You want to eliminate version confusion between sales and operations.',
        'You need a more reliable way to produce branded proposals at scale.',
        'You want pricing confidence while headcount changes.',
        'You want collaboration and client feedback in one place.',
      ]}
      testimonials={[
        {
          quote:
            'We need a consistent proposal standard across the team so quality does not vary by consultant.',
          author: 'Evaluation Call',
          role: 'Product Owner',
          company: 'Safari Operator Group',
        },
        {
          quote:
            'Our goal is to reduce handoff friction between enquiry and accepted quote so teams can focus on closing.',
          author: 'Evaluation Call',
          role: 'Sales Lead',
          company: 'Inbound DMC Team',
        },
        {
          quote:
            'As we scale, we want a pricing model that stays predictable without forcing us to compromise on proposal quality.',
          author: 'Evaluation Call',
          role: 'Managing Director',
          company: 'Tour Agency',
        },
      ]}
      faqs={[
        {
          question: 'Do we have to migrate everything at once?',
          answer:
            'No. Many teams start with new enquiries or one product line, then expand after proving speed and conversion improvements.',
        },
        {
          question: 'Can Kitasuro support high enquiry volume teams?',
          answer:
            'Yes. The workflow is designed around repeatable proposal creation, collaboration, and consistency under operational pressure.',
        },
        {
          question: 'Is price the only reason to switch?',
          answer:
            'Usually no. Teams typically switch for a combination of collaboration, consistency, speed, and total cost predictability.',
        },
        {
          question: 'How should we evaluate the branding difference?',
          answer:
            'Build the same proposal scenario in both tools and compare visual consistency, editing time, and final client presentation quality.',
        },
      ]}
    />
  );
}
