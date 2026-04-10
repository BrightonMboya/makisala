import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { getUseCase, getAllUseCaseSlugs } from '@/lib/use-cases';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return getAllUseCaseSlugs().map((slug) => ({ slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = getUseCase(slug);
  if (!data) return {};

  const title = `Ratiba for ${data.name} | ${data.headline}`;
  const description = data.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `/for/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/for/${slug}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Inline SVG helpers                                                */
/* ------------------------------------------------------------------ */

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="#f0fdfa" />
      <path
        d="M7 12l4 4 6-7"
        stroke="#0d9488"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PainPointIcon({ index }: { index: number }) {
  const icons = [
    // Clock icon
    <svg key="clock" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>,
    // Alert icon
    <svg key="alert" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>,
    // Search icon
    <svg key="search" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>,
  ];
  return <div className="text-[rgba(38,27,7,0.4)]">{icons[index % 3]}</div>;
}

/* ------------------------------------------------------------------ */
/*  FAQ Accordion (server-side details/summary)                       */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border-t border-[rgba(38,27,7,0.1)]">
      <summary className="flex w-full cursor-pointer items-center justify-between py-7 text-left [&::-webkit-details-marker]:hidden list-none">
        <span
          className="pr-8 text-[#261B07]"
          style={{
            fontSize: 'clamp(18px, 2vw, 24px)',
            fontWeight: 584,
            letterSpacing: '-0.36px',
            lineHeight: '1.3',
          }}
        >
          {question}
        </span>
        <span className="shrink-0 text-[rgba(38,27,7,0.4)] transition-transform group-open:rotate-45">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </summary>
      <p className="max-w-2xl pb-7 text-base leading-relaxed text-[rgba(38,27,7,0.7)]">
        {answer}
      </p>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const data = getUseCase(slug);
  if (!data) notFound();

  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* ============================================================ */}
        {/*  SECTION 1 — Hero                                            */}
        {/* ============================================================ */}
        <section style={{ padding: '140px 0 100px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-[rgba(38,27,7,0.5)]">
                Ratiba for {data.name}
              </p>
              <h1
                className="mt-4 text-[#261B07]"
                style={{
                  fontSize: 'clamp(40px, 5vw, 72px)',
                  fontWeight: 584,
                  letterSpacing: '-1.44px',
                  lineHeight: '1.05',
                }}
              >
                {data.headline}
              </h1>
              <p
                className="mx-auto mt-6 max-w-2xl text-[rgba(38,27,7,0.7)]"
                style={{ fontSize: '20px', lineHeight: '28px' }}
              >
                {data.subtitle}
              </p>

              <div className="mt-8 flex items-center justify-center gap-3">
                <Link
                  href="/demo"
                  className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                >
                  Book a demo
                </Link>
                <Link
                  href="/proposal/tjksu"
                  className="rounded-xl border border-[rgba(38,27,7,0.18)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
                >
                  See a sample itinerary
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* ============================================================ */}
        {/*  SECTION 2 — Pain Points                                     */}
        {/* ============================================================ */}
        <section style={{ padding: '120px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2
                style={{
                  fontSize: 'clamp(36px, 4vw, 56px)',
                  fontWeight: 584,
                  letterSpacing: '-1.12px',
                  lineHeight: '1.12',
                }}
              >
                Sound familiar?
              </h2>
              <p
                className="mt-4 text-[rgba(38,27,7,0.7)]"
                style={{ fontSize: '16px', lineHeight: '24px' }}
              >
                These are the problems {data.name.toLowerCase()} deal with every day.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {data.painPoints.map((point, i) => (
                <div
                  key={point.title}
                  className="rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-6"
                >
                  <div className="mb-4">
                    <PainPointIcon index={i} />
                  </div>
                  <h3
                    className="text-[#261B07]"
                    style={{
                      fontSize: '20px',
                      fontWeight: 584,
                      letterSpacing: '-0.2px',
                      lineHeight: '25px',
                    }}
                  >
                    {point.title}
                  </h3>
                  <p
                    className="mt-2 text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '16px', lineHeight: '24px' }}
                  >
                    {point.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  SECTION 3 — Solutions (alternating left-right)              */}
        {/* ============================================================ */}
        <section style={{ padding: '120px 0' }} className="bg-white">
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2
                style={{
                  fontSize: 'clamp(36px, 4vw, 56px)',
                  fontWeight: 584,
                  letterSpacing: '-1.12px',
                  lineHeight: '1.12',
                }}
              >
                How Ratiba helps
              </h2>
            </div>

            <div className="space-y-24">
              {data.solutions.map((solution, i) => (
                <div
                  key={solution.title}
                  className={`flex flex-col gap-10 md:flex-row md:items-center ${
                    i % 2 === 1 ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Text */}
                  <div className="md:w-1/2">
                    <h3
                      className="text-[#261B07]"
                      style={{
                        fontSize: 'clamp(28px, 3vw, 40px)',
                        fontWeight: 584,
                        letterSpacing: '-0.8px',
                        lineHeight: '1.15',
                      }}
                    >
                      {solution.title}
                    </h3>
                    <p
                      className="mt-4 text-[rgba(38,27,7,0.7)]"
                      style={{ fontSize: '16px', lineHeight: '24px' }}
                    >
                      {solution.description}
                    </p>
                    <div className="mt-6">
                      <Link
                        href="/demo"
                        className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                      >
                        Book a demo
                      </Link>
                    </div>
                  </div>

                  {/* Image */}
                  <div className="md:w-1/2">
                    <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-[rgba(38,27,7,0.08)]">
                      <img
                        src={solution.image}
                        alt={solution.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  SECTION 4 — Feature List                                    */}
        {/* ============================================================ */}
        <section style={{ padding: '120px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col gap-10 md:flex-row">
              {/* Left sticky heading */}
              <div className="md:w-[41.67%]">
                <div className="md:sticky md:top-32">
                  <h2
                    style={{
                      fontSize: 'clamp(36px, 4vw, 56px)',
                      fontWeight: 584,
                      letterSpacing: '-1.12px',
                      lineHeight: '1.12',
                    }}
                  >
                    Everything you need
                  </h2>
                  <p
                    className="mt-4 text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '16px', lineHeight: '24px' }}
                  >
                    Key features built for {data.name.toLowerCase()}.
                  </p>
                  <div className="mt-6 flex items-center gap-3">
                    <Link
                      href="/demo"
                      className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                    >
                      Book a demo
                    </Link>
                    <Link
                      href="/proposal/tjksu"
                      className="rounded-xl border border-[rgba(38,27,7,0.18)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
                    >
                      See a sample itinerary
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right feature grid */}
              <div className="flex-1">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-start gap-3 rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-5"
                    >
                      <div className="mt-0.5 shrink-0">
                        <CheckIcon />
                      </div>
                      <span
                        className="text-[#261B07]"
                        style={{ fontSize: '16px', fontWeight: 500, lineHeight: '24px' }}
                      >
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  SECTION 5 — FAQ                                             */}
        {/* ============================================================ */}
        <section style={{ padding: '120px 0' }} className="bg-white">
          <div className="mx-auto max-w-[1216px] px-6">
            <h2
              className="mb-12"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                fontWeight: 584,
                letterSpacing: '-1.12px',
                lineHeight: '1.12',
              }}
            >
              Frequently asked questions
            </h2>

            <div>
              {data.faqs.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
              {/* Bottom border */}
              <div className="border-t border-[rgba(38,27,7,0.1)]" />
            </div>
          </div>

          {/* JSON-LD FAQPage schema */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: data.faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
              }),
            }}
          />
        </section>

        {/* ============================================================ */}
        {/*  SECTION 6 — Bottom CTA                                      */}
        {/* ============================================================ */}
        <section className="px-6 pb-24">
          <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-[28px] border border-[rgba(38,27,7,0.08)] bg-white p-[clamp(32px,5vw,56px)_clamp(20px,4vw,40px)] text-center shadow-[0_18px_40px_rgba(38,27,7,0.05)]">
            <h2 className="max-w-[620px] text-[clamp(28px,4vw,46px)] leading-[1.15] font-[580] tracking-[-2px] text-[#261B07]">
              Ready to send better proposals?
            </h2>
            <p className="max-w-[560px] text-lg leading-7 text-[rgba(38,27,7,0.7)]">
              Start your free trial today. Build itineraries, price trips, and send proposals
              clients love — no credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/demo"
                className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
              >
                Book a demo
              </Link>
              <Link
                href="/proposal/tjksu"
                className="rounded-xl border border-[rgba(38,27,7,0.18)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
              >
                See a sample itinerary
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
