import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Book a Demo | Ratiba',
  description:
    'See how Ratiba helps tour operators and travel agencies build itineraries faster and send polished proposals. Book a personalized demo.',
  alternates: {
    canonical: '/demo',
  },
  openGraph: {
    title: 'Book a Demo | Ratiba',
    description:
      'See how Ratiba helps tour operators and travel agencies build itineraries faster and send polished proposals.',
    url: '/demo',
    type: 'website',
  },
};

export default function DemoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
