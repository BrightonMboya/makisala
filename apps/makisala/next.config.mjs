import { createJiti } from 'jiti'
import { fileURLToPath } from 'node:url'
import createMDX from '@next/mdx'

const jiti = createJiti(fileURLToPath(import.meta.url))
jiti('./src/lib/env')

const withMDX = createMDX({})

const nextConfig = {
    staticPageGenerationTimeout: 180,
    pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.unsplash.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
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
                hostname: 'assets.makisala.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    transpilePackages: ['next-mdx-remote'],
    eslint: {
        ignoreDuringBuilds: true,
    },
}

export default withMDX(nextConfig)
