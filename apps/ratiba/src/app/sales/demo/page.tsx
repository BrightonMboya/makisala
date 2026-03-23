'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TitleSlide } from './_slides/title';
import { TheChallenges } from './_slides/the-challenges';
import { CostOfStatus } from './_slides/cost-of-status-quo';
import { IntroducingRatiba } from './_slides/introducing-ratiba';
import { HowItWorks } from './_slides/how-it-works';
import { LiveDemo } from './_slides/live-demo';
import { BeforeAfter } from './_slides/before-after';
import { WhatTeamsAreSaying } from './_slides/social-proof';
import { Pricing } from './_slides/pricing';
import { WhatsNext } from './_slides/whats-next';

const slides = [
  TitleSlide,
  TheChallenges,
  CostOfStatus,
  IntroducingRatiba,
  HowItWorks,
  LiveDemo,
  BeforeAfter,
  WhatTeamsAreSaying,
  Pricing,
  WhatsNext,
];

const variants = {
  enter: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? 24 : -24,
  }),
  center: {
    opacity: 1,
    y: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? -24 : 24,
  }),
};

export default function SalesDemoPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= slides.length) return;
      setDirection(next > current ? 1 : -1);
      setCurrent(next);
    },
    [current],
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(current - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current, goTo]);

  const SlideComponent = slides[current]!;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="absolute inset-0"
        >
          <SlideComponent />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 left-0 right-0 z-50 flex gap-1 p-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i === current ? 'bg-[#C4956A]' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
