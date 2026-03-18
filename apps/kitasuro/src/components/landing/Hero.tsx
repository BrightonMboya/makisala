'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

export function Hero() {
  return (
    <>
      {/* Hero Section */}
      <section
        className="flex flex-col items-center"
        style={{
          paddingTop: '80px',
          paddingBottom: '48px',
          paddingInline: '24px',
          gap: '24px',
        }}
      >
        <motion.p
          {...fadeUp}
          style={{
            fontSize: '16px',
            lineHeight: '20px',
            color: '#261B07',
            fontWeight: 400,
          }}
        >
          Built for tour operators and travel agencies
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="text-center"
          style={{
            fontSize: 'clamp(40px, 5vw, 72px)',
            letterSpacing: '-2.5px',
            lineHeight: '1.05',
            color: '#261B07',
            fontWeight: 580,
            maxWidth: '900px',
          }}
        >
          Build faster itineraries. Win more trips.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="text-center"
          style={{
            fontSize: '20px',
            lineHeight: '30px',
            color: '#261B07',
            fontWeight: 400,
            maxWidth: '640px',
          }}
        >
          Build the itinerary together. Send the proposal with confidence.
        </motion.p>

        <motion.div
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.2 }}
          className="flex items-center gap-4"
        >
          <Link
            href="https://cal.com/brightonmboya/30min"
            className="rounded-[10px] px-6 py-3 text-sm transition-opacity hover:opacity-90"
            style={{
              backgroundColor: '#261B07',
              color: '#F8F7F5',
              fontWeight: 580,
            }}
          >
            Book a demo
          </Link>
          <Link
            href="/proposal/tjksu"
            className="rounded-[10px] border px-6 py-3 text-sm transition-opacity hover:opacity-70"
            style={{
              borderColor: 'rgba(38,27,7,0.2)',
              color: '#261B07',
              fontWeight: 580,
            }}
          >
            See a sample proposal
          </Link>
        </motion.div>
      </section>

      {/* Hero Image Placeholder */}
      <div style={{ paddingInline: '112px', paddingBottom: '64px' }}>
        <div
          className="mx-auto flex items-center justify-center rounded-2xl"
          style={{
            backgroundColor: '#EEECEA',
            height: '500px',
            maxWidth: '1216px',
          }}
        >
          <span style={{ color: 'rgba(38,27,7,0.4)', fontSize: '16px' }}>
            Product Screenshot
          </span>
        </div>
      </div>
    </>
  );
}
