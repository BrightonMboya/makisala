// Custom Next.js Image loader. Routes each source to its own CDN's
// transform API so requests never go through Vercel's image optimizer.
//
// Enabled via next.config.mjs:
//   images: { loader: 'custom', loaderFile: './src/lib/image-loader.ts' }

type LoaderArgs = { src: string; width: number; quality?: number }

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
    const q = quality ?? 75

    // assets.makisala.com — Cloudflare Image Resizing on our own zone.
    // Pattern: /cdn-cgi/image/<options>/<path>
    if (src.startsWith('https://assets.makisala.com/')) {
        const path = src.slice('https://assets.makisala.com/'.length)
        return `https://assets.makisala.com/cdn-cgi/image/width=${width},quality=${q},format=auto/${path}`
    }

    // Unsplash has its own resize API; ignore any existing query and rebuild.
    if (src.startsWith('https://images.unsplash.com/')) {
        const base = src.split('?')[0]
        return `${base}?w=${width}&q=${q}&auto=format&fit=crop`
    }

    // Cloudinary — inject transforms into the path.
    if (src.startsWith('https://res.cloudinary.com/')) {
        return src.replace(/\/image\/upload\//, `/image/upload/w_${width},q_${q},f_auto/`)
    }

    // Google avatars / lh3 already serve at request-time sizes; pass through.
    if (src.startsWith('https://lh3.googleusercontent.com/')) {
        return src
    }

    // Local /public assets in dev — pass through. In production, route them
    // through Cloudflare Image Resizing on the apex makisala.com zone.
    if (src.startsWith('/')) {
        if (process.env.NODE_ENV === 'production') {
            return `https://www.makisala.com/cdn-cgi/image/width=${width},quality=${q},format=auto${src}`
        }
        return src
    }

    // Anything we don't recognize — pass through unmodified.
    return src
}
