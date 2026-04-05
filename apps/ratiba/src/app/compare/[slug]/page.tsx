import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { CalEmbed } from '@/components/compare/CalEmbed';
import { LogoMarquee } from '@/components/compare/LogoMarquee';
import { getCompetitor, getAllCompetitorSlugs } from '@/lib/competitors';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

const FEATURE_WALL = [
  { title: 'Drag & drop scheduling' },
  { title: 'Multi-currency pricing' },
  { title: 'Shareable proposal links' },
  { title: 'Unlimited team seats' },
  { title: 'Instant PDF export' },
  { title: 'Role-based permissions' },
  { title: 'Revenue dashboards' },
  { title: 'WhatsApp notifications' },
  { title: 'Supplier database' },
  { title: 'Mobile-first proposals' },
  { title: 'Auto follow-ups' },
  { title: 'Route mapping' },
];

/* ------------------------------------------------------------------ */
/*  Inline SVG helpers                                                */
/* ------------------------------------------------------------------ */

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 10l3 3 5-6"
        stroke="#0d9488"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="#d1d5db"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FeatureIcon() {
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

/* ------------------------------------------------------------------ */
/*  Static params                                                     */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return getAllCompetitorSlugs().map((slug) => ({ slug }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                          */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) return {};

  const title = `Ratiba vs ${competitor.name} (2026) | Pricing, Features & Comparison`;
  const description = competitor.excerpt;

  return {
    title,
    description,
    alternates: {
      canonical: `/compare/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/compare/${slug}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default async function ComparePage({ params }: Props) {
  const { slug } = await params;
  const data = getCompetitor(slug);
  if (!data) notFound();

  const competitor = data.name;

  return (
    <>
      <Navbar />

      {/* ============================================================ */}
      {/*  SECTION 1 — Hero                                            */}
      {/* ============================================================ */}
      <section className="bg-[#F8F7F5] px-6 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-[#261B07]/50">
            Switch from {competitor} - zero risk, zero cost
          </p>
          <h1 className="font-heading mx-auto mt-4 max-w-3xl text-[clamp(44px,6vw,72px)] leading-[1.05] font-[800] tracking-[-2px] text-[#261B07]">
            We pay for your {competitor} bill.*
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#261B07]/60">
            *Get 100% of your remaining {competitor} contract value credited to Ratiba. We handle the
            migration, onboard your team for free, and you don&apos;t pay until your current contract
            expires.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-[10px] bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/demo"
              className="rounded-[10px] border border-[rgba(38,27,7,0.2)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
            >
              Book a demo
            </Link>
          </div>
        </div>

        {/* Cal.com booking embed */}
        <div className="mx-auto mt-14 max-w-5xl">
          <div className="rounded-2xl border border-[rgba(38,27,7,0.1)] bg-white p-2 shadow-lg">
            <CalEmbed />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 2 — Trust Logos                                     */}
      {/* ============================================================ */}
      <section className="border-b border-gray-100 bg-white px-6 py-16">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm text-[#261B07]/50">
            Trusted by tour operators and travel companies worldwide
          </p>
          <div className="mt-8">
            <LogoMarquee />
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 3 — Top 3 Reasons                                   */}
      {/* ============================================================ */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="font-heading text-[clamp(36px,5vw,56px)] leading-tight font-[800] tracking-[-1.5px] text-[#261B07]">
              Why choose Ratiba over {competitor}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#261B07]/50">{data.tagline}</p>
            <div className="mt-8 flex items-center gap-4">
              <Link
                href="/sign-up"
                className="rounded-[10px] bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
              >
                Get started
              </Link>
              <Link
                href="/demo"
                className="rounded-[10px] border border-[rgba(38,27,7,0.2)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
              >
                Book a demo
              </Link>
            </div>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {data.reasons.map((r) => (
              <div key={r.number} className="rounded-xl border border-gray-200 bg-white p-6">
                <span className="text-sm font-semibold text-[#261B07]/50">{r.number}</span>
                <h3 className="mt-3 text-xl font-bold text-[#261B07]">{r.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#261B07]/50">{r.description}</p>
                <div className="mt-6 aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-50">
                  <img src={r.image} alt={r.title} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 4 — Feature Breakdown                               */}
      {/* ============================================================ */}
      <section className="bg-[#F8F7F5] px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] font-[800] tracking-[-1.5px] text-[#261B07]">
            Feature breakdown
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#261B07]/50">
            A side-by-side look at what you get with Ratiba versus {competitor}.
          </p>

          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-[10px] bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/demo"
              className="rounded-[10px] border border-[rgba(38,27,7,0.2)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
            >
              Book a demo
            </Link>
          </div>

          {/* Comparison table */}
          <div className="mt-12 overflow-hidden rounded-xl border border-gray-200 bg-white text-left">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left font-semibold text-[#261B07]">Features</th>
                  <th className="px-6 py-4 text-center font-semibold text-[#261B07]">Ratiba</th>
                  <th className="px-6 py-4 text-center font-semibold text-[#261B07]/50">
                    {competitor}
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.features.map((f, i) => (
                  <tr key={f.name} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                    <td className="px-6 py-3.5 text-[#261B07]">{f.name}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center">
                        {f.ratiba ? <CheckIcon /> : <XIcon />}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex justify-center">
                        {f.competitor ? <CheckIcon /> : <XIcon />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 5 — Pricing Comparison                              */}
      {/* ============================================================ */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] font-[800] tracking-[-1.5px] text-[#261B07]">
            How do {competitor}&apos;s plans compare?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#261B07]/50">
            More features, fewer restrictions, and pricing that actually makes sense for safari
            businesses.
          </p>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {data.pricing.map((tier) => (
              <div
                key={tier.plan}
                className="rounded-xl border border-gray-200 bg-white p-8 text-left"
              >
                <h3 className="text-lg font-bold text-[#261B07]">{tier.plan}</h3>

                <div className="mt-4 space-y-1">
                  <p className="text-sm text-[#261B07]/50">
                    <span className="font-semibold text-teal-600">Ratiba:</span> {tier.ratibaPrice}
                  </p>
                  <p className="text-sm text-[#261B07]/50">
                    <span className="font-semibold text-gray-400">{competitor}:</span>{' '}
                    {tier.competitorPrice}
                  </p>
                </div>

                <ul className="mt-6 space-y-3">
                  {tier.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-3 text-sm text-[#261B07]">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        className="mt-0.5 shrink-0"
                      >
                        <path
                          d="M6 10l3 3 5-6"
                          stroke="#0d9488"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 6 — Feature Wall                                    */}
      {/* ============================================================ */}
      <section className="bg-[#F8F7F5] px-6 py-24">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] font-[800] tracking-[-1.5px] text-[#261B07]">
            The ultimate feature wall
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-[#261B07]/50">
            Everything Ratiba offers (that {competitor} doesn&apos;t)
          </p>

          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {FEATURE_WALL.map((f) => (
              <div
                key={f.title}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4"
              >
                <FeatureIcon />
                <span className="text-sm font-medium text-[#261B07]">{f.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 7 — Final CTA                                       */}
      {/* ============================================================ */}
      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-[clamp(36px,5vw,56px)] leading-tight font-[800] tracking-[-1.5px] text-[#261B07]">
            Why settle? Switch to Ratiba for a better experience.
          </h2>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-[10px] bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
            <Link
              href="/demo"
              className="rounded-[10px] border border-[rgba(38,27,7,0.2)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
            >
              Book a demo
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/*  SECTION 8 — FAQs                                            */}
      {/* ============================================================ */}
      {data.faqs.length > 0 && (
        <section className="border-t border-gray-100 bg-[#F8F7F5] px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-heading text-3xl font-bold text-[#261B07]">
              Frequently Asked Questions
            </h2>
            <div className="mt-8 space-y-6">
              {data.faqs.map((faq, i) => (
                <div key={i}>
                  <h3 className="text-lg font-semibold text-[#261B07]">{faq.question}</h3>
                  <p className="mt-1 text-[#261B07]/50">{faq.answer}</p>
                </div>
              ))}
            </div>
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
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}
