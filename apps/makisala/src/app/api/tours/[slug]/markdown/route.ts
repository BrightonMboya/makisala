import { getProgramaticTourBySlug } from '@/lib/cms-service'
import { NextResponse } from 'next/server'

const MEAL_MAP: Record<string, string> = { B: 'Breakfast', L: 'Lunch', D: 'Dinner' }

export async function GET(
    _request: Request,
    { params }: { params: { slug: string } }
) {
    const { slug } = await params
    const tour = await getProgramaticTourBySlug(slug)

    if (!tour) {
        return new NextResponse('Tour not found', { status: 404 })
    }

    const lines: string[] = []

    lines.push(`# ${tour.tourName}`)
    lines.push('')
    lines.push(`**Country:** ${tour.country}`)
    lines.push(`**Duration:** ${tour.number_of_days} days`)
    lines.push(`**Price from:** $${tour.pricing} per person`)
    lines.push('')
    lines.push('## Overview')
    lines.push('')
    lines.push(tour.overview)
    lines.push('')

    if (tour.days.length > 0) {
        lines.push('## Itinerary')
        lines.push('')

        for (const day of tour.days) {
            lines.push(`### Day ${day.dayNumber}: ${day.dayTitle || ''}`)
            lines.push('')
            if (day.overview) {
                lines.push(day.overview)
                lines.push('')
            }

            const meals = (day.meals || 'BLD')
                .split('')
                .map(m => MEAL_MAP[m])
                .filter(Boolean)
            if (meals.length > 0) {
                lines.push(`**Meals:** ${meals.join(', ')}`)
                lines.push('')
            }

            const acc = day.itineraryAccommodations?.[0]?.accommodation
            if (acc) {
                lines.push(`**Accommodation:** ${acc.name}`)
                if (acc.url) lines.push(`[Visit website](${acc.url})`)
                lines.push('')
            }
        }
    }

    const activities = tour.activities as { title: string; activity_name: string }[] | null
    if (activities && activities.length > 0) {
        lines.push('## Activities')
        lines.push('')
        for (const a of activities) {
            lines.push(`- **${a.title}:** ${a.activity_name}`)
        }
        lines.push('')
    }

    const features = tour.topFeatures as { title: string; description: string }[] | null
    if (features && features.length > 0) {
        lines.push('## Highlights')
        lines.push('')
        for (const f of features) {
            lines.push(`- **${f.title}:** ${f.description}`)
        }
        lines.push('')
    }

    const md = lines.join('\n')

    return new NextResponse(md, {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
        },
    })
}
