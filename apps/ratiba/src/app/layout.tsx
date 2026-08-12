import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter, Outfit } from 'next/font/google';
import { AxiomWebVitals } from 'next-axiom';
import './globals.css';
import { Providers } from '@/components/providers';
import { env } from '@/lib/env';

// Inter/Outfit/Cormorant carry no CJK glyphs. Unlike the PDF (react-pdf has no
// glyph fallback — see lib/pdf/proposal/fonts.ts), a browser does substitute
// automatically, but only from whatever's installed; naming the common CJK system
// fonts up front means a Chinese proposal gets a real typeface immediately rather
// than whatever the OS guesses.
//
// Next's font loader statically analyzes these call arguments at build time, so
// the fallback list has to be a literal here — a shared constant reference fails
// with "Font loader values must be explicitly written literals."
const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  fallback: ['PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
});

const cormorant = Cormorant_Garamond({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  fallback: ['PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
});

const outfit = Outfit({
  variable: '--font-heading',
  subsets: ['latin'],
  fallback: ['PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', 'sans-serif'],
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
