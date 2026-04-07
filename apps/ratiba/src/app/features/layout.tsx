import type { Metadata } from 'next';

const title = 'Features | Safari Itinerary Builder & Proposal Software — Ratiba';
const description =
  'AI itinerary builder, live client proposals, built-in pricing, team collaboration, and branded themes. Everything safari operators need in one platform.';

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: '/features',
  },
  openGraph: {
    title,
    description,
    url: '/features',
  },
};

export default function FeaturesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
