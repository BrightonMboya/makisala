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
      id="features"
      ref={containerRef}
      className="relative"
      style={{ height: `${features.length * 100}vh` }}
    >
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div className="mx-auto w-full max-w-[1216px] px-6 lg:px-28">
          {/* Header — centered */}
          <div className="mb-12 flex flex-col items-center gap-4">
            <h2 className="text-center text-[clamp(32px,5vw,56px)] font-[580] leading-[1.2] tracking-[-2px] text-[#261B07]">
              Build the itinerary. Send the proposal.
            </h2>
            <p className="text-center text-xl leading-6 text-[#261B07]">
              Faster workflows. Better client experience.
            </p>
          </div>

          {/* Two-column layout */}
          <div className="flex flex-col gap-6 md:flex-row">
            {/* Left — feature cards */}
            <div className="flex w-full shrink-0 flex-col gap-4 md:w-[340px]">
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
                    className="flex cursor-pointer flex-col gap-2 rounded-xl border p-5"
                  >
                    <div className="flex items-center gap-2">
                      <h3
                        className="text-base font-[580] leading-5 transition-colors duration-400"
                        style={{
                          color: isActive ? '#261B07' : 'rgba(38,27,7,0.3)',
                        }}
                      >
                        {feature.title}
                      </h3>
                      {feature.badge && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-[580] leading-[14px] text-[#F8F7F5] transition-colors duration-400"
                          style={{
                            backgroundColor: isActive ? '#261B07' : 'rgba(38,27,7,0.15)',
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
                      <p className="text-base leading-[150%] text-[rgba(38,27,7,0.7)]">
                        {feature.description}
                      </p>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>

            {/* Mobile — active feature image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#EEECEA] md:hidden">
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
                    <span className="text-base text-[rgba(38,27,7,0.4)]">
                      {feature.title}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Desktop — demo placeholder that changes */}
            <div className="relative hidden min-h-[300px] flex-1 overflow-hidden rounded-2xl bg-[#EEECEA] md:flex">
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
                    <span className="text-base text-[rgba(38,27,7,0.4)]">
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
