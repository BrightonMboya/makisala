import { env } from '@/lib/env';

const BASE_URL = env.NEXT_PUBLIC_APP_URL;
const LOGO_URL = 'https://brand.makisala.com/ratiba-logo.png';

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${BASE_URL}/#organization`,
  name: 'Ratiba',
  url: BASE_URL,
  logo: LOGO_URL,
  description:
    'Ratiba is a proposal and itinerary platform built for safari operators and tour companies. Teams build interactive, mobile-optimized safari proposals that clients can view, comment on, and approve.',
  sameAs: [
    'https://www.linkedin.com/company/makisala',
    'https://twitter.com/ratiba',
  ],
};

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${BASE_URL}/#website`,
  url: BASE_URL,
  name: 'Ratiba',
  publisher: { '@id': `${BASE_URL}/#organization` },
  inLanguage: 'en',
};

export const softwareApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  '@id': `${BASE_URL}/#software`,
  name: 'Ratiba',
  url: BASE_URL,
  description:
    'Safari itinerary builder and proposal software for tour operators, DMCs, and travel agencies. Build interactive proposals, manage content libraries, price multi-day trips, and collaborate as a team.',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'Tour Operator Software',
  operatingSystem: 'Web',
  softwareVersion: '1.0',
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '49',
      priceCurrency: 'USD',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: '49',
        priceCurrency: 'USD',
        unitText: 'MONTH',
      },
      url: `${BASE_URL}/pricing`,
    },
  ],
  featureList: [
    'AI-powered itinerary builder',
    'Interactive client proposals with live comments',
    'Multi-currency pricing engine',
    'Accommodation and supplier content library',
    'Team collaboration with role-based access',
    'Branded proposal themes',
    'Mobile-first client viewing experience',
  ],
  provider: { '@id': `${BASE_URL}/#organization` },
};

export const homepageFaqs = [
  {
    question: 'What is Ratiba?',
    answer:
      'Ratiba is an itinerary builder and proposal platform for safari operators, tour companies, and travel agencies. Operators use it to build interactive, mobile-friendly safari proposals that clients can view, comment on, and approve in a browser, replacing PDFs, Word documents, and Excel spreadsheets.',
  },
  {
    question: 'Who is Ratiba for?',
    answer:
      'Ratiba is built for safari operators, destination management companies (DMCs), travel agencies, and tour companies that sell custom multi-day trips. It fits solo operators sending a handful of quotes per month and teams handling hundreds of proposals per year.',
  },
  {
    question: 'How is Ratiba different from Tourwriter, Tourplan, or Travefy?',
    answer:
      'Tourwriter, Tourplan, and Travefy are generic tour operator platforms. Ratiba is purpose-built for safari and African tour operators, with features like game-drive scheduling, lodge content libraries, and park fee calculations that match how safari businesses actually work. Ratiba is also simpler, faster to set up, and priced flat instead of per seat.',
  },
  {
    question: 'How much does Ratiba cost?',
    answer:
      'Ratiba starts at $49 per month on the Starter plan with flat pricing that does not charge per seat. Full pricing is at ratiba.co/pricing.',
  },
  {
    question: 'Can clients view Ratiba proposals without creating an account?',
    answer:
      'Yes. Clients receive a link to view the full itinerary on their phone or desktop. They can leave comments on specific days, approve the trip, and pay, all without signing up or downloading anything.',
  },
  {
    question: 'Does Ratiba replace our existing CRM or accounting software?',
    answer:
      'No. Ratiba is focused on the proposal and itinerary workflow, from inquiry to booking approval. It works alongside existing CRMs and accounting tools, and integrations with tools like WhatsApp, Xero, and Stripe are on the roadmap.',
  },
];

export const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: homepageFaqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: { '@type': 'Answer', text: f.answer },
  })),
};

export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema);
}
