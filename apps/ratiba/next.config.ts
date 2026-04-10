import type { NextConfig } from 'next';
import { withAxiom } from 'next-axiom';

const nextConfig: NextConfig = {
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
        hostname: '*.supabase.co',
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
