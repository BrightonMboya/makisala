import type { Metadata } from 'next';
import { ComparisonTemplate } from '@/components/compare/ComparisonTemplate';

export const metadata: Metadata = {
  title: 'Ratiba vs Safari Office (2026): Which Tour Operator Software Wins?',
  description:
    'Compare Ratiba and Safari Office for proposal speed, team collaboration, branded itineraries, and total cost. See the feature matrix and pricing calculator.',
  keywords: [
    'Ratiba vs Safari Office',
    'Safari Office alternative',
    'SafariOffice alternative',
    'tour operator software comparison',
    'safari CRM alternative',
    'itinerary builder for tour operators',
    'Safari Office pricing',
  ],
  alternates: {
    canonical: '/compare/safari-office-alternative',
  },
  openGraph: {
    title: 'Ratiba vs Safari Office (2026): Which Tour Operator Software Wins?',
    description:
      'Compare Ratiba and Safari Office for proposal speed, collaboration, and total cost. Feature matrix and pricing calculator included.',
    url: '/compare/safari-office-alternative',
    type: 'article',
  },
};

export default function SafariOfficeAlternativePage() {
  return (
    <ComparisonTemplate
      competitorName="Safari Office"
      competitorDefaultPerSeat={30}
      pagePath="/compare/safari-office-alternative"
      heroTitle="Stop assembling proposals across three tools and two email threads"
      heroDescription="Safari Office handles bookings and operations, but building a polished client proposal still means switching between tabs, exports, and email chains. Ratiba puts the entire proposal workflow — build, review, brand, send — in one place, starting at $49/mo."
      featureRows={[
        {
          feature: 'Enquiry-to-proposal speed',
          kitasuro: {
            enabled: true,
            note: 'Build and send a branded proposal in one session, same day',
          },
          competitor: {
            enabled: false,
            note: 'Proposal assembly requires manual steps across modules',
          },
        },
        {
          feature: 'Sales and ops in one workspace',
          kitasuro: {
            enabled: true,
            note: 'Both teams edit the same live proposal with inline comments',
          },
          competitor: {
            enabled: false,
            note: 'Operations and sales data live in separate sections',
          },
        },
        {
          feature: 'Flat monthly pricing',
          kitasuro: {
            enabled: true,
            note: 'Plans from $49/mo to $249/mo — price stays the same as you add users',
          },
          competitor: {
            enabled: true,
            note: 'Free for 2 users, then ~€12/seat/mo plus add-on fees ($20–35/mo each)',
          },
        },
        {
          feature: 'Custom brand imagery in proposals',
          kitasuro: {
            enabled: true,
            note: 'Upload your own photos and apply consistent brand styling',
          },
          competitor: {
            enabled: true,
            note: 'Image support available within the booking workflow',
          },
        },
        {
          feature: 'Interactive client proposal links',
          kitasuro: {
            enabled: true,
            note: 'Clients review, comment, and accept via a branded URL',
          },
          competitor: {
            enabled: true,
            note: 'Shareable tour links available via Share Tours add-on (€20/mo)',
          },
        },
        {
          feature: 'Client feedback on specific itinerary days',
          kitasuro: {
            enabled: true,
            note: 'Comments attach to individual days so nothing gets lost',
          },
          competitor: {
            enabled: false,
            note: 'Client feedback typically handled outside the tool via email',
          },
        },
      ]}
      switchReasons={[
        'Building a proposal currently takes 3+ tools: your CRM, a doc editor, and email for reviews.',
        'Add-on costs for Share Tours, language packs, and SafariBuddy add up beyond the free base.',
        'Consultants produce inconsistent proposals because there is no shared brand template system.',
        'Client feedback arrives scattered across email, WhatsApp, and phone — never attached to the itinerary.',
      ]}
      testimonials={[
        {
          quote:
            'We were copying itinerary details into Google Docs, adding photos, then emailing PDFs for review. It took a full day per proposal.',
          author: 'Travel Consultant',
          role: 'Travel Consultant',
          company: 'East Africa DMC',
        },
        {
          quote:
            'Our ops team catches pricing errors only after the proposal is already with the client. We need them reviewing in real time.',
          author: 'Head of Operations',
          role: 'Head of Operations',
          company: 'Regional Tour Operator',
        },
        {
          quote:
            'A client once gave feedback on day 4 of a 12-day itinerary by saying "the middle part needs changes." We wasted an hour figuring out what they meant.',
          author: 'Commercial Director',
          role: 'Commercial Director',
          company: 'Safari Sales Agency',
        },
      ]}
      faqs={[
        {
          question: 'How does Ratiba pricing compare to Safari Office pricing?',
          answer:
            'Safari Office is free for 2 users, then charges ~€12/seat/month plus add-ons like Share Tours (€20/mo) and SafariBuddy (€35/mo). Ratiba charges a flat $49, $99, or $249/mo with features included — no per-seat scaling or add-on fees.',
        },
        {
          question: 'Can Ratiba replace Safari Office for bookings and operations?',
          answer:
            'Ratiba focuses on the proposal and client-facing workflow, not back-office booking management. Many teams use both: Safari Office for operations and Ratiba for building and sending proposals faster.',
        },
        {
          question: 'What is the main workflow difference between Ratiba and Safari Office?',
          answer:
            'Safari Office is operations-first: it manages bookings, suppliers, and tour logistics. Ratiba is proposal-first: it helps your team build, brand, review, and send client itineraries in one collaborative workspace.',
        },
        {
          question: 'Can we try Ratiba without leaving Safari Office?',
          answer:
            'Yes. Start by building your next new enquiry in Ratiba. Compare the turnaround time and client response before making any changes to your existing setup.',
        },
      ]}
    />
  );
}
