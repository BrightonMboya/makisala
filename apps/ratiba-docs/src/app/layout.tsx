import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider';
import './global.css';

const siteUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? 'https://docs.ratiba.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ratiba Docs',
    template: '%s · Ratiba Docs',
  },
  description:
    'Official documentation for Ratiba, the itinerary, pricing, and proposal platform for safari operators, DMCs, and travel agencies.',
  applicationName: 'Ratiba Docs',
  authors: [{ name: 'Ratiba', url: 'https://ratiba.io' }],
  creator: 'Ratiba',
  publisher: 'Ratiba',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ratiba Docs',
    url: siteUrl,
    title: 'Ratiba Docs',
    description:
      'Build itineraries, price safaris, send proposals. Documentation for the safari operator OS.',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ratiba Docs',
    description:
      'Build itineraries, price safaris, send proposals. Documentation for the safari operator OS.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
