'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Plus } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const features = [
  {
    title: 'AI-powered itinerary builder',
    description:
      'Go from a rough brief to a polished day-by-day itinerary in minutes. AI suggests lodges, activities, and routes based on your content library.',
    image: 'https://brand.makisala.com/ai-feat.jpg',
  },
  {
    title: 'Live client proposals',
    description:
      'Send interactive, mobile-optimized proposals your clients can view, comment on, and approve — no PDFs, no downloads, no back-and-forth.',
    image: 'https://brand.makisala.com/content-library.jpg',
  },
  {
    title: 'Real-time team collaboration',
    description:
      'Sales and ops work on the same live itinerary. Tag teammates, leave comments, and keep everyone aligned without email chains or version chaos.',
    image: 'https://brand.makisala.com/team_tagging.jpg',
  },
  {
    title: 'Built-in pricing engine',
    description:
      'Set per-night rates, seasonal pricing, and markup rules once. Ratiba calculates margins and totals automatically as you build the trip.',
    image: 'https://brand.makisala.com/pricing.png',
  },
  {
    title: 'Content library',
    description:
      'Store lodge descriptions, activity details, and destination copy in one place. Drag them into any itinerary — consistent, branded, and ready to send.',
    image: 'https://brand.makisala.com/content-library.jpg',
  },
  {
    title: 'Branded proposal themes',
    description:
      'Choose from multiple themes that match your brand. Upload your logo, set your colors, and send proposals that look like they came from a design team.',
    image: 'https://brand.makisala.com/content-library.jpg',
  },
];

const useCaseTags = ['Safari operators', 'DMCs', 'Travel agents', 'Luxury travel', 'Group tours'];

const caseStudies = [
  {
    category: 'Safari operator',
    headline: 'From 3 hours per proposal to 20 minutes',
    metric: '80% faster proposals',
    company: 'Safari operator',
    image: 'https://brand.makisala.com/ai-feat.jpg',
  },
  {
    category: 'DMC',
    headline: 'One workspace for sales and operations',
    metric: 'Zero version conflicts',
    company: 'DMC',
    image: 'https://brand.makisala.com/team_tagging.jpg',
  },
  {
    category: 'Travel agency',
    headline: 'Clients approve trips without a single phone call',
    metric: '3x faster approvals',
    company: 'Travel agency',
    image: 'https://brand.makisala.com/comments.jpg',
  },
];

const trustedLogos = [
  { name: 'Nomad Tanzania', src: '/logos/nomad.svg', width: 128 },
  { name: 'Lemala Camps & Lodges', src: '/logos/lemala.svg', width: 156, invertOnLight: true },
  { name: 'Asilia Africa', src: '/logos/asilia.svg', width: 132 },
  { name: 'Elewana Collection', src: '/logos/elewana.png', width: 136, invertOnLight: true },
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

/* ------------------------------------------------------------------ */
/*  FAQ Accordion                                                      */
/* ------------------------------------------------------------------ */

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[rgba(38,27,7,0.1)]">
      <button
        type="button"
        className="flex w-full items-center justify-between py-7 text-left"
        onClick={() => setOpen(!open)}
      >
        <span
          className="pr-8 text-[#261B07]"
          style={{
            fontSize: 'clamp(20px, 2.5vw, 36px)',
            fontWeight: 584,
            letterSpacing: '-0.36px',
            lineHeight: '1.12',
          }}
        >
          {question}
        </span>
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="shrink-0"
        >
          <Plus className="h-6 w-6 text-[rgba(38,27,7,0.4)]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-7 text-base leading-relaxed text-[rgba(38,27,7,0.7)]">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function FeaturesPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* ============================================================ */}
        {/*  HERO — two-column: text left, product image right           */}
        {/* ============================================================ */}
        <section style={{ padding: '80px 0 160px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col gap-10 md:flex-row md:items-center">
              {/* Left column */}
              <div className="md:w-1/2">
                <motion.div
                  {...fadeUp}
                  className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[rgba(38,27,7,0.1)] bg-white px-3 py-1.5"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-[#261B07]">
                    <span className="text-[10px] font-bold text-[#F8F7F5]">R</span>
                  </div>
                  <span className="text-sm font-medium">Product</span>
                </motion.div>

                <motion.h1
                  {...fadeUp}
                  style={{
                    fontSize: 'clamp(40px, 5vw, 72px)',
                    fontWeight: 584,
                    letterSpacing: '-1.44px',
                    lineHeight: '1',
                  }}
                >
                  Build itineraries. Send proposals. Close trips.
                </motion.h1>

                <motion.p
                  {...fadeUp}
                  className="mt-6 max-w-lg text-[rgba(38,27,7,0.7)]"
                  style={{ fontSize: '20px', lineHeight: '25px' }}
                >
                  Everything your team needs to plan safari itineraries, price trips accurately, and
                  send proposals clients can approve in one click.
                </motion.p>

                <motion.div {...fadeUp} className="mt-8 flex items-center gap-3">
                  <Link
                    href="/demo"
                    className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                  >
                    Book a demo
                  </Link>
                  <Link
                    href="/proposal/tjksu"
                    className="flex items-center gap-2 rounded-xl border border-[rgba(38,27,7,0.18)] px-6 py-3 text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70"
                  >
                    See a sample itinerary
                  </Link>
                </motion.div>
              </div>

              {/* Right column — hero product image */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="md:w-1/2"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src="https://brand.makisala.com/Screenshot%202026-02-27%20at%2019.58.52.png"
                    alt="Ratiba itinerary builder screenshot"
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* ============================================================ */}
        {/*  FEATURES — sticky left text + 2-col card grid on right      */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col gap-10 md:flex-row">
              {/* Sticky left column */}
              <div className="md:w-[41.67%]">
                <div className="md:sticky md:top-32">
                  <motion.h2
                    {...fadeUp}
                    style={{
                      fontSize: 'clamp(36px, 4vw, 56px)',
                      fontWeight: 584,
                      letterSpacing: '-1.12px',
                      lineHeight: '1.12',
                    }}
                  >
                    Everything you need to run a modern safari business
                  </motion.h2>
                  <motion.p
                    {...fadeUp}
                    className="mt-5 text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '16px', lineHeight: '20px' }}
                  >
                    Stop juggling Google Docs, spreadsheets, and PDFs. Ratiba brings itinerary
                    planning, pricing, and client proposals into one workspace built for tour
                    operators.
                  </motion.p>
                </div>
              </div>

              {/* Right column — 2-col card grid */}
              <div className="flex-1">
                <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {features.map((feature, i) => (
                    <motion.li
                      key={feature.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className="flex flex-col overflow-hidden rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white"
                    >
                      {/* Card image area */}
                      <div className="relative aspect-[3/2] overflow-hidden bg-[#ede8e0]">
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      {/* Card body */}
                      <div className="p-5">
                        <h3
                          className="text-[#261B07]"
                          style={{
                            fontSize: '20px',
                            fontWeight: 584,
                            letterSpacing: '-0.2px',
                            lineHeight: '25px',
                          }}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className="mt-2 text-[rgba(38,27,7,0.7)]"
                          style={{ fontSize: '16px', lineHeight: '20px' }}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  WHERE TEAMS SEE THE IMPACT — dark section, two-column       */}
        {/* ============================================================ */}
        <section
          className="text-[#F8F7F5]"
          style={{ backgroundColor: 'rgb(38, 27, 7)', padding: '160px 0' }}
        >
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col items-center gap-10 md:flex-row">
              {/* Left text */}
              <div className="md:w-1/2">
                <motion.h2
                  {...fadeUp}
                  style={{
                    fontSize: 'clamp(36px, 4vw, 56px)',
                    fontWeight: 584,
                    letterSpacing: '-1.12px',
                    lineHeight: '1.12',
                    color: '#F8F7F5',
                  }}
                >
                  Built for every type of operator
                </motion.h2>
                <motion.p
                  {...fadeUp}
                  className="mt-5"
                  style={{
                    fontSize: '16px',
                    lineHeight: '20px',
                    color: 'rgba(248, 247, 245, 0.7)',
                  }}
                >
                  Whether you run 10 trips a month or 200, Ratiba scales with your business. From
                  solo safari operators to large DMCs with multi-department teams — the same
                  workflow, zero growing pains.
                </motion.p>

                {/* Tags */}
                <motion.ul {...fadeUp} className="mt-8 flex flex-wrap gap-2">
                  {useCaseTags.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-[rgba(248,247,245,0.2)] px-4 py-2 text-sm font-medium text-[#F8F7F5]"
                    >
                      {tag}
                    </li>
                  ))}
                </motion.ul>
              </div>

              {/* Right image */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="md:w-1/2"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src="https://brand.makisala.com/content-library.jpg"
                    alt="Ratiba proposal builder"
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  TESTIMONIAL — centered large quote                          */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <motion.div {...fadeUp} className="mx-auto max-w-4xl">
              <blockquote
                className="text-[#261B07]"
                style={{
                  fontSize: 'clamp(24px, 3vw, 40px)',
                  fontWeight: 400,
                  letterSpacing: '-0.5px',
                  lineHeight: '1.25',
                }}
              >
                <span className="text-[rgba(38,27,7,0.2)]">&ldquo;</span>We used to spend hours
                copying lodge details into Word documents and manually calculating prices in Excel.
                With Ratiba, the itinerary builds itself and the client gets a proposal they can
                actually interact with. It changed how we sell.&rdquo;
              </blockquote>

              <div className="mt-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#261B07]">
                    <span className="text-xs font-[580] text-[#F8F7F5]">SO</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#261B07]">Safari Operator</p>
                    <p className="text-sm text-[rgba(38,27,7,0.5)]">Arusha, Tanzania</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* ============================================================ */}
        {/*  CASE STUDIES — 3-column cards with images                    */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            {/* Header row */}
            <div className="flex flex-wrap items-end justify-between gap-5">
              <motion.h2
                {...fadeUp}
                style={{
                  fontSize: 'clamp(36px, 4vw, 56px)',
                  fontWeight: 584,
                  letterSpacing: '-1.12px',
                  lineHeight: '1.12',
                }}
              >
                How operators use Ratiba
              </motion.h2>
              <motion.div {...fadeUp}>
                <Link
                  href="/demo"
                  className="rounded-xl bg-[#261B07] px-6 py-3 text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90"
                >
                  Book a demo
                </Link>
              </motion.div>
            </div>

            {/* Cards */}
            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {caseStudies.map((study, i) => (
                <motion.div
                  key={study.company}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group cursor-pointer overflow-hidden rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white transition-shadow hover:shadow-md"
                >
                  {/* Image */}
                  <div className="aspect-[16/9] overflow-hidden bg-[#ede8e0]">
                    <img
                      src={study.image}
                      alt={study.headline}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <span className="text-xs font-medium tracking-wider text-[rgba(38,27,7,0.4)] uppercase">
                      {study.category}
                    </span>
                    <h3
                      className="mt-2 text-[#261B07]"
                      style={{
                        fontSize: '20px',
                        fontWeight: 584,
                        letterSpacing: '-0.2px',
                        lineHeight: '25px',
                      }}
                    >
                      {study.headline}
                    </h3>
                    <div className="mt-4 flex items-center gap-4 text-xs text-[rgba(38,27,7,0.4)]">
                      <span>{study.metric}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  LOGO TICKER — horizontal scrolling logos                     */}
        {/* ============================================================ */}
        <section className="pb-12">
          <div className="mx-auto max-w-[1216px] px-6">
            <p
              className="mb-8 text-center tracking-widest uppercase"
              style={{
                fontSize: '12px',
                fontWeight: 492,
                letterSpacing: '0.6px',
                color: 'rgb(38, 27, 7)',
              }}
            >
              Trusted by tour operators and travel companies worldwide
            </p>
          </div>
          <div className="relative w-full overflow-hidden">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#F8F7F5] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#F8F7F5] to-transparent" />
            <motion.div
              className="flex w-max gap-12"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 25,
                  ease: 'linear',
                },
              }}
            >
              {[...Array(2)].map((_, setIndex) =>
                trustedLogos.map((logo) => (
                  <div
                    key={`${setIndex}-${logo.name}`}
                    className="flex h-12 w-[188px] shrink-0 items-center justify-center"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="max-h-[30px] object-contain opacity-[0.72]"
                      style={{
                        width: `${logo.width}px`,
                        filter: logo.invertOnLight ? 'brightness(0) saturate(100%)' : 'none',
                      }}
                    />
                  </div>
                )),
              )}
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  FAQ — left-aligned heading, accordion with + icons           */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <motion.h2
              {...fadeUp}
              className="mb-12"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                fontWeight: 584,
                letterSpacing: '-1.12px',
                lineHeight: '1.12',
              }}
            >
              Frequently asked questions
            </motion.h2>

            <motion.div {...fadeUp}>
              {faqs.map((faq) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
              {/* Bottom border */}
              <div className="border-t border-[rgba(38,27,7,0.1)]" />
            </motion.div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  BOTTOM CTA — centered card with muted bg                    */}
        {/* ============================================================ */}
        <section className="px-6 pb-24">
          <motion.div
            {...fadeUp}
            className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-[28px] border border-[rgba(38,27,7,0.08)] bg-white p-[clamp(32px,5vw,56px)_clamp(20px,4vw,40px)] text-center shadow-[0_18px_40px_rgba(38,27,7,0.05)]"
          >
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
          </motion.div>
        </section>
        {/* JSON-LD FAQPage schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
}
