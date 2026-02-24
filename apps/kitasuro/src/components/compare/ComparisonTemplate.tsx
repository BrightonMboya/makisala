import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Coins,
  Images,
  Quote,
  Users,
  Workflow,
  X,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { PricingSavingsCalculator } from '@/components/compare/PricingSavingsCalculator';

type FeatureCell = {
  enabled: boolean;
  note: string;
};

type FeatureRow = {
  feature: string;
  kitasuro: FeatureCell;
  competitor: FeatureCell;
};

type Testimonial = {
  quote: string;
  author: string;
  role: string;
  company: string;
};

type ComparisonTemplateProps = {
  competitorName: string;
  heroTitle: string;
  heroDescription: string;
  featureRows: FeatureRow[];
  switchReasons: string[];
  testimonials: Testimonial[];
  faqs: Array<{ question: string; answer: string }>;
  pagePath: string;
};

const kitasuroAdvantages = [
  {
    title: 'Live collaboration without version drift',
    description:
      'Sales and operations teams work from one itinerary source, so edits and approvals stay synchronized.',
    icon: Users,
  },
  {
    title: 'Predictable monthly spend as you grow',
    description:
      'Avoid per-seat cost creep. Forecast software cost with fixed plans that fit real team growth.',
    icon: Coins,
  },
  {
    title: 'Brand-level control on every proposal',
    description:
      'Use custom images and visual style standards so every itinerary reflects your company quality.',
    icon: Images,
  },
  {
    title: 'Workflow built for enquiry-to-send speed',
    description:
      'Move from brief to client-ready proposal faster with fewer handoffs and less channel switching.',
    icon: Workflow,
  },
];

export function ComparisonTemplate({
  competitorName,
  heroTitle,
  heroDescription,
  featureRows,
  switchReasons,
  testimonials,
  faqs,
  pagePath,
}: ComparisonTemplateProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kitasuro.com';
  const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
  const pageUrl = `${siteUrl}${normalizedPath}`;

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
      {
        '@type': 'ListItem',
        position: 2,
        name: `Kitasuro vs ${competitorName}`,
        item: pageUrl,
      },
    ],
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Navbar />

      <main className="pt-32 pb-20 md:pt-36">
        <section id="overview" className="relative overflow-hidden">
          <div className="from-primary/15 pointer-events-none absolute top-0 left-1/2 h-[340px] w-[720px] -translate-x-1/2 rounded-full bg-gradient-to-b to-transparent blur-3xl" />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-primary border-border/60 bg-card/70 inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
              Kitasuro vs {competitorName}
            </p>
            <h1 className="font-heading mt-5 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
              {heroTitle}
            </h1>
            <p className="text-muted-foreground mt-6 max-w-3xl text-lg">{heroDescription}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center justify-center rounded-full px-6 text-sm font-medium shadow-sm transition-colors"
              >
                Start free trial
              </Link>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-11 items-center justify-center rounded-full border px-6 text-sm font-medium transition-colors"
              >
                Book a 20-min walkthrough
              </Link>
            </div>

            <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span>No credit card required</span>
              <span>Set up your first proposal in minutes</span>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <article className="border-border/70 bg-card/65 rounded-2xl border p-4">
                <p className="text-xs font-semibold tracking-wide uppercase">Best for</p>
                <p className="mt-2 text-sm text-balance">
                  Tour operators that need one proposal workflow across consultants and operations.
                </p>
              </article>
              <article className="border-border/70 bg-card/65 rounded-2xl border p-4">
                <p className="text-xs font-semibold tracking-wide uppercase">Core difference</p>
                <p className="mt-2 text-sm text-balance">
                  Fixed monthly pricing and in-context collaboration designed for faster team
                  execution.
                </p>
              </article>
              <article className="border-border/70 bg-card/65 rounded-2xl border p-4">
                <p className="text-xs font-semibold tracking-wide uppercase">Decision path</p>
                <p className="mt-2 text-sm text-balance">
                  Compare capabilities, model cost, then run one live proposal test before
                  migration.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Why operators shortlist Kitasuro
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                These are the four criteria most teams use when comparing itinerary and proposal
                platforms for safari and tour operations.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {kitasuroAdvantages.map((item) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    className="border-border/60 bg-card/55 relative overflow-hidden rounded-2xl border p-6"
                  >
                    <div className="from-primary/10 pointer-events-none absolute -right-8 -bottom-10 h-24 w-24 rounded-full bg-gradient-to-tr to-transparent blur-md" />
                    <div className="relative">
                      <span className="bg-primary/12 text-primary inline-flex h-10 w-10 items-center justify-center rounded-xl">
                        <Icon className="h-5 w-5" />
                      </span>
                      <h3 className="font-heading mt-4 text-xl font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-20">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.922_0_0)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.922_0_0)_1px,transparent_1px)] bg-[size:40px_40px] opacity-50" />
          <div className="from-primary/10 pointer-events-none absolute inset-0 bg-gradient-to-b via-transparent to-transparent" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 max-w-3xl">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                Designed for proposal-first sales teams
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Keep proposal quality high with branded imagery, clear itinerary structure, and a
                polished output your team can send quickly.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-2xl border p-2 shadow-xl md:translate-y-8">
                <div className="bg-background relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src="/img_1.png"
                    alt="Kitasuro itinerary builder"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-2xl border p-2 shadow-2xl">
                <div className="bg-background relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src="/proposal preview.png"
                    alt="Kitasuro proposal preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <div className="border-border/60 bg-card/80 relative overflow-hidden rounded-2xl border p-2 shadow-xl md:-translate-y-6">
                <div className="bg-background relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Image
                    src="/proposal_preivew-1.png"
                    alt="Kitasuro branded proposal screen"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="matrix" className="bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-heading text-3xl font-bold tracking-tight">
                Kitasuro vs {competitorName}: feature comparison matrix
              </h2>
              <p className="text-muted-foreground mt-3 max-w-3xl">
                Compare the capabilities most teams evaluate when selecting itinerary software,
                travel proposal software, and safari operations tools.
              </p>
            </div>

            <div className="border-border/60 bg-card/60 rounded-2xl border p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[38%]">Capability</TableHead>
                    <TableHead className="w-[31%]">Kitasuro</TableHead>
                    <TableHead className="w-[31%]">{competitorName}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureRows.map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {row.kitasuro.enabled ? (
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="text-muted-foreground">{row.kitasuro.note}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          {row.competitor.enabled ? (
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-700">
                              <Check className="h-3.5 w-3.5" />
                            </span>
                          ) : (
                            <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-700">
                              <X className="h-3.5 w-3.5" />
                            </span>
                          )}
                          <span className="text-muted-foreground">{row.competitor.note}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <p className="text-muted-foreground mt-3 text-xs">
              Buyer guidance only. Validate exact plan and feature availability during your own
              trial and procurement process.
            </p>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="font-heading text-3xl font-bold tracking-tight">
                What operators say in evaluation calls
              </h2>
              <p className="text-muted-foreground mt-3 text-lg">
                Representative voice-of-customer insights from tour operators assessing proposal
                software options.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={`${item.author}-${item.company}`}
                  className="border-border/60 bg-card/70 relative rounded-2xl border p-6"
                >
                  <Quote className="text-primary mb-4 h-5 w-5" />
                  <p className="text-muted-foreground leading-relaxed">{item.quote}</p>
                  <div className="border-border/60 mt-5 border-t pt-4">
                    <p className="font-medium">{item.author}</p>
                    <p className="text-muted-foreground text-sm">
                      {item.role}, {item.company}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="border-border/60 bg-card/60 rounded-2xl border p-6 sm:p-8">
                <h2 className="font-heading text-3xl font-bold tracking-tight">
                  Why teams choose Kitasuro
                </h2>
                <ul className="mt-6 space-y-4">
                  {switchReasons.map((reason) => (
                    <li key={reason} className="flex items-start gap-3">
                      <CheckCircle2 className="text-primary mt-1 h-4 w-4 shrink-0" />
                      <span className="text-muted-foreground">{reason}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <PricingSavingsCalculator />
            </div>
          </div>
        </section>

        <section className="bg-muted/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-2">
              <article className="border-border/60 bg-card/60 rounded-2xl border p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  How to evaluate Kitasuro vs {competitorName}
                </h2>
                <p className="text-muted-foreground mt-3">
                  Use the same itinerary scenario in both tools, include sales and operations users,
                  then compare output quality, turnaround time, and internal handoff clarity.
                </p>
                <ul className="text-muted-foreground mt-5 space-y-2 text-sm">
                  <li>- Create one proposal with identical client requirements.</li>
                  <li>- Capture total build and internal review time.</li>
                  <li>- Review proposal presentation quality and brand consistency.</li>
                  <li>- Confirm total annual software cost at your target team size.</li>
                </ul>
              </article>

              <article className="border-border/60 bg-card/60 rounded-2xl border p-6 sm:p-8">
                <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                  Explore more alternatives
                </h2>
                <p className="text-muted-foreground mt-3">
                  Compare other safari and tour operator software options to validate your
                  shortlist.
                </p>
                <div className="mt-5 flex flex-col gap-2 text-sm">
                  {[
                    { href: '/compare/wetu-alternative', label: 'Kitasuro vs Wetu' },
                    {
                      href: '/compare/safari-office-alternative',
                      label: 'Kitasuro vs Safari Office',
                    },
                    {
                      href: '/compare/safari-portal-alternative',
                      label: 'Kitasuro vs Safari Portal',
                    },
                    { href: '/compare', label: 'All comparison pages' },
                  ].map((linkItem) => (
                    <Link
                      key={linkItem.href}
                      href={linkItem.href}
                      className="text-primary hover:text-primary/80 inline-flex items-center gap-2 font-medium"
                    >
                      <ArrowRight className="h-4 w-4" />
                      {linkItem.label}
                    </Link>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-heading text-3xl font-bold tracking-tight">
              Frequently Asked Questions
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

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-heading text-4xl font-bold tracking-tight">
              Compare quickly, then test in your own workflow
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Build one real proposal in Kitasuro and see how your team handles collaboration,
              branding, and pricing in practice.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/sign-up"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Build my first proposal <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors"
              >
                Get a live comparison demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
