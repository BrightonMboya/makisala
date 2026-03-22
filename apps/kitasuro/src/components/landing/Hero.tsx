'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

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
      <section className="flex flex-col items-center gap-6 px-6 pt-20 pb-12">
        <motion.p
          {...fadeUp}
          className="text-base leading-5 text-[#261B07]"
        >
          Built for tour operators and travel agencies
        </motion.p>

        <motion.h1
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.1 }}
          className="max-w-[900px] text-center text-[clamp(40px,5vw,72px)] font-[580] leading-[1.05] tracking-[-2.5px] text-[#261B07]"
        >
          Build faster itineraries. Sell more trips.
        </motion.h1>

        <motion.p
          {...fadeUp}
          transition={{ ...fadeUp.transition, delay: 0.15 }}
          className="max-w-[640px] text-center text-xl leading-[30px] text-[#261B07]"
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
            className="w-full rounded-[10px] bg-[#261B07] px-6 py-3 text-center text-sm font-[580] text-[#F8F7F5] transition-opacity hover:opacity-90 sm:w-auto"
          >
            Book a demo
          </Link>
          <Link
            href="/proposal/tjksu"
            className="w-full rounded-[10px] border border-[rgba(38,27,7,0.2)] px-6 py-3 text-center text-sm font-[580] text-[#261B07] transition-opacity hover:opacity-70 sm:w-auto"
          >
            See a sample itinerary
          </Link>
        </motion.div>
      </section>

      {/* Hero Image */}
      <div className="px-6 pb-10 md:pb-16 lg:px-28">
        <Image
          src="https://brand.makisala.com/Screenshot%202026-02-27%20at%2019.58.52.png"
          alt="Kitasuro product screenshot"
          width={2432}
          height={1520}
          className="mx-auto w-full max-w-[1216px] rounded-2xl"
          priority
        />
      </div>
    </>
  );
}
