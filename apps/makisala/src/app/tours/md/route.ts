import { NextResponse } from 'next/server'
import { db } from '@repo/db'
import { tours } from '@repo/db/schema'
import { asc, isNull } from 'drizzle-orm'
import { BASE_URL } from '@/lib/constants'
import { capitalize } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET() {
    const rows = await db
        .select({
            slug: tours.slug,
            tourName: tours.tourName,
            overview: tours.overview,
            country: tours.country,
            pricing: tours.pricing,
            number_of_days: tours.number_of_days,
            tags: tours.tags,
        })
        .from(tours)
        .where(isNull(tours.organizationId))
        .orderBy(asc(tours.country), asc(tours.number_of_days))

    const byCountry = new Map<string, typeof rows>()
    for (const tour of rows) {
        const key = tour.country || 'Other'
        if (!byCountry.has(key)) byCountry.set(key, [])
        byCountry.get(key)!.push(tour)
    }

    const lines: string[] = []
    lines.push('# Makisala Safari Tours')
    lines.push('')
    lines.push(
        'Machine-readable index of all Makisala safari tours. Each entry links to a full markdown description.'
    )
    lines.push('')
    lines.push(`**Total tours:** ${rows.length}  `)
    lines.push(`**Base URL:** ${BASE_URL}  `)
    lines.push(`**Per-tour markdown:** ${BASE_URL}/tours/{slug}.md  `)
    lines.push(`**Filterable JSON API:** ${BASE_URL}/api/tours`)
    lines.push('')

    for (const [country, list] of byCountry) {
        lines.push(`## ${capitalize(country)}`)
        lines.push('')
        for (const tour of list) {
            const price = tour.pricing
                ? `$${Number(tour.pricing).toLocaleString('en-US')} per person`
                : 'Price on request'
            lines.push(`### [${tour.tourName}](${BASE_URL}/tours/${tour.slug})`)
            lines.push('')
            lines.push(`- **Duration:** ${tour.number_of_days} days`)
            lines.push(`- **Price from:** ${price}`)
            if (tour.tags && tour.tags.length > 0) {
                lines.push(`- **Tags:** ${tour.tags.join(', ')}`)
            }
            lines.push(`- **Full itinerary (markdown):** ${BASE_URL}/tours/${tour.slug}.md`)
            lines.push(`- **Book / inquire:** ${BASE_URL}/tours/${tour.slug}`)
            if (tour.overview) {
                lines.push('')
                lines.push(tour.overview.trim())
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
