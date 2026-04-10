import { NextResponse } from 'next/server'
import { getPageBySlug } from '@/lib/cms-service'

export const dynamic = 'force-dynamic'

const FOOTER = `\n\n---\nMakisala — Bespoke African safari experiences. Plan your trip at https://makisala.com`

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const page = await getPageBySlug(slug)

    if (!page || page.status !== 'published') {
        return new NextResponse('Post not found', { status: 404 })
    }

    const lines: string[] = []

    // H1 — Title
    lines.push(`# ${page.title}`)
    lines.push('')

    // Date if available
    if (page.createdAt) {
        const date = new Date(page.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
        lines.push(`*Published: ${date}*`)
        lines.push('')
    }

    // Excerpt
    if (page.excerpt) {
        lines.push(`> ${page.excerpt}`)
        lines.push('')
    }

    // The content (already markdown)
    lines.push(page.content)
    lines.push('')

    // CTA
    lines.push(`---`)
    lines.push('')
    lines.push(`Read this article at https://makisala.com/blog/${slug}`)

    lines.push(FOOTER)

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
