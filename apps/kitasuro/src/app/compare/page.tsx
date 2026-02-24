import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, GitCompareArrows } from 'lucide-react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export const metadata: Metadata = {
  title: 'Kitasuro Compare Pages | Tour Operator Software Alternatives',
  description:
    'Explore Kitasuro comparison pages for Wetu, Safari Office, and Safari Portal. Evaluate features, pricing models, and proposal workflows for tour operators.',
  keywords: [
    'tour operator software alternatives',
    'Kitasuro comparison',
    'Wetu alternative',
    'Safari Office alternative',
    'Safari Portal alternative',
  ],
  alternates: {
    canonical: '/compare',
  },
  openGraph: {
    title: 'Kitasuro Compare Pages | Tour Operator Software Alternatives',
    description:
      'Compare Kitasuro with top tour operator platforms and evaluate collaboration, branding, and pricing differences.',
    url: '/compare',
    type: 'website',
  },
};

const comparisons = [
  {
    title: 'Kitasuro vs Wetu',
    description: 'A full comparison of workflow speed, collaboration depth, and brand control.',
    bullets: ['Long-form feature matrix', 'Pricing savings calculator', 'Team migration FAQs'],
    href: '/compare/wetu-alternative',
  },
  {
    title: 'Kitasuro vs Safari Office',
    description: 'See where Kitasuro improves day-to-day consultant and operations alignment.',
    bullets: ['Workflow fit analysis', 'Fixed-vs-seat pricing view', 'Switch-readiness checklist'],
    href: '/compare/safari-office-alternative',
  },
  {
    title: 'Kitasuro vs Safari Portal',
    description: 'Compare collaboration depth, proposal consistency, and cost predictability.',
    bullets: ['Capability-by-capability table', 'Savings estimator', 'Implementation FAQs'],
    href: '/compare/safari-portal-alternative',
  },
];

const faqs = [
  {
    question: 'Which tour operator software comparison should we start with?',
    answer:
      'Start with the platform currently closest to your workflow, then compare at least one additional option to validate collaboration and total annual cost differences.',
  },
  {
    question: 'What should we compare beyond features?',
    answer:
      'Evaluate proposal turnaround time, internal handoff quality, branding consistency, and the full yearly software cost at your expected team size.',
  },
  {
    question: 'How quickly can teams test Kitasuro against another platform?',
    answer:
      'Most teams can run a side-by-side test using one real itinerary scenario in less than a day, then use that result to guide rollout planning.',
  },
];

export default function CompareHubPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kitasuro.com';

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Kitasuro comparison pages',
    itemListElement: comparisons.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.title,
      url: `${siteUrl}${item.href}`,
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Compare',
        item: `${siteUrl}/compare`,
      },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Navbar />
      <main className="pt-32 pb-20 md:pt-36">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-primary border-border/60 bg-card/70 mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium">
            <GitCompareArrows className="h-4 w-4" /> Buyer enablement
          </p>
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Compare Kitasuro with other tour operator platforms
          </h1>
          <p className="text-muted-foreground mt-5 max-w-3xl text-lg">
            Use these pages to evaluate fit for your team, workflow, and client proposal experience.
            Each comparison includes capability matrixes, pricing modeling, and rollout guidance.
          </p>

          <div className="border-border/60 bg-card/60 mt-6 rounded-2xl border p-5">
            <p className="text-sm font-semibold">How to use these pages</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Shortlist by feature fit, validate total annual cost for your team size, then run one
              side-by-side proposal test before committing to migration.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {comparisons.map((item) => (
              <article
                key={item.title}
                className="border-border/60 bg-card/60 rounded-2xl border p-6"
              >
                <h2 className="font-heading text-2xl font-semibold tracking-tight">{item.title}</h2>
                <p className="text-muted-foreground mt-3">{item.description}</p>
                <ul className="text-muted-foreground mt-4 space-y-1 text-sm">
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>- {bullet}</li>
                  ))}
                </ul>
                <Link
                  href={item.href}
                  className="text-primary mt-6 inline-flex items-center text-sm font-medium hover:underline"
                >
                  Open full comparison <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              Comparison FAQs for tour operators
            </h2>
            <div className="mt-8 space-y-4">
              {faqs.map((faq) => (
                <article
                  key={faq.question}
                  className="border-border/60 bg-card/60 rounded-2xl border p-6"
                >
                  <h3 className="font-heading text-xl font-semibold">{faq.question}</h3>
                  <p className="text-muted-foreground mt-3">{faq.answer}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
