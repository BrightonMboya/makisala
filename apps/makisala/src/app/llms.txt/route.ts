import { NextResponse } from 'next/server'
import { AllToursSlugs, fetchAllNps, fetchAllBlogs } from '@/lib/cms-service'
import { capitalize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET() {
    const [tourSlugs, parks, blogs] = await Promise.all([
        AllToursSlugs(),
        fetchAllNps(),
        fetchAllBlogs('blog'),
    ])

    const lines: string[] = []

    // Header
    lines.push(`# Makisala`)
    lines.push('')
    lines.push(
        `> Bespoke African safari experiences — handcrafted by experts, designed for every type of traveller. From romantic escapes to family-friendly adventures, Makisala makes your dream safari simple to plan and unforgettable to experience.`
    )
    lines.push('')

    // Tours
    lines.push(`## Tours`)
    for (const tour of tourSlugs) {
        if (tour.slug) {
            lines.push(
                `- [${tour.slug}](https://makisala.com/tours/${tour.slug}/md)`
            )
        }
    }
    lines.push('')

    // National Parks
    lines.push(`## National Parks`)
    for (const park of parks) {
        lines.push(
            `- [${capitalize(park.name)}](https://makisala.com/national-parks/${park.name}/md): ${capitalize(park.country)}`
        )
    }
    lines.push('')

    // Blog
    lines.push(`## Blog`)
    for (const post of blogs) {
        if (post.status === 'published') {
            const excerpt = post.excerpt ? `: ${post.excerpt.slice(0, 120)}` : ''
            lines.push(
                `- [${post.title}](https://makisala.com/blog/${post.slug}/md)${excerpt}`
            )
        }
    }
    lines.push('')

    // Safari Types
    lines.push(`## Safari Types`)
    lines.push(
        `- [Family Safari](https://makisala.com/who-is-travelling/family-safari)`
    )
    lines.push(
        `- [Couples & Honeymooners](https://makisala.com/who-is-travelling/couples-and-honeymooners)`
    )
    lines.push(
        `- [Group of Friends](https://makisala.com/who-is-travelling/group-of-friends)`
    )
    lines.push('')

    // Planning
    lines.push(`## Planning`)
    lines.push(`- [About](https://makisala.com/about)`)
    lines.push(`- [Contact](https://makisala.com/contact)`)
    lines.push('')

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
