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
          Build faster itineraries. Sell more trips.
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
          className="flex flex-col items-center gap-4 sm:flex-row"
        >
          <Link
            href="/demo"
            className="w-full rounded-[10px] px-6 py-3 text-center text-sm transition-opacity hover:opacity-90 sm:w-auto"
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
            className="w-full rounded-[10px] border px-6 py-3 text-center text-sm transition-opacity hover:opacity-70 sm:w-auto"
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
      <div className="px-6 pb-10 md:pb-16 lg:px-28">
        <img
          src="https://brand.makisala.com/Screenshot%202026-02-27%20at%2019.58.52.png"
          alt="Kitasuro product screenshot"
          className="mx-auto w-full rounded-2xl"
          style={{ maxWidth: '1216px' }}
        />
      </div>
    </>
  );
}
