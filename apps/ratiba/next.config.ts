import type { NextConfig } from 'next';
import { withAxiom } from 'next-axiom';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
  },
  // The proposal PDF reads its TTFs off disk at render time (see lib/pdf/proposal/
  // fonts.ts). Next's tracer only follows imports, so without this the font files
  // are dropped from the serverless bundle and the render throws ENOENT. Any route
  // that can render a proposal PDF needs them.
  outputFileTracingIncludes: {
    '/api/proposal/**': ['./src/lib/pdf/proposal/fonts/**'],
    '/api/dev/proposal-pdf': ['./src/lib/pdf/proposal/fonts/**'],
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
