import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Ratiba vs Wetu (2026): Pricing, Features & Honest Comparison',
  description:
    'Side-by-side comparison of Ratiba and Wetu for safari tour operators. Compare real-time collaboration, proposal branding, and flat-rate vs tiered pricing.',
  keywords: [
    'Ratiba vs Wetu',
    'Wetu alternative',
    'Wetu alternative for safari operators',
    'safari itinerary builder comparison',
    'tour operator proposal software',
    'Wetu pricing',
    'best Wetu alternative 2026',
  ],
  alternates: {
    canonical: '/compare/wetu-alternative',
  },
  openGraph: {
    title: 'Ratiba vs Wetu (2026): Pricing, Features & Honest Comparison',
    description:
      'Side-by-side comparison of Ratiba and Wetu for safari tour operators. Compare collaboration, branding, and pricing models.',
    url: '/compare/wetu-alternative',
    type: 'article',
  },
};

export default function WetuAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Wetu"
      competitorDefaultPerSeat={50}
      pagePath="/compare/wetu-alternative"
      heroTitle="Send proposals the same day the enquiry lands — not three days later"
      heroDescription="Wetu handles content well, but when your consultants and ops team work from different views, proposals slow down. Ratiba gives your whole team one workspace to build, review, and send branded itineraries — with flat monthly pricing from $49/mo."
      featureRows={[
        {
          feature: 'Real-time team collaboration on proposals',
          kitasuro: {
            enabled: true,
            note: 'Sales and ops edit the same proposal with inline comments',
          },
          competitor: {
            enabled: false,
            note: 'Content library is strong, but live co-editing is limited',
          },
        },
        {
          feature: 'Client feedback tied to specific days',
          kitasuro: {
            enabled: true,
            note: 'Clients comment directly on itinerary days and trip details',
          },
          competitor: {
            enabled: false,
            note: 'Feedback typically happens outside the itinerary via email',
          },
        },
        {
          feature: 'Flat monthly pricing (no per-seat tiers)',
          kitasuro: {
            enabled: true,
            note: 'Plans from $49/mo to $249/mo regardless of team size',
          },
          competitor: {
            enabled: false,
            note: 'Tiered pricing from $75/mo (Lite) to $395/mo (Enterprise)',
          },
        },
        {
          feature: 'Custom brand images in every proposal',
          kitasuro: {
            enabled: true,
            note: 'Upload your own photos and apply brand styling per proposal',
          },
          competitor: {
            enabled: true,
            note: 'Uses a shared content library with destination imagery',
          },
        },
        {
          feature: 'Shareable proposal links for clients',
          kitasuro: {
            enabled: true,
            note: 'Clients review, comment, and accept via a branded URL',
          },
          competitor: {
            enabled: true,
            note: 'Supports shareable itinerary links',
          },
        },
        {
          feature: 'Sales-to-ops handoff in one workspace',
          kitasuro: {
            enabled: true,
            note: 'One source of truth — no version conflicts between teams',
          },
          competitor: {
            enabled: false,
            note: 'Sales and ops often work from separate views and exports',
          },
        },
      ]}
      switchReasons={[
        'Consultants and ops currently juggle separate itinerary versions — costing hours per proposal.',
        'Wetu tier pricing climbs as your team grows, making annual cost hard to forecast.',
        'Proposals need your own photography, not just the shared content library.',
        'Peak season enquiries pile up because the build-review-send cycle takes too many steps.',
      ]}
      testimonials={[
        {
          quote:
            'With our old tool, a single proposal took two days of back-and-forth between sales and ops. We needed same-day turnaround.',
          author: 'Senior Safari Consultant',
          role: 'Senior Safari Consultant',
          company: 'East Africa Tour Operator',
        },
        {
          quote:
            'Every time someone exports a PDF and edits it separately, we lose version control. One shared workspace fixed that.',
          author: 'Operations Manager',
          role: 'Operations Manager',
          company: 'Safari DMC, Tanzania',
        },
        {
          quote:
            'Our clients pay $15,000+ per trip. The proposal has to look like it came from us, not a stock photo library.',
          author: 'Agency Founder',
          role: 'Founder',
          company: 'Luxury Safari Agency',
        },
      ]}
      faqs={[
        {
          question: 'How does Ratiba pricing compare to Wetu pricing?',
          answer:
            'Wetu charges $75/mo (Lite), $150/mo (Premium), or $395/mo (Enterprise) with tiered feature access. Ratiba charges a flat $49, $99, or $249/mo based on features — not team size. Use the calculator above to model your total cost.',
        },
        {
          question: 'Can we migrate our existing itineraries from Wetu?',
          answer:
            'Yes. Most teams start by building new enquiries in Ratiba and migrate existing templates over time. You can run both tools in parallel during evaluation.',
        },
        {
          question: 'Does Ratiba have a content library like Wetu?',
          answer:
            'Ratiba focuses on your own brand assets rather than a shared content library. You upload your photography and apply your own styling, so proposals reflect your brand — not generic destination content.',
        },
        {
          question: 'Is Ratiba suitable for teams larger than 5 people?',
          answer:
            'Yes. The Business plan ($249/mo) supports unlimited team members. Collaboration and consistency become more valuable as your team grows, not less.',
        },
      ]}
    />
  );
}
