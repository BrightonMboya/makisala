export const dynamic = 'force-static';

const features = [
  {
    title: 'AI-powered itinerary builder',
    description:
      'Go from a rough brief to a polished day-by-day itinerary in minutes. AI suggests lodges, activities, and routes based on your content library.',
  },
  {
    title: 'Live client proposals',
    description:
      'Send interactive, mobile-optimized proposals your clients can view, comment on, and approve — no PDFs, no downloads, no back-and-forth.',
  },
  {
    title: 'Real-time team collaboration',
    description:
      'Sales and ops work on the same live itinerary. Tag teammates, leave comments, and keep everyone aligned without email chains or version chaos.',
  },
  {
    title: 'Built-in pricing engine',
    description:
      'Set per-night rates, seasonal pricing, and markup rules once. Ratiba calculates margins and totals automatically as you build the trip.',
  },
  {
    title: 'Content library',
    description:
      'Store lodge descriptions, activity details, and destination copy in one place. Drag them into any itinerary — consistent, branded, and ready to send.',
  },
  {
    title: 'Branded proposal themes',
    description:
      'Choose from multiple themes that match your brand. Upload your logo, set your colors, and send proposals that look like they came from a design team.',
  },
];

const faqs = [
  {
    question: 'How is Ratiba different from Tourwriter or Wetu?',
    answer:
      'Those tools are built for the global tour market. Ratiba is purpose-built for safari operators — with safari-specific templates, lodge databases, and live client proposals instead of static PDFs.',
  },
  {
    question: 'Can my whole team use Ratiba?',
    answer:
      'Yes. On the Business plan, you get unlimited team members at no extra cost. Sales, ops, and managers all work in one shared workspace — no per-seat fees.',
  },
  {
    question: 'Do clients need to create an account to view proposals?',
    answer:
      'No. Clients receive a shareable link and can view the full itinerary, leave comments, and approve the trip — all without creating an account or downloading anything.',
  },
  {
    question: 'How does the AI itinerary builder work?',
    answer:
      'Describe the trip — number of days, destinations, budget — and AI generates a complete day-by-day itinerary using lodges and activities from your content library. You review, adjust, and send.',
  },
  {
    question: 'Can I import my existing lodge data and content?',
    answer:
      'Yes. Our team handles migration for free. We import your lodge database, pricing, descriptions, and images so you can start sending proposals from day one.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Yes. Every new account starts with a 14-day free trial on the Pro plan — no credit card required. You can send real proposals to clients from the start.',
  },
];

export async function GET() {
  const featuresSection = features
    .map((f) => `### ${f.title}\n\n${f.description}`)
    .join('\n\n');

  const faqSection = faqs
    .map((f) => `### ${f.question}\n\n${f.answer}`)
    .join('\n\n');

  const md = `# Ratiba Features

Build itineraries. Send proposals. Close trips.

Everything your team needs to plan safari itineraries, price trips accurately, and send proposals clients can approve in one click.

## Features

${featuresSection}

## Frequently asked questions

${faqSection}

## Ready to send better proposals?

Start your free trial today. Build itineraries, price trips, and send proposals clients love — no credit card required. Book a demo at https://ratiba.app/demo

---

Ratiba is a proposal and itinerary platform built for safari operators and tour companies. Start free at https://ratiba.app
`;

  return new Response(md, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
