'use client';

import { createContext, useCallback, useContext, type ReactNode } from 'react';
import { printImage } from '@/lib/cf-image';

/**
 * Print mode for proposal themes. The print surface (`/proposal/[id]/print`) wraps
 * the theme in <PrintProvider>; the live proposal does not, so context defaults to
 * false. Themes read this (however deeply nested) to swap the WebGL route map for
 * StaticTripMap and to cap images via Cloudflare Image Resizing, without threading
 * a prop through every sub-component.
 */
const PrintContext = createContext(false);

export function PrintProvider({ children }: { children: ReactNode }) {
  return <PrintContext.Provider value={true}>{children}</PrintContext.Provider>;
}

export function useForPrint(): boolean {
  return useContext(PrintContext);
}

/**
 * Returns a transform for image URLs: caps them for print (1600px via Cloudflare),
 * or returns them untouched on the live proposal. Safe to call on any src, including
 * background-image URLs.
 */
export function usePrintImage(): (url: string | undefined) => string {
  const forPrint = useContext(PrintContext);
  return useCallback(
    (url: string | undefined) => (forPrint ? printImage(url) : url ?? ''),
    [forPrint],
  );
}
