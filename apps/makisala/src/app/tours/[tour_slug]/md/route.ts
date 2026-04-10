import { NextResponse } from 'next/server'
import { getProgramaticTourBySlug } from '@/lib/cms-service'
import { inclusions, exclusions } from '@/lib/constants'
import { capitalize } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const FOOTER = `\n\n---\nMakisala — Bespoke African safari experiences. Plan your trip at https://makisala.com`

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ tour_slug: string }> }
) {
    const { tour_slug } = await params
    const tour = await getProgramaticTourBySlug(tour_slug)

    if (!tour) {
        return new NextResponse('Tour not found', { status: 404 })
    }

    const lines: string[] = []

    // H1 — Tour name
    lines.push(`# ${tour.tourName}`)
    lines.push('')

    // Overview
    lines.push(tour.overview)
    lines.push('')

    // Country and duration
    lines.push(`**Country:** ${capitalize(tour.country)}  `)
    lines.push(`**Duration:** ${tour.number_of_days} days  `)
    if (tour.pricing) {
        lines.push(`**Price from:** $${Number(tour.pricing).toLocaleString('en-US')} per person  `)
    }
    lines.push('')

    // Day-by-day itinerary
    if (tour.days.length > 0) {
        lines.push(`## Day-by-Day Itinerary`)
        lines.push('')

        for (const day of tour.days) {
            lines.push(`### Day ${day.dayNumber}: ${day.dayTitle || 'Untitled'}`)
            lines.push('')
            if (day.overview) {
                lines.push(day.overview)
                lines.push('')
            }

            const accommodations = day.itineraryAccommodations
            if (accommodations.length > 0) {
                const names = accommodations.map(ia => ia.accommodation.name).join(', ')
                lines.push(`**Accommodation:** ${names}`)
                lines.push('')
            }
        }
    }

    // Inclusions
    lines.push(`## What's Included`)
    lines.push('')
    for (const item of inclusions) {
        lines.push(`- ${item}`)
    }
    lines.push('')

    // Exclusions
    lines.push(`## What's Not Included`)
    lines.push('')
    for (const item of exclusions) {
        lines.push(`- ${item}`)
    }
    lines.push('')

    // CTA
    lines.push(`## Book This Tour`)
    lines.push('')
    lines.push(`Book this tour at https://makisala.com/tours/${tour_slug}`)

    lines.push(FOOTER)

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
