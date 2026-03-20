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
      <div className="mx-auto flex flex-col" style={{ maxWidth: '1216px', gap: '40px' }}>
        {/* Label */}
        <motion.p
          {...fadeUp}
          style={{
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
            color: 'rgba(38,27,7,0.5)',
            fontWeight: 490,
            lineHeight: '16px',
          }}
        >
          Why teams switch
        </motion.p>

        {/* Big quote */}
        <motion.div {...fadeUp} className="flex flex-col" style={{ gap: '8px' }}>
          <h2
            style={{
              fontSize: 'clamp(40px, 5vw, 72px)',
              letterSpacing: '-2.5px',
              lineHeight: '1',
              color: '#261B07',
              fontWeight: 580,
            }}
          >
            Stop losing time in
          </h2>
          <div className="relative overflow-hidden" style={{ height: 'clamp(44px, 5.5vw, 78px)' }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={wordIndex}
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: '0%', opacity: 1 }}
                exit={{ y: '-100%', opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute left-0"
                style={{
                  fontSize: 'clamp(40px, 5vw, 72px)',
                  letterSpacing: '-2.5px',
                  lineHeight: '1.1',
                  color: '#261B07',
                  fontWeight: 580,
                  fontStyle: 'italic',
                }}
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Review cards */}
        <div className="flex flex-wrap" style={{ gap: '16px' }}>
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
              className="flex min-w-[280px] flex-1 flex-col rounded-xl border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(38,27,7,0.08)',
                padding: '24px',
                gap: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: '150%',
                  color: '#261B07',
                  fontWeight: 400,
                }}
              >
                {quote}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
