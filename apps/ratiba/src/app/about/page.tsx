'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const values = [
  {
    title: 'Built for operators',
    description:
      'We understand the safari workflow — seasonal pricing, multi-day itineraries, lodge databases, and client expectations. Ratiba is built around how you actually work.',
  },
  {
    title: 'Simple by default',
    description:
      'No bloat, no steep learning curves. Your team should be sending proposals on day one, not sitting through weeks of onboarding.',
  },
  {
    title: 'Flat, fair pricing',
    description:
      'No per-seat fees that punish you for growing. Add your whole team — sales, ops, managers — without watching costs climb with every hire.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* ============================================================ */}
        {/*  HERO                                                        */}
        {/* ============================================================ */}
        <section style={{ padding: '80px 0 160px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <motion.div
              {...fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[rgba(38,27,7,0.1)] bg-white px-3 py-1.5"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#261B07]">
                <span className="text-[10px] font-bold text-[#F8F7F5]">R</span>
              </div>
              <span className="text-sm font-medium">About</span>
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
              We&apos;re building the operating system for safari businesses
            </motion.h1>

            <motion.p
              {...fadeUp}
              className="mt-6 max-w-xl text-[rgba(38,27,7,0.7)]"
              style={{ fontSize: '20px', lineHeight: '25px' }}
            >
              Ratiba is the itinerary and proposal platform built for safari operators and tour
              companies. We help teams build faster, sell better, and grow without complexity.
            </motion.p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* ============================================================ */}
        {/*  MISSION — Why we built this                                  */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col gap-10 md:flex-row">
              {/* Left column — sticky heading */}
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
                    Why we built Ratiba
                  </motion.h2>
                </div>
              </div>

              {/* Right column — the story */}
              <div className="flex-1">
                <motion.div {...fadeUp} className="flex max-w-lg flex-col gap-6">
                  <p
                    className="text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '18px', lineHeight: '28px' }}
                  >
                    Safari operators run complex businesses. A single trip can involve multiple
                    destinations, dozens of lodges, seasonal pricing shifts, and clients who need to
                    see every detail before they commit.
                  </p>
                  <p
                    className="text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '18px', lineHeight: '28px' }}
                  >
                    Yet most operators still build itineraries in Word documents, calculate pricing
                    in Excel, and send proposals as PDF attachments. The tools weren&apos;t built for
                    this industry — so teams spend hours on work that should take minutes.
                  </p>
                  <p
                    className="text-[rgba(38,27,7,0.7)]"
                    style={{ fontSize: '18px', lineHeight: '28px' }}
                  >
                    We built Ratiba to fix that. One platform where your team can build itineraries,
                    price trips accurately, and send proposals clients can actually interact with —
                    all without stitching together generic tools that don&apos;t understand your
                    workflow.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* ============================================================ */}
        {/*  VALUES — 3 cards in a row                                    */}
        {/* ============================================================ */}
        <section style={{ padding: '160px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <motion.h2
              {...fadeUp}
              className="mb-14"
              style={{
                fontSize: 'clamp(36px, 4vw, 56px)',
                fontWeight: 584,
                letterSpacing: '-1.12px',
                lineHeight: '1.12',
              }}
            >
              What we believe
            </motion.h2>

            <div className="flex flex-col gap-5 md:flex-row">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1] as const,
                  }}
                  className="flex flex-1 flex-col gap-3 rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-7"
                >
                  <h3
                    className="text-[#261B07]"
                    style={{
                      fontSize: '20px',
                      fontWeight: 584,
                      letterSpacing: '-0.2px',
                      lineHeight: '25px',
                    }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-base leading-[150%] text-[rgba(38,27,7,0.7)]">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/*  BOTTOM CTA                                                   */}
        {/* ============================================================ */}
        <section className="px-6 pb-24">
          <motion.div
            {...fadeUp}
            className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-[28px] border border-[rgba(38,27,7,0.08)] bg-white p-[clamp(32px,5vw,56px)_clamp(20px,4vw,40px)] text-center shadow-[0_18px_40px_rgba(38,27,7,0.05)]"
          >
            <h2 className="max-w-[620px] text-[clamp(28px,4vw,46px)] leading-[1.15] font-[580] tracking-[-2px] text-[#261B07]">
              Ready to see what Ratiba can do?
            </h2>
            <p className="max-w-[560px] text-lg leading-7 text-[rgba(38,27,7,0.7)]">
              Book a demo and we&apos;ll walk you through how Ratiba fits your team&apos;s workflow —
              or explore a sample itinerary on your own.
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
                View sample itinerary
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
