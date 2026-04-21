import { NextResponse } from 'next/server'

import { listAccommodationsForIndex } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

const OTHER = 'Other destinations'

export async function GET() {
    const rows = await listAccommodationsForIndex()

    const byCountry = new Map<string, typeof rows>()
    for (const row of rows) {
        const key = row.country?.trim() || OTHER
        const list = byCountry.get(key) ?? []
        list.push(row)
        byCountry.set(key, list)
    }

    const countryOrder = Array.from(byCountry.keys()).sort((a, b) => {
        if (a === OTHER) return 1
        if (b === OTHER) return -1
        return a.localeCompare(b)
    })

    const lines: string[] = []
    lines.push('# Makisala Safari Lodges & Camps')
    lines.push('')
    lines.push(
        'Machine-readable index of all accommodations (safari lodges, tented camps, and hotels) used across Makisala itineraries. Each entry links to a full markdown description.'
    )
    lines.push('')
    lines.push(`**Total accommodations:** ${rows.length}  `)
    lines.push(`**Base URL:** ${BASE_URL}  `)
    lines.push(`**Per-accommodation markdown:** ${BASE_URL}/accommodations/{slug}.md  `)
    lines.push('')

    for (const country of countryOrder) {
        const list = byCountry.get(country)!
        lines.push(`## ${country}`)
        lines.push('')
        for (const a of list) {
            lines.push(`### [${a.name}](${BASE_URL}/accommodations/${a.slug})`)
            lines.push('')
            lines.push(
                `- **Full details (markdown):** ${BASE_URL}/accommodations/${a.slug}.md`
            )
            lines.push(`- **Page:** ${BASE_URL}/accommodations/${a.slug}`)
            const summary = (a.overview || a.enhancedDescription || '').trim()
            if (summary) {
                lines.push('')
                lines.push(summary)
            }
            lines.push('')
        }
    }

    lines.push('---')
    lines.push('Makisala. Bespoke African safari experiences. https://makisala.com')

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
