import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Ratiba — Built for Safari Operators & Tour Companies',
  description:
    'Ratiba is the itinerary and proposal platform built for safari operators. We help tour companies build faster, sell better, and grow without complexity.',
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
