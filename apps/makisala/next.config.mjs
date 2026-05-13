import { createJiti } from 'jiti'
import { fileURLToPath } from 'node:url'
import createMDX from '@next/mdx'
import { withAxiom } from 'next-axiom'

const jiti = createJiti(fileURLToPath(import.meta.url))
jiti('./src/lib/env')

const withMDX = createMDX({})

/** @type {import('next').NextConfig} */
const nextConfig = {
    staticPageGenerationTimeout: 180,
    async rewrites() {
        return [
            // Serve markdown variants of any page for LLM crawlers.
            // Any route with a sibling `/md/route.ts` is automatically reachable at `.md`.
            {
                source: '/:path*.md',
                destination: '/:path*/md',
            },
        ]
    },
    async headers() {
        const linkHeader = [
            '</sitemap.xml>; rel="sitemap"; type="application/xml"',
            '</tours.md>; rel="describedby"; type="text/markdown"; title="All tours (markdown index for agents)"',
            '</accommodations.md>; rel="describedby"; type="text/markdown"; title="All accommodations (markdown index for agents)"',
            '</robots.txt>; rel="describedby"; type="text/plain"',
        ].join(', ')
        return [
            {
                source: '/',
                headers: [
                    { key: 'Link', value: linkHeader },
                    { key: 'Vary', value: 'Accept' },
                ],
            },
            {
                source: '/tours',
                headers: [
                    { key: 'Link', value: '</tours.md>; rel="alternate"; type="text/markdown"' },
                    { key: 'Vary', value: 'Accept' },
                ],
            },
            {
                source: '/accommodations',
                headers: [
                    { key: 'Link', value: '</accommodations.md>; rel="alternate"; type="text/markdown"' },
                    { key: 'Vary', value: 'Accept' },
                ],
            },
        ]
    },
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    images: {
        // Bypass Vercel's image optimizer. Each source is rewritten to its own
        // CDN's transform API in src/lib/image-loader.ts.
        loader: 'custom',
        loaderFile: './src/lib/image-loader.ts',
        remotePatterns: [
            { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
            { protocol: 'https', hostname: 'res.cloudinary.com', port: '', pathname: '/**' },
            { protocol: 'https', hostname: 'assets.makisala.com', port: '', pathname: '/**' },
        ],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    transpilePackages: ['next-mdx-remote'],
}

export default withAxiom(withMDX(nextConfig))
