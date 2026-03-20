'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';

const features = [
  {
    title: 'Plan faster with AI assistance',
    badge: 'AI',
    description: 'Go from rough brief to polished itinerary in less time.',
    image: 'https://brand.makisala.com/ai-feat.jpg',
  },
  {
    title: 'Collaborate across sales and operations',
    description: 'Keep sales and ops on one live itinerary.',
    image: 'https://brand.makisala.com/team_tagging.jpg',
  },
  {
    title: 'Let clients comment where decisions happen',
    description: 'Clients comment directly on the proposal.',
    image: 'https://brand.makisala.com/comments.jpg',
  },
  {
    title: 'Build branded proposals without extra design work',
    description: 'Send polished proposals with your content and brand.',
    image: 'https://brand.makisala.com/content-library.jpg',
  },
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const lastFeatureIndex = features.length - 1;

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const index = Math.round(clamp(latest, 0, 1) * lastFeatureIndex);
    setActiveIndex(index);
  });

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: `${features.length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full px-6 lg:px-28" style={{ maxWidth: '1216px' }}>
          {/* Header — centered */}
          <div className="flex flex-col items-center" style={{ gap: '16px', marginBottom: '48px' }}>
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
              Build the itinerary. Send the proposal.
            </h2>
            <p
              className="text-center"
              style={{
                fontSize: '20px',
                lineHeight: '24px',
                color: '#261B07',
                fontWeight: 400,
              }}
            >
              Faster workflows. Better client experience.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Left — feature cards */}
            <div className="flex w-full shrink-0 flex-col md:w-[340px]" style={{ gap: '16px' }}>
              {features.map((feature, i) => {
                const isActive = activeIndex === i;
                return (
                  <motion.div
                    key={i}
                    onClick={() => {
                      if (!containerRef.current) return;
                      const containerTop =
                        containerRef.current.getBoundingClientRect().top + window.scrollY;
                      const scrollDistance = containerRef.current.scrollHeight - window.innerHeight;
                      const progress = lastFeatureIndex === 0 ? 0 : i / lastFeatureIndex;
                      setActiveIndex(i);
                      window.scrollTo({ top: containerTop + progress * scrollDistance, behavior: 'auto' });
                    }}
                    animate={{
                      backgroundColor: isActive ? '#FFFFFF' : 'rgba(255,255,255,0)',
                      borderColor: isActive ? 'rgba(38,27,7,0.08)' : 'rgba(38,27,7,0)',
                    }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                    className="flex cursor-pointer flex-col rounded-xl border"
                    style={{ padding: '20px', gap: '8px' }}
                  >
                    <div className="flex items-center gap-2">
                      <h3
                        style={{
                          fontSize: '16px',
                          lineHeight: '20px',
                          color: isActive ? '#261B07' : 'rgba(38,27,7,0.3)',
                          fontWeight: 580,
                          transition: 'color 0.4s',
                        }}
                      >
                        {feature.title}
                      </h3>
                      {feature.badge && (
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            backgroundColor: isActive ? '#261B07' : 'rgba(38,27,7,0.15)',
                            color: '#F8F7F5',
                            fontSize: '11px',
                            fontWeight: 580,
                            lineHeight: '14px',
                            transition: 'background-color 0.4s',
                          }}
                        >
                          {feature.badge}
                        </span>
                      )}
                    </div>
                    <motion.div
                      animate={{
                        height: isActive ? 'auto' : 0,
                        opacity: isActive ? 1 : 0,
                      }}
                      initial={false}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                      className="overflow-hidden"
                    >
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
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile — active feature image */}
            <div
              className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl md:hidden"
              style={{ backgroundColor: '#EEECEA' }}
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: activeIndex === i ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {feature.image ? (
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span style={{ color: 'rgba(38,27,7,0.4)', fontSize: '16px' }}>
                      {feature.title}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Desktop — demo placeholder that changes */}
            <div
              className="relative hidden min-h-[300px] flex-1 overflow-hidden rounded-2xl md:flex"
              style={{ backgroundColor: '#EEECEA' }}
            >
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: activeIndex === i ? 1 : 0,
                  }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {feature.image ? (
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span style={{ color: 'rgba(38,27,7,0.4)', fontSize: '16px' }}>
                      {feature.title}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
