'use client';

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

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: '#F8F7F5', color: '#261B07' }}>
      <Navbar />

      <main>
        <Hero />

        {/* Trusted By */}
        <section
          id="customers"
          className="flex flex-col items-center overflow-hidden"
          style={{ paddingBlock: '64px', gap: '32px' }}
        >
          <motion.h2
            {...fadeUp}
            className="text-center"
            style={{
              fontSize: '56px',
              letterSpacing: '-2px',
              lineHeight: '68px',
              color: '#261B07',
              fontWeight: 580,
              paddingInline: '112px',
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
                background:
                  'linear-gradient(to right, #F8F7F5, transparent)',
              }}
            />
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24"
              style={{
                background:
                  'linear-gradient(to left, #F8F7F5, transparent)',
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
              {/* Duplicate logos for seamless loop */}
              {[...Array(2)].map((_, setIndex) =>
                Array.from({ length: 8 }).map((__, i) => (
                  <div
                    key={`${setIndex}-${i}`}
                    className="flex shrink-0 items-center justify-center rounded-lg"
                    style={{
                      width: '120px',
                      height: '40px',
                      backgroundColor: '#EEECEA',
                      marginRight: i < 7 || setIndex < 1 ? '0px' : '0px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '14px',
                        color: 'rgba(38,27,7,0.4)',
                        fontWeight: 400,
                      }}
                    >
                      Logo
                    </span>
                  </div>
                )),
              )}
            </motion.div>
          </div>
        </section>

        <FeaturesSection />

        {/* Collaboration section */}
        <section
          className="flex flex-col"
          style={{ paddingBlock: '80px', paddingInline: '112px', gap: '32px' }}
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
                  fontSize: '56px',
                  letterSpacing: '-2px',
                  lineHeight: '68px',
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
            <div className="flex" style={{ gap: '16px' }}>
              {[
                {
                  title: 'Tag the right teammate instantly',
                  description:
                    'Bring the right person into the right itinerary fast.',
                  tags: ['@mentions', 'Shared workspace', 'Faster approvals', 'Clear ownership'],
                },
                {
                  title: 'Keep pricing and trip details aligned',
                  description:
                    'Keep pricing and trip details in sync.',
                  tags: ['Live edits', 'One version', 'Accurate pricing'],
                },
                {
                  title: 'Capture client feedback in context',
                  description:
                    'Clients comment on the proposal in context.',
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
          className="flex"
          style={{
            paddingTop: '0px',
            paddingRight: '112px',
            paddingBottom: '80px',
            paddingLeft: '112px',
            gap: '16px',
          }}
        >
          {[
            {
              title: 'Win back proposal time',
              description:
                'Build the itinerary and send faster.',
            },
            {
              title: 'Make your brand look premium',
              description:
                'Look polished in every proposal.',
            },
            {
              title: 'Pay for growth, not headcount',
              description:
                'Grow without seat-based pricing.',
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

        {/* All the FP&A essentials */}
        <section
          id="features"
          className="flex flex-col"
          style={{ paddingBlock: '80px', paddingInline: '112px', gap: '48px' }}
        >
          <div className="mx-auto" style={{ maxWidth: '1216px', width: '100%' }}>
            <motion.h2
              {...fadeUp}
              className="text-center"
              style={{
                fontSize: '56px',
                letterSpacing: '-2px',
                lineHeight: '68px',
                color: '#261B07',
                fontWeight: 580,
                marginBottom: '48px',
              }}
            >
              Built for better proposals
            </motion.h2>

            <div className="flex" style={{ gap: '16px' }}>
              {/* Left column */}
              <div
                className="flex shrink-0 flex-col"
                style={{ width: '340px', gap: '16px' }}
              >
                {/* Scenario planning */}
                <motion.div
                  {...fadeUp}
                  className="flex flex-col rounded-xl border"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(38,27,7,0.08)',
                    padding: '20px',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    AI-assisted itinerary builder
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: 'rgba(38,27,7,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    Build day-by-day itineraries faster.
                  </p>
                </motion.div>

                {/* Collaborative budgeting */}
                <motion.div
                  {...fadeUp}
                  className="flex flex-col rounded-xl border"
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderColor: 'rgba(38,27,7,0.08)',
                    padding: '20px',
                    gap: '8px',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    Transparent pricing tools
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: 'rgba(38,27,7,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    Clear pricing clients can understand.
                  </p>
                </motion.div>

                {/* AI hover mode */}
                <motion.div
                  {...fadeUp}
                  className="flex items-center gap-2"
                  style={{ padding: '20px' }}
                >
                  <span
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                >
                  Proposal comments
                </span>
                <span
                    className="rounded-full px-2 py-0.5"
                    style={{
                      backgroundColor: '#261B07',
                      color: '#F8F7F5',
                      fontSize: '11px',
                      fontWeight: 580,
                      lineHeight: '14px',
                    }}
                >
                  Included
                </span>
              </motion.div>

                {/* Interactive reporting */}
                <motion.div {...fadeUp} style={{ padding: '20px' }}>
                  <span
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    Shareable proposal links
                  </span>
                </motion.div>
              </div>

              {/* Right — screenshot placeholder */}
              <div
                className="hidden flex-1 items-center justify-center rounded-2xl md:flex"
                style={{ backgroundColor: '#EEECEA' }}
              >
                <span style={{ color: 'rgba(38,27,7,0.4)', fontSize: '16px' }}>
                  Feature Screenshot
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* More Features Grid */}
        <section
          className="flex"
          style={{
            paddingTop: '0px',
            paddingRight: '112px',
            paddingBottom: '80px',
            paddingLeft: '112px',
          }}
        >
          <div className="mx-auto flex" style={{ maxWidth: '1216px', width: '100%', gap: '16px' }}>
            {/* Left column */}
            <div
              className="flex shrink-0 flex-col"
              style={{ width: '340px', gap: '16px' }}
            >
              {[
                {
                  title: 'Accommodation content library',
                  description:
                    'Find content faster.',
                },
                {
                  title: 'Own images and custom content',
                  description:
                    'Make every proposal feel on-brand.',
                },
                {
                  title: 'Easy for the whole team to use',
                  description:
                    'Easy to learn. Easy to use.',
                },
              ].map((feature, i) => (
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
                  className="flex flex-col"
                  style={{ padding: '20px', gap: '8px' }}
                >
                  <h3
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: 'rgba(38,27,7,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Right — screenshot placeholder */}
            <div
              className="hidden flex-1 items-center justify-center rounded-2xl md:flex"
              style={{ backgroundColor: '#EEECEA' }}
            >
              <span style={{ color: 'rgba(38,27,7,0.4)', fontSize: '16px' }}>
                Feature Screenshot
              </span>
            </div>
          </div>
        </section>

        {/* Onboarding / Fast track to clarity */}
        <section
          className="flex flex-col"
          style={{ paddingBlock: '80px', paddingInline: '112px', gap: '48px' }}
        >
          <div className="mx-auto" style={{ maxWidth: '1216px', width: '100%' }}>
            {/* Header */}
            <motion.div
              {...fadeUp}
              className="flex flex-col items-center"
              style={{ gap: '16px', marginBottom: '48px' }}
            >
              <h2
                className="text-center"
                style={{
                  fontSize: '56px',
                  letterSpacing: '-2px',
                  lineHeight: '68px',
                  color: '#261B07',
                  fontWeight: 580,
                }}
              >
                Fast track to clarity
              </h2>
              <p
                className="text-center"
                style={{
                  fontSize: '16px',
                  lineHeight: '20px',
                  color: '#261B07',
                  fontWeight: 400,
                  maxWidth: '640px',
                }}
              >
                Start building a unified model you can trust as the source of
                truth for planning and forecasting.
              </p>
            </motion.div>

            <motion.p
              {...fadeUp}
              className="mb-10 text-center"
              style={{
                fontSize: '24px',
                lineHeight: '30px',
                color: '#261B07',
                fontWeight: 580,
              }}
            >
              Onboarding guided by finance experts
            </motion.p>

            {/* Step cards */}
            <div className="flex" style={{ gap: '24px' }}>
              {[
                {
                  step: '01',
                  title: 'Kickoff',
                  subtitle: 'Integrate all your sources',
                  description:
                    'Connect data from our 750+ integrations. Including your HRIS, ERP, CRM, and more.',
                  duration: '1-week average',
                },
                {
                  step: '02',
                  title: 'Model',
                  subtitle: 'Build your model',
                  description:
                    'Create your P&L, cashflow, headcount model, and more. Build out your projections, scenarios, and plans.',
                  duration: '4-week average',
                },
                {
                  step: '03',
                  title: 'Strategize',
                  subtitle: 'Get continuous support',
                  description:
                    'Stay aligned with our team through strategic check-ins and real-time support in a dedicated Slack channel.',
                  duration: 'Ongoing',
                },
              ].map((step, i) => (
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
                    gap: '16px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: 'rgba(38,27,7,0.4)',
                      fontWeight: 580,
                    }}
                  >
                    {step.step}
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    {step.title}
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 580,
                    }}
                  >
                    {step.subtitle}
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '150%',
                      color: 'rgba(38,27,7,0.7)',
                      fontWeight: 400,
                    }}
                  >
                    {step.description}
                  </p>
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '20px',
                      color: '#261B07',
                      fontWeight: 490,
                    }}
                  >
                    {step.duration}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
