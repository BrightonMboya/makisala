'use client';

import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { Reviews } from '@/components/landing/Reviews';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';
import {
  organizationSchema,
  websiteSchema,
  softwareApplicationSchema,
  faqPageSchema,
  homepageFaqs,
  jsonLd,
} from '@/lib/schema';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const trustedLogos = [
  {
    name: 'Nomad Tanzania',
    src: '/logos/nomad.svg',
    width: 128,
  },
  {
    name: 'Lemala Camps & Lodges',
    src: '/logos/lemala.svg',
    width: 156,
    invertOnLight: true,
  },
  {
    name: 'Asilia Africa',
    src: '/logos/asilia.svg',
    width: 132,
  },
  {
    name: 'Elewana Collection',
    src: '/logos/elewana.png',
    width: 136,
    invertOnLight: true,
  },
];

export default function LandingPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        <Hero />

        {/* Trusted By */}
        <section
          id="customers"
          className="flex flex-col items-center gap-8 overflow-hidden py-12 md:py-16"
        >
          <motion.h2
            {...fadeUp}
            className="px-6 text-center text-[clamp(32px,5vw,56px)] leading-[1.2] font-[580] tracking-[-2px] text-[#261B07] lg:px-28"
          >
            Built for modern travel teams
          </motion.h2>
          {/* Marquee */}
          <div className="relative w-full">
            {/* Fade edges */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#F8F7F5] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#F8F7F5] to-transparent" />
            <motion.div
              className="flex w-max gap-6"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
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

        <FeaturesSection />

        {/* Collaboration section */}
        <section className="flex flex-col gap-8 px-6 py-12 md:py-20 lg:px-28">
          <div className="mx-auto w-full max-w-[1216px]">
            {/* Header */}
            <motion.div {...fadeUp} className="mb-8 flex flex-col items-center gap-4">
              <h2 className="text-center text-[clamp(32px,5vw,56px)] leading-[1.2] font-[580] tracking-[-2px] text-[#261B07]">
                One team. One itinerary.
              </h2>
              <p className="max-w-[700px] text-center text-xl leading-6 text-[#261B07]">
                Sales, ops, and managers work in one shared space.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="flex flex-col gap-4 md:flex-row">
              {[
                {
                  title: 'Tag the right teammate instantly',
                  description: 'Bring the right person into the right itinerary fast.',
                  tags: ['@mentions', 'Shared workspace', 'Faster approvals', 'Clear ownership'],
                },
                {
                  title: 'Keep pricing and trip details aligned',
                  description: 'Keep pricing and trip details in sync.',
                  tags: ['Live edits', 'One version', 'Accurate pricing'],
                },
                {
                  title: 'Capture client feedback in context',
                  description: 'Clients comment on the proposal in context.',
                  tags: ['Live comments', 'Fewer calls', 'Less confusion'],
                },
              ].map((card, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1] as const,
                  }}
                  className="flex flex-1 flex-col gap-3 rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-6"
                >
                  <h3 className="text-xl leading-6 font-[580] text-[#261B07]">{card.title}</h3>
                  <p className="text-base leading-[150%] text-[rgba(38,27,7,0.7)]">
                    {card.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg bg-[#EEECEA] px-3 py-2 text-sm leading-[18px] text-[#261B07]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Value Props */}
        <section className="flex flex-col gap-4 px-6 pb-12 md:flex-row md:pb-20 lg:px-28">
          {[
            {
              title: 'Win back proposal time',
              description: 'Build the itinerary and send faster.',
            },
            {
              title: 'Make your brand look premium',
              description: 'Look polished in every proposal.',
            },
            {
              title: 'Pay for growth, not headcount',
              description: 'Grow without seat-based pricing.',
            },
          ].map((prop, i) => (
            <motion.div
              key={i}
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
              <h3 className="text-xl leading-6 font-[580] text-[#261B07]">{prop.title}</h3>
              <p className="text-base leading-[150%] text-[rgba(38,27,7,0.7)]">
                {prop.description}
              </p>
            </motion.div>
          ))}
        </section>

        <Reviews />

        {/* What is Ratiba — LLM-friendly Q&A */}
        <section className="flex flex-col px-6 py-16 md:py-24 lg:px-28">
          <div className="mx-auto w-full max-w-[1100px]">
            <motion.div {...fadeUp} className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-[580] text-[rgba(38,27,7,0.5)]">
                  What is Ratiba?
                </p>
                <h2 className="mt-3 text-[clamp(32px,4vw,48px)] leading-[1.1] font-[580] tracking-[-1.6px] text-[#261B07]">
                  Safari software, answered
                </h2>
                <p className="mt-4 max-w-md text-[rgba(38,27,7,0.7)] leading-7">
                  Straight answers about what Ratiba is, who it is for, and how it compares.
                </p>
              </div>

              <div>
                {homepageFaqs.map((faq) => (
                  <details
                    key={faq.question}
                    className="group border-t border-[rgba(38,27,7,0.1)] last:border-b"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden list-none">
                      <span className="text-[clamp(17px,1.6vw,20px)] font-[580] leading-[1.3] text-[#261B07]">
                        {faq.question}
                      </span>
                      <span className="shrink-0 text-[rgba(38,27,7,0.4)] transition-transform group-open:rotate-45">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-6 text-base leading-7 text-[rgba(38,27,7,0.75)]">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Sample Itineraries */}
        <section id="features" className="flex flex-col px-6 py-12 md:py-20 lg:px-28">
          <div className="mx-auto w-full max-w-[1216px]">
            <motion.div {...fadeUp} className="mb-12 flex flex-col items-center gap-4">
              <h2 className="text-center text-[clamp(32px,5vw,56px)] leading-[1.2] font-[580] tracking-[-2px] text-[#261B07]">
                Get a glimpse of what&apos;s <em>possible</em>
              </h2>
              <p className="text-center text-lg leading-7 text-[rgba(38,27,7,0.7)]">
                Explore some sample itineraries below — all made with Ratiba.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  badge: { label: 'Custom', color: '#FFE0EC' },
                  title: 'Custom Safari',
                  subtitle: 'Custom Gorilla Trekking Safari',
                  href: '/proposal/fesyck',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/destinations/rwanda/gorilla.jpg',
                },
                {
                  badge: { label: 'Lookbook', color: '#E0F0FF' },
                  title: 'Zanzibar Escape',
                  subtitle: 'Zanzibar Lookbook Escape',
                  href: '/proposal/qgzaka',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1772879807340-43ed50b7c65549688f1c879fd60ce826-800.webp',
                },
                {
                  badge: { label: 'Branded', color: '#FFE0EC' },
                  title: 'Signature Journey',
                  subtitle: 'Northern Circuit Branded Journey',
                  href: '/proposal/rnxdpk',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1770650569417-pexels-isis-petroni-280715053-13142739.webp',
                },
                {
                  badge: { label: 'Honeymoon', color: '#E0F0FF' },
                  title: 'Honeymoon Escape',
                  subtitle: 'Romantic Honeymoon Escape',
                  href: '/proposal/lmxmro',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/accommodations/c1a5284f-5401-4b86-b3c0-16c2df4c5fe1/24.jpg',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.06,
                    ease: [0.16, 1, 0.3, 1] as const,
                  }}
                  className="flex flex-col rounded-3xl border border-[rgba(38,27,7,0.08)] bg-white shadow-[0_16px_36px_rgba(38,27,7,0.06)] transition-transform hover:-translate-y-1"
                >
                  <Link
                    href={item.href}
                    className="flex flex-col gap-4 p-4 transition-opacity hover:opacity-90"
                  >
                    {/* Image preview */}
                    <div className="flex aspect-[16/10] items-center justify-center overflow-hidden rounded-[18px] border border-[rgba(38,27,7,0.06)] bg-[#F6F2EB] p-3">
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#EEECEA]">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span className="text-sm text-[rgba(38,27,7,0.3)]">{item.title}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2.5 px-1 pb-1.5">
                      <div>
                        <span
                          className="rounded-full px-2.5 py-1 text-xs leading-4 font-medium text-[#261B07]"
                          style={{ backgroundColor: item.badge.color }}
                        >
                          {item.badge.label}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <h3 className="text-xl leading-[26px] font-[580] tracking-[-0.02em] text-[#261B07]">
                          {item.title}
                        </h3>
                        <p className="text-sm leading-5 text-[rgba(38,27,7,0.55)]">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col px-6 py-16 md:py-24 lg:px-28">
          <motion.div
            {...fadeUp}
            className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-5 rounded-[28px] border border-[rgba(38,27,7,0.08)] bg-white p-[clamp(32px,5vw,56px)_clamp(20px,4vw,40px)] text-center shadow-[0_18px_40px_rgba(38,27,7,0.05)]"
          >
            <h2 className="max-w-[620px] text-[clamp(28px,4vw,46px)] leading-[1.15] font-[580] tracking-[-2px] text-[#261B07]">
              Ready to show clients something better?
            </h2>
            <p className="max-w-[560px] text-lg leading-7 text-[rgba(38,27,7,0.7)]">
              Build the itinerary together, price it clearly, and send a proposal clients can
              comment on in real time.
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

      {/* JSON-LD: Organization, WebSite, SoftwareApplication, FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(softwareApplicationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqPageSchema) }}
      />
    </div>
  );
}
