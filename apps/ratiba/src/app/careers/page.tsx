'use client';

import { motion } from 'framer-motion';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Clock, DollarSign, MapPin, Users } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

const GOOGLE_FORM_EMBED_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLScYfUJySvrJJHCCwuce64IJbcw2Hhqzyprm6jvi19wTz0U1hw/viewform?embedded=true';

const roleDetails = [
  {
    icon: MapPin,
    label: 'Location',
    value: 'Rwanda, Uganda, Kenya, Tanzania, Botswana, Morocco, South Africa',
  },
  {
    icon: DollarSign,
    label: 'Compensation',
    value: 'Commission-only, per closed deal',
  },
  {
    icon: Clock,
    label: 'Type',
    value: 'Flexible, remote',
  },
  {
    icon: Users,
    label: 'Team',
    value: 'Independent, reporting to founder',
  },
];

const responsibilities = [
  'Reach out to safari operators, tour companies, and travel agencies in your market',
  'Demo Ratiba to prospective clients and walk them through how it fits their workflow',
  'Close deals and onboard new customers onto the platform',
  'Share market feedback to help shape the product for your region',
];

const idealCandidate = [
  'Based in one of the listed countries with a network in the travel or tourism industry',
  'Experience selling software, SaaS, or technology products to small and mid-sized businesses',
  'Self-motivated and comfortable working independently without a base salary',
  'Strong communication skills and the ability to explain software to non-technical audiences',
  'Familiarity with the safari and tour operator space is a strong plus',
];

export default function CareersPage() {
  return (
    <div className="bg-[#F8F7F5] text-[#261B07]">
      <Navbar />

      <main>
        {/* Hero */}
        <section style={{ padding: '80px 0 80px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <motion.div
              {...fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-lg border border-[rgba(38,27,7,0.1)] bg-white px-3 py-1.5"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded bg-[#261B07]">
                <span className="text-[10px] font-bold text-[#F8F7F5]">R</span>
              </div>
              <span className="text-sm font-medium">Careers</span>
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
              Sales Representative
            </motion.h1>

            <motion.p
              {...fadeUp}
              className="mt-4"
              style={{
                fontSize: 'clamp(18px, 2vw, 24px)',
                fontWeight: 500,
                color: 'rgba(38,27,7,0.5)',
                letterSpacing: '-0.5px',
              }}
            >
              Commission-based &middot; Remote &middot; Multiple African markets
            </motion.p>

            <motion.p
              {...fadeUp}
              className="mt-6 max-w-2xl text-[rgba(38,27,7,0.7)]"
              style={{ fontSize: '18px', lineHeight: '28px' }}
            >
              Ratiba is the itinerary and proposal platform built for safari operators and tour
              companies. We&apos;re looking for driven sales representatives across Africa to bring
              Ratiba to operators in their market. You earn a commission on every deal you close. No
              cap, no base, pure upside.
            </motion.p>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* Role Details */}
        <section style={{ padding: '80px 0' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roleDetails.map((detail, i) => (
                <motion.div
                  key={detail.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.1,
                    ease: [0.16, 1, 0.3, 1] as const,
                  }}
                  className="flex flex-col gap-3 rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white p-6"
                >
                  <detail.icon className="h-5 w-5" style={{ color: 'rgba(38,27,7,0.4)' }} />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: 'rgba(38,27,7,0.45)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {detail.label}
                  </span>
                  <span
                    style={{
                      fontSize: '16px',
                      fontWeight: 500,
                      color: '#261B07',
                      lineHeight: '22px',
                    }}
                  >
                    {detail.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsibilities + Ideal Candidate */}
        <section style={{ paddingBottom: '80px' }}>
          <div className="mx-auto max-w-[1216px] px-6">
            <div className="flex flex-col gap-16 md:flex-row md:gap-10">
              {/* Responsibilities */}
              <div className="flex-1">
                <motion.h2
                  {...fadeUp}
                  style={{
                    fontSize: 'clamp(28px, 3vw, 40px)',
                    fontWeight: 584,
                    letterSpacing: '-0.8px',
                    lineHeight: '1.2',
                    marginBottom: '24px',
                  }}
                >
                  What you&apos;ll do
                </motion.h2>
                <motion.ul {...fadeUp} className="flex flex-col gap-4">
                  {responsibilities.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'rgba(38,27,7,0.25)' }}
                      />
                      <span
                        style={{
                          fontSize: '16px',
                          lineHeight: '26px',
                          color: 'rgba(38,27,7,0.7)',
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              </div>

              {/* Ideal Candidate */}
              <div className="flex-1">
                <motion.h2
                  {...fadeUp}
                  style={{
                    fontSize: 'clamp(28px, 3vw, 40px)',
                    fontWeight: 584,
                    letterSpacing: '-0.8px',
                    lineHeight: '1.2',
                    marginBottom: '24px',
                  }}
                >
                  Who we&apos;re looking for
                </motion.h2>
                <motion.ul {...fadeUp} className="flex flex-col gap-4">
                  {idealCandidate.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: 'rgba(38,27,7,0.25)' }}
                      />
                      <span
                        style={{
                          fontSize: '16px',
                          lineHeight: '26px',
                          color: 'rgba(38,27,7,0.7)',
                        }}
                      >
                        {item}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="mx-auto max-w-[1216px] px-6">
          <div className="border-t border-[rgba(38,27,7,0.1)]" />
        </div>

        {/* Embedded Google Form */}
        <section style={{ padding: '80px 0' }}>
          <div className="mx-auto max-w-[800px] px-6">
            <motion.h2
              {...fadeUp}
              className="mb-4 text-center"
              style={{
                fontSize: 'clamp(28px, 3vw, 40px)',
                fontWeight: 584,
                letterSpacing: '-0.8px',
                lineHeight: '1.2',
              }}
            >
              Apply now
            </motion.h2>
            <motion.p
              {...fadeUp}
              className="mb-10 text-center text-[rgba(38,27,7,0.6)]"
              style={{ fontSize: '16px', lineHeight: '26px' }}
            >
              Fill out the form below and we&apos;ll be in touch within 48 hours.
            </motion.p>

            <motion.div
              {...fadeUp}
              className="overflow-hidden rounded-2xl border border-[rgba(38,27,7,0.08)] bg-white"
            >
              <iframe
                src={GOOGLE_FORM_EMBED_URL}
                width="100%"
                height="1200"
                frameBorder={0}
                marginHeight={0}
                marginWidth={0}
                title="Ratiba Sales Representative Application"
                className="w-full"
              >
                Loading...
              </iframe>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
