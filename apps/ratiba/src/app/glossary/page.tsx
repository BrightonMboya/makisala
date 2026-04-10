import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { getAllGlossaryTerms } from '@/lib/glossary';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safari & Travel Industry Glossary — Ratiba',
  description:
    'Learn key safari industry terms — from DMC and FIT to rack rates, net rates, and seasonal pricing. A quick-reference glossary for tour operators and travel professionals.',
  alternates: {
    canonical: '/glossary',
  },
};

export default function GlossaryIndexPage() {
  const allTerms = getAllGlossaryTerms();

  // Group terms by first letter
  const grouped = new Map<string, typeof allTerms>();
  for (const term of allTerms) {
    const letter = term.term[0]!.toUpperCase();
    if (!grouped.has(letter)) grouped.set(letter, []);
    grouped.get(letter)!.push(term);
  }
  const letters = Array.from(grouped.keys()).sort();

  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* Hero */}
        <section style={{ padding: '80px 0 64px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h1
                style={{
                  fontSize: 'clamp(40px, 5vw, 72px)',
                  fontWeight: 584,
                  letterSpacing: '-1.44px',
                  lineHeight: '1',
                }}
              >
                Safari & Travel Industry Glossary
              </h1>
              <p
                className="mx-auto mt-6 max-w-xl text-[rgba(38,27,7,0.7)]"
                style={{ fontSize: '20px', lineHeight: '28px' }}
              >
                Key terms every tour operator, DMC, and travel professional should know — from
                accommodation types to pricing models.
              </p>
            </div>
          </div>
        </section>

        {/* Letter navigation */}
        <section className="pb-12">
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-wrap justify-center gap-2">
              {letters.map((letter) => (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(38,27,7,0.08)] bg-white text-sm font-[580] text-[#261B07] transition-colors hover:bg-[#261B07] hover:text-[#F8F7F5]"
                >
                  {letter}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Term listings grouped by letter */}
        <section style={{ paddingBottom: '80px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="space-y-12">
              {letters.map((letter) => (
                <div key={letter} id={`letter-${letter}`}>
                  <h2
                    className="mb-4 border-b border-[rgba(38,27,7,0.1)] pb-2 text-[#261B07]"
                    style={{ fontSize: '28px', fontWeight: 584, letterSpacing: '-0.5px' }}
                  >
                    {letter}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped.get(letter)!.map((term) => (
                      <Link
                        key={term.slug}
                        href={`/glossary/${term.slug}`}
                        className="group rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-5 transition-shadow hover:shadow-md"
                      >
                        <h3
                          className="text-[#261B07] group-hover:underline"
                          style={{
                            fontSize: '18px',
                            fontWeight: 584,
                            letterSpacing: '-0.2px',
                            lineHeight: '24px',
                          }}
                        >
                          {term.fullName}
                        </h3>
                        <p
                          className="mt-2 line-clamp-2 text-[rgba(38,27,7,0.7)]"
                          style={{ fontSize: '14px', lineHeight: '20px' }}
                        >
                          {term.definition}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="px-6 pb-24">
          <div className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-[28px] border border-[rgba(38,27,7,0.08)] bg-white p-[clamp(32px,5vw,56px)_clamp(20px,4vw,40px)] text-center shadow-[0_18px_40px_rgba(38,27,7,0.05)]">
            <h2 className="max-w-[620px] text-[clamp(28px,4vw,46px)] leading-[1.15] font-[580] tracking-[-2px] text-[#261B07]">
              Built for safari operators
            </h2>
            <p className="max-w-[560px] text-lg leading-7 text-[rgba(38,27,7,0.7)]">
              Ratiba helps tour operators build itineraries, price trips, and send proposals clients
              love. See how it works.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/demo"
                className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
              >
                Book a demo
              </Link>
              <Link
                href="/features"
                className="rounded-xl border border-[rgba(38,27,7,0.18)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
              >
                See all features
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
