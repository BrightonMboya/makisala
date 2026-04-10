import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import {
  getGlossaryTerm,
  getAllGlossaryTermSlugs,
  getAllGlossaryTerms,
} from '@/lib/glossary';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ term: string }>;
}

/* ------------------------------------------------------------------ */
/*  Static params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return getAllGlossaryTermSlugs().map((term) => ({ term }));
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { term: slug } = await params;
  const entry = getGlossaryTerm(slug);
  if (!entry) return {};

  const title = `What is ${entry.fullName}? | Safari Glossary — Ratiba`;
  const description = entry.definition.slice(0, 155);

  return {
    title,
    description,
    alternates: {
      canonical: `/glossary/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/glossary/${slug}`,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function GlossaryTermPage({ params }: Props) {
  const { term: slug } = await params;
  const entry = getGlossaryTerm(slug);
  if (!entry) notFound();

  // Resolve related terms to their full data
  const allTerms = getAllGlossaryTerms();
  const relatedTerms = entry.relatedTerms
    .map((s) => allTerms.find((t) => t.slug === s))
    .filter(Boolean);

  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* Breadcrumb */}
        <section style={{ paddingTop: '40px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <nav className="flex items-center gap-2 text-sm text-[rgba(38,27,7,0.5)]">
              <Link href="/glossary" className="hover:text-[#261B07] transition-colors">
                Glossary
              </Link>
              <span>/</span>
              <span className="text-[#261B07]">{entry.fullName}</span>
            </nav>
          </div>
        </section>

        {/* Term header */}
        <section style={{ padding: '40px 0 48px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="max-w-3xl">
              <h1
                style={{
                  fontSize: 'clamp(36px, 5vw, 56px)',
                  fontWeight: 584,
                  letterSpacing: '-1.12px',
                  lineHeight: '1.12',
                }}
              >
                {entry.fullName}
                {entry.term !== entry.fullName && (
                  <span className="ml-3 text-[rgba(38,27,7,0.35)]" style={{ fontSize: '0.6em' }}>
                    ({entry.term})
                  </span>
                )}
              </h1>
              <p
                className="mt-6 text-[rgba(38,27,7,0.7)]"
                style={{ fontSize: '20px', lineHeight: '28px' }}
              >
                {entry.definition}
              </p>
            </div>
          </div>
        </section>

        {/* Details */}
        <section style={{ paddingBottom: '48px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="max-w-3xl">
              {entry.details.split('\n\n').map((paragraph, i) => (
                <p
                  key={i}
                  className="mt-4 first:mt-0 text-[rgba(38,27,7,0.7)]"
                  style={{ fontSize: '16px', lineHeight: '26px' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* How Ratiba helps — callout box */}
        <section style={{ paddingBottom: '48px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="max-w-3xl rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#261B07]">
                  <span className="text-[10px] font-bold text-[#F8F7F5]">R</span>
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 584, letterSpacing: '-0.2px' }}>
                  How Ratiba helps
                </h2>
              </div>
              <p
                className="text-[rgba(38,27,7,0.7)]"
                style={{ fontSize: '16px', lineHeight: '26px' }}
              >
                {entry.howRatibaHelps}
              </p>
              <div className="mt-5">
                <Link
                  href="/demo"
                  className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                >
                  Book a demo
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Related terms */}
        {relatedTerms.length > 0 && (
          <section style={{ paddingBottom: '64px' }}>
            <div className="mx-auto max-w-[1216px] px-6">
              <div className="max-w-3xl">
                <h2
                  className="mb-5"
                  style={{ fontSize: '22px', fontWeight: 584, letterSpacing: '-0.3px' }}
                >
                  Related terms
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {relatedTerms.map((related) => (
                    <Link
                      key={related!.slug}
                      href={`/glossary/${related!.slug}`}
                      className="group rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-5 transition-shadow hover:shadow-md"
                    >
                      <h3
                        className="text-[#261B07] group-hover:underline"
                        style={{
                          fontSize: '16px',
                          fontWeight: 584,
                          letterSpacing: '-0.2px',
                        }}
                      >
                        {related!.fullName}
                      </h3>
                      <p
                        className="mt-1.5 line-clamp-2 text-[rgba(38,27,7,0.7)]"
                        style={{ fontSize: '14px', lineHeight: '20px' }}
                      >
                        {related!.definition}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
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

        {/* JSON-LD DefinedTerm schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'DefinedTerm',
              name: entry.fullName,
              description: entry.definition,
              inDefinedTermSet: {
                '@type': 'DefinedTermSet',
                name: 'Safari & Travel Industry Glossary',
                url: 'https://ratiba.africa/glossary',
              },
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
