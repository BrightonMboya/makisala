'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const rotatingWords = ['manual itineraries.', 'Google Docs.', 'Excel Sheets.', 'overpriced tools.'];

const reviews = [
  'Build polished proposals without starting from zero.',
  'Keep sales and ops on the same itinerary.',
  'Make it easy for clients to review and reply.',
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

export function Reviews() {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="why-ratiba" className="px-6 py-12 md:py-20 lg:px-28">
      <div className="mx-auto flex max-w-[1216px] flex-col gap-10">
        {/* Label */}
        <motion.p
          {...fadeUp}
          className="text-xs font-[490] uppercase leading-4 tracking-[0.05em] text-[rgba(38,27,7,0.5)]"
        >
          Why teams switch
        </motion.p>

        {/* Big quote */}
        <motion.div {...fadeUp} className="flex flex-col gap-2">
          <h2 className="text-[clamp(40px,5vw,72px)] font-[580] leading-none tracking-[-2.5px] text-[#261B07]">
            Stop losing time in
          </h2>
          <div className="relative h-[clamp(44px,5.5vw,78px)] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0 text-[clamp(40px,5vw,72px)] font-[580] italic leading-[1.1] tracking-[-2.5px] text-[#261B07]"
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Review cards */}
        <div className="flex flex-wrap gap-4">
          {reviews.map((quote, i) => (
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
              className="flex min-w-[280px] flex-1 flex-col gap-3 rounded-xl border border-[rgba(38,27,7,0.08)] bg-white p-6"
            >
              <p className="text-base leading-[150%] text-[#261B07]">
                {quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
