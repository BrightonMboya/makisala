import type { NextConfig } from 'next';
import { withAxiom } from 'next-axiom';

const nextConfig: NextConfig = {
  // Keep the headless-browser stack out of the bundle. @sparticuz/chromium ships a
  // ~50MB binary and puppeteer-core loads native bits at runtime; bundling either
  // breaks the serverless function. They must be resolved as external node modules.
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // Externalizing @sparticuz/chromium keeps its JS out of the bundle, but the file
  // tracer then prunes the compressed Chromium binary (bin/*.br) because it's read
  // at runtime via a computed path it can't follow. That leaves the deployed function
  // with the JS but no binary ("input directory .../bin does not exist"). Force the
  // bin assets into the one route that launches Chromium. The glob is relative to this
  // app dir and reaches the hoisted bun store at the repo root; @* keeps it working
  // across version bumps.
  outputFileTracingIncludes: {
    '/api/proposal/send-email': [
      '../../node_modules/.bun/@sparticuz+chromium@*/node_modules/@sparticuz/chromium/bin/**',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  async rewrites() {
    return [
      // Serve markdown variants of any page for LLM crawlers.
      // Any route with a sibling `/md/route.ts` is automatically reachable at `.md`.
      {
        source: '/:path*.md',
        destination: '/:path*/md',
      },
    ];
  },
  async headers() {
    const linkHeader = [
      '</sitemap.xml>; rel="sitemap"; type="application/xml"',
      '</robots.txt>; rel="describedby"; type="text/plain"',
      '</features.md>; rel="describedby"; type="text/markdown"; title="Product features (markdown)"',
    ].join(', ');
    return [
      {
        source: '/',
        headers: [
          { key: 'Link', value: linkHeader },
          { key: 'Vary', value: 'Accept' },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.makisala.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default withAxiom(nextConfig);
