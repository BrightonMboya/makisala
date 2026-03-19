'use client';

import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { Reviews } from '@/components/landing/Reviews';
import { Footer } from '@/components/landing/Footer';
import { motion } from 'framer-motion';

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
    <div style={{ backgroundColor: '#F8F7F5', color: '#261B07' }}>
      <Navbar />

      <main>
        <Hero />

        {/* Trusted By */}
        <section
          id="customers"
          className="flex flex-col items-center overflow-hidden py-12 md:py-16"
          style={{ gap: '32px' }}
        >
          <motion.h2
            {...fadeUp}
            className="px-6 text-center lg:px-28"
            style={{
              fontSize: 'clamp(32px, 5vw, 56px)',
              letterSpacing: '-2px',
              lineHeight: '1.2',
              color: '#261B07',
              fontWeight: 580,
            }}
          >
            Built for modern travel teams
          </motion.h2>
          {/* Marquee */}
          <div className="relative w-full">
            {/* Fade edges */}
            <div
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24"
              style={{
                background: 'linear-gradient(to right, #F8F7F5, transparent)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
              style={{
                background: 'linear-gradient(to left, #F8F7F5, transparent)',
              }}
            />
            <motion.div
              className="flex w-max"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 20,
                  ease: 'linear',
                },
              }}
              style={{ gap: '24px' }}
            >
              {[...Array(2)].map((_, setIndex) =>
                trustedLogos.map((logo) => (
                  <div
                    key={`${setIndex}-${logo.name}`}
                    className="flex shrink-0 items-center justify-center"
                    style={{
                      width: '188px',
                      height: '48px',
                    }}
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      style={{
                        width: `${logo.width}px`,
                        maxHeight: '30px',
                        objectFit: 'contain',
                        opacity: 0.72,
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
        <section
          className="flex flex-col px-6 py-12 md:py-20 lg:px-28"
          style={{ gap: '32px' }}
        >
          <div className="mx-auto" style={{ maxWidth: '1216px', width: '100%' }}>
            {/* Header */}
            <motion.div
              {...fadeUp}
              className="flex flex-col items-center"
              style={{ gap: '16px', marginBottom: '32px' }}
            >
              <h2
                className="text-center"
                style={{
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  letterSpacing: '-2px',
                  lineHeight: '1.2',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                One team. One itinerary.
              </h2>
              <p
                className="text-center"
                style={{
                  fontSize: '20px',
                  lineHeight: '24px',
                  color: '#261B07',
                  fontWeight: 400,
                  maxWidth: '700px',
                }}
              >
                Sales, ops, and managers work in one shared space.
              </p>
            </motion.div>

            {/* Cards */}
            <div className="flex flex-col md:flex-row" style={{ gap: '16px' }}>
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
                  className="flex flex-1 flex-col rounded-2xl border"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(38,27,7,0.08)',
                    padding: '24px',
                    gap: '12px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '20px',
                      lineHeight: '24px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    {card.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: 'rgba(38,27,7,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    {card.description}
                  </p>
                  <div className="flex flex-wrap" style={{ gap: '8px' }}>
                    {card.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg"
                        style={{
                          backgroundColor: '#EEECEA',
                          padding: '8px 12px',
                          fontSize: '14px',
                          lineHeight: '18px',
                          color: '#261B07',
                          fontWeight: 400,
                        }}
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
        <section
          className="flex flex-col px-6 pb-12 md:flex-row md:pb-20 lg:px-28"
          style={{
            paddingTop: '0px',
            gap: '16px',
          }}
        >
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
              className="flex flex-1 flex-col rounded-2xl border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(38,27,7,0.08)',
                padding: '28px',
                gap: '12px',
              }}
            >
              <h3
                style={{
                  fontSize: '20px',
                  lineHeight: '24px',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                {prop.title}
              </h3>
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: 'rgba(38,27,7,0.7)',
                  fontWeight: 400,
                }}
              >
                {prop.description}
              </p>
            </motion.div>
          ))}
        </section>

        <Reviews />

        {/* Sample Itineraries */}
        <section
          id="features"
          className="flex flex-col px-6 py-12 md:py-20 lg:px-28"
        >
          <div className="mx-auto" style={{ maxWidth: '1216px', width: '100%' }}>
            <motion.div
              {...fadeUp}
              className="flex flex-col items-center"
              style={{ gap: '16px', marginBottom: '48px' }}
            >
              <h2
                className="text-center"
                style={{
                  fontSize: 'clamp(32px, 5vw, 56px)',
                  letterSpacing: '-2px',
                  lineHeight: '1.2',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                Get a glimpse of what&apos;s <em>possible</em>
              </h2>
              <p
                className="text-center"
                style={{
                  fontSize: '18px',
                  lineHeight: '28px',
                  color: 'rgba(38,27,7,0.7)',
                  fontWeight: 400,
                }}
              >
                Explore some sample itineraries below — all made with Ratiba.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: '16px' }}>
              {[
                {
                  badge: { label: 'Custom', color: '#FFE0EC' },
                  title: 'Custom Safari',
                  subtitle: 'Custom Gorilla Trekking Safari',
                  href: 'https://proposals.makisala.com/proposal/fesyck',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/destinations/rwanda/gorilla.jpg',
                },
                {
                  badge: { label: 'Lookbook', color: '#E0F0FF' },
                  title: 'Zanzibar Escape',
                  subtitle: 'Zanzibar Lookbook Escape',
                  href: 'https://proposals.makisala.com/proposal/qgzaka',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1772879807340-43ed50b7c65549688f1c879fd60ce826-800.webp',
                },
                {
                  badge: { label: 'Branded', color: '#FFE0EC' },
                  title: 'Signature Journey',
                  subtitle: 'Northern Circuit Branded Journey',
                  href: 'https://proposals.makisala.com/proposal/rnxdpk',
                  image:
                    'https://assets.makisala.com/cdn-cgi/image/quality=85,format=auto,fit=scale-down,sharpen=1/organizations/411c36e8-0808-46f4-a3b2-130a3eecc349/images/1770650569417-pexels-isis-petroni-280715053-13142739.webp',
                },
                {
                  badge: { label: 'Honeymoon', color: '#E0F0FF' },
                  title: 'Honeymoon Escape',
                  subtitle: 'Romantic Honeymoon Escape',
                  href: 'https://proposals.makisala.com/proposal/lmxmro',
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
                  className="flex flex-col rounded-[24px] border transition-transform hover:-translate-y-1"
                  style={{
                    borderColor: 'rgba(38,27,7,0.08)',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 16px 36px rgba(38,27,7,0.06)',
                  }}
                >
                  <Link
                    href={item.href}
                    className="flex flex-col p-4 transition-opacity hover:opacity-90"
                    style={{ gap: '16px' }}
                  >
                    {/* Image preview */}
                    <div
                      className="flex items-center justify-center overflow-hidden rounded-[18px] border"
                      style={{
                        backgroundColor: '#F6F2EB',
                        aspectRatio: '16 / 10',
                        borderColor: 'rgba(38,27,7,0.06)',
                        padding: '12px',
                      }}
                    >
                      <div
                        className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px]"
                        style={{ backgroundColor: '#EEECEA' }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-full w-full object-cover object-top"
                          />
                        ) : (
                          <span style={{ color: 'rgba(38,27,7,0.3)', fontSize: '14px' }}>
                            {item.title}
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex flex-col"
                      style={{ gap: '10px', paddingInline: '4px', paddingBottom: '6px' }}
                    >
                      <div>
                        <span
                          className="rounded-full px-2.5 py-1"
                          style={{
                            backgroundColor: item.badge.color,
                            fontSize: '12px',
                            fontWeight: 500,
                            lineHeight: '16px',
                            color: '#261B07',
                          }}
                        >
                          {item.badge.label}
                        </span>
                      </div>

                      <div className="flex flex-col" style={{ gap: '4px' }}>
                        <h3
                          style={{
                            fontSize: '20px',
                            lineHeight: '26px',
                            color: '#261B07',
                            fontWeight: 580,
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{
                            fontSize: '14px',
                            lineHeight: '20px',
                            color: 'rgba(38,27,7,0.55)',
                            fontWeight: 400,
                          }}
                        >
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

        <section
          className="flex flex-col px-6 py-16 md:py-24 lg:px-28"
        >
          <motion.div
            {...fadeUp}
            className="mx-auto flex flex-col items-center rounded-[28px] border text-center"
            style={{
              maxWidth: '960px',
              width: '100%',
              padding: 'clamp(32px, 5vw, 56px) clamp(20px, 4vw, 40px)',
              gap: '20px',
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(38,27,7,0.08)',
              boxShadow: '0 18px 40px rgba(38,27,7,0.05)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                letterSpacing: '-2px',
                lineHeight: '1.15',
                color: '#261B07',
                fontWeight: 580,
                maxWidth: '620px',
              }}
            >
              Ready to show clients something better?
            </h2>
            <p
              style={{
                fontSize: '18px',
                lineHeight: '28px',
                color: 'rgba(38,27,7,0.7)',
                fontWeight: 400,
                maxWidth: '560px',
              }}
            >
              Build the itinerary together, price it clearly, and send a proposal clients can
              comment on in real time.
            </p>
            <div className="flex flex-wrap items-center justify-center" style={{ gap: '14px' }}>
              <Link
                href="https://cal.com/brightonmboya/30min"
                className="rounded-[12px] px-6 py-3 text-sm transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: '#261B07',
                  color: '#F8F7F5',
                  fontWeight: 580,
                }}
              >
                Book a demo
              </Link>
              <Link
                href="/proposal/5a428b26-dde0-4ae8-a3a8-93c8f3938527"
                className="rounded-[12px] border px-6 py-3 text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: 'rgba(38,27,7,0.18)',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                View sample proposal
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
