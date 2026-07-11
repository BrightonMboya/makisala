'use client';

import { MotionConfig } from 'framer-motion';
import { createContext, useContext, useEffect } from 'react';

/**
 * True when a theme is being rendered for PDF capture rather than for the live,
 * scrollable web page. Themes read this to render a static document: no
 * scroll-linked parallax, no scroll-driven fades, no scroll affordances. A PDF
 * has no scroll position, so anything keyed to one is meaningless here.
 */
const PrintModeContext = createContext(false);

export function usePrintMode(): boolean {
  return useContext(PrintModeContext);
}

/**
 * Wraps a proposal theme for PDF capture.
 *
 * - Provides `usePrintMode() === true` so themes can drop scroll-driven behavior.
 * - `reducedMotion="always"` tells framer-motion to skip transform/parallax
 *   animations so nothing renders mid-flight or off-position in a static capture.
 * - Sets `window.__PRINT_READY__` once mounted so the Chromium renderer knows the
 *   client tree has hydrated before it prints.
 */
export function PrintFrame({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const flag = window as unknown as { __PRINT_READY__?: boolean };
    // Give hydration + first paint a beat, then signal ready.
    const t = setTimeout(() => {
      flag.__PRINT_READY__ = true;
    }, 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <PrintModeContext.Provider value={true}>
      <MotionConfig reducedMotion="always">{children}</MotionConfig>
    </PrintModeContext.Provider>
  );
}
