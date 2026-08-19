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
    // MCP OAuth discovery/DCR/token endpoints are meant to be fetched
    // cross-origin by browser-based MCP clients (e.g. MCP Inspector's web
    // UI). Without Access-Control-Allow-Origin, those fetches are silently
    // blocked by the browser, which the client SDK's CORS-swallowing logic
    // misreads as "endpoint not found" and falls back to guessing the wrong
    // (bare-origin) authorization server.
    const mcpCorsHeaders = [
      { key: 'Access-Control-Allow-Origin', value: '*' },
      { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
      { key: 'Access-Control-Allow-Headers', value: '*' },
    ];
    return [
      {
        source: '/',
        headers: [
          { key: 'Link', value: linkHeader },
          { key: 'Vary', value: 'Accept' },
        ],
      },
      { source: '/.well-known/oauth-protected-resource/:path*', headers: mcpCorsHeaders },
      { source: '/.well-known/oauth-authorization-server/:path*', headers: mcpCorsHeaders },
      { source: '/.well-known/openid-configuration/:path*', headers: mcpCorsHeaders },
      {
        source: '/api/mcp',
        headers: [...mcpCorsHeaders, { key: 'Access-Control-Expose-Headers', value: 'WWW-Authenticate, Mcp-Session-Id' }],
      },
      { source: '/api/auth/oauth2/:path*', headers: mcpCorsHeaders },
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
