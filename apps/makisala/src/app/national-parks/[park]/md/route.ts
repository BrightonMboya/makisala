import { NextResponse } from 'next/server'
import { getNPInfo } from '@/lib/cms-service'
import { capitalize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const FOOTER = `\n\n---\nMakisala — Bespoke African safari experiences. Plan your trip at https://makisala.com`

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ park: string }> }
) {
    const { park } = await params
    const result = await getNPInfo(park, 'overview_page_id')

    if (!result?.park) {
        return new NextResponse('Park not found', { status: 404 })
    }

    const { park: np, page, tours } = result
    const lines: string[] = []

    // H1 — Park name
    lines.push(`# ${capitalize(np.name)} National Park`)
    lines.push('')

    // Country
    lines.push(`**Country:** ${capitalize(np.country)}`)
    lines.push('')

    // Tagline / intro
    if (np.hero_tagline) {
        lines.push(`> ${np.hero_tagline}`)
        lines.push('')
    }

    if (np.intro_text) {
        lines.push(np.intro_text)
        lines.push('')
    }

    // Overview from page content
    if (page?.content) {
        lines.push(`## Overview`)
        lines.push('')
        lines.push(page.content)
        lines.push('')
    }

    // Quick facts from park_overview JSON
    const parkOverview = np.park_overview ?? []
    if (parkOverview.length > 0) {
        lines.push(`## Key Facts`)
        lines.push('')
        for (const item of parkOverview) {
            lines.push(`- **${item.name}:** ${item.description}`)
        }
        lines.push('')
    }

    // Highlights
    const highlights = np.highlights ?? []
    if (highlights.length > 0) {
        lines.push(`## Highlights`)
        lines.push('')
        for (const h of highlights) {
            lines.push(`### ${h.title}`)
            lines.push('')
            lines.push(h.body)
            lines.push('')
        }
    }

    // Key wildlife
    const wildlifeHighlights = np.wildlife_highlights ?? []
    if (wildlifeHighlights.length > 0) {
        lines.push(`## Key Wildlife`)
        lines.push('')
        for (const w of wildlifeHighlights) {
            lines.push(`- **${w.name}** (${w.abundance})`)
        }
        lines.push('')
    }

    // Good to know
    const goodToKnow = np.good_to_know ?? []
    if (goodToKnow.length > 0) {
        lines.push(`## Good to Know`)
        lines.push('')
        for (const item of goodToKnow) {
            lines.push(`### ${item.title}`)
            lines.push('')
            lines.push(item.body)
            lines.push('')
        }
    }

    // Related tours
    if (tours && tours.length > 0) {
        lines.push(`## Related Tours`)
        lines.push('')
        for (const tour of tours) {
            const price = tour.pricing ? ` — from $${Number(tour.pricing).toLocaleString('en-US')}` : ''
            lines.push(`- [${tour.tourName}](https://makisala.com/tours/${tour.slug})${price}`)
        }
        lines.push('')
    }

    // CTA
    lines.push(`## Plan Your Visit`)
    lines.push('')
    lines.push(`Plan your visit at https://makisala.com/national-parks/${park}`)

    lines.push(FOOTER)

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
