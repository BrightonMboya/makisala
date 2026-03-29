import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Outfit } from 'next/font/google';
import { AxiomWebVitals } from 'next-axiom';
import './globals.css';
import { Providers } from '@/components/providers';
import { env } from '@/lib/env';

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: 'Ratiba | Itinerary Builder for Tour Operators',
    template: '%s | Ratiba',
  },
  description:
    'Ratiba helps tour operators and travel agencies build itineraries faster, collaborate across the team, and send beautiful proposals clients can comment on live.',
  keywords: [
    'itinerary builder for tour operators',
    'travel proposal software',
    'proposal software for travel agencies',
    'tour operator software',
    'safari itinerary builder',
    'travel agency proposal tool',
  ],
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Ratiba | Itinerary Builder & Proposal Software for Tour Operators',
    description:
      'Build itineraries faster, collaborate with your team, and send proposals clients can review and comment on live.',
    url: '/',
    siteName: 'Ratiba',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ratiba | Itinerary Builder & Proposal Software for Tour Operators',
    description:
      'Build itineraries faster, collaborate with your team, and send proposals clients can review and comment on live.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${cormorant.variable} ${outfit.variable} font-sans antialiased`}
      >
        <AxiomWebVitals />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
