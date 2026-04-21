import { NextResponse } from 'next/server'

import {
    getAccommodationBySlug,
    getToursFeaturingAccommodation,
} from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const accommodation = await getAccommodationBySlug(slug)

    if (!accommodation) {
        return new NextResponse('Accommodation not found', { status: 404 })
    }

    const lines: string[] = []

    lines.push(`# ${accommodation.name}`)
    lines.push('')

    if (accommodation.country) {
        lines.push(`**Country:** ${accommodation.country}  `)
    }
    if (accommodation.latitude && accommodation.longitude) {
        lines.push(
            `**Coordinates:** ${accommodation.latitude}, ${accommodation.longitude}  `
        )
    }
    lines.push(`**Page:** ${BASE_URL}/accommodations/${slug}`)
    lines.push('')

    const summary =
        accommodation.enhancedDescription?.trim() ||
        accommodation.overview?.trim() ||
        accommodation.description?.trim()
    if (summary) {
        lines.push('## Overview')
        lines.push('')
        lines.push(summary)
        lines.push('')
    }

    if (accommodation.locationHighlights && accommodation.locationHighlights.length > 0) {
        lines.push('## Location Highlights')
        lines.push('')
        for (const h of accommodation.locationHighlights) {
            lines.push(`- ${h}`)
        }
        lines.push('')
    }

    if (accommodation.amenities && accommodation.amenities.length > 0) {
        lines.push('## Amenities')
        lines.push('')
        for (const group of accommodation.amenities) {
            lines.push(`### ${group.category}`)
            lines.push('')
            for (const item of group.items) {
                lines.push(`- ${item}`)
            }
            lines.push('')
        }
    }

    if (accommodation.roomTypes && accommodation.roomTypes.length > 0) {
        lines.push('## Rooms & Suites')
        lines.push('')
        for (const room of accommodation.roomTypes) {
            lines.push(`### ${room.name}`)
            if (room.capacity) {
                lines.push(`**Capacity:** ${room.capacity}  `)
            }
            if (room.description) {
                lines.push('')
                lines.push(room.description)
            }
            lines.push('')
        }
    }

    if (accommodation.pricingInfo) {
        lines.push('## Pricing')
        lines.push('')
        lines.push(accommodation.pricingInfo)
        lines.push('')
    }

    const relatedTours = await getToursFeaturingAccommodation(accommodation.id)
    if (relatedTours.length > 0) {
        lines.push(`## Safaris that include ${accommodation.name}`)
        lines.push('')
        for (const tour of relatedTours) {
            const price = tour.pricing
                ? `$${Number(tour.pricing).toLocaleString('en-US')} per person`
                : 'Price on request'
            lines.push(`- [${tour.tourName}](${BASE_URL}/tours/${tour.slug}): ${tour.number_of_days} days, from ${price}`)
        }
        lines.push('')
    }

    lines.push('---')
    lines.push(
        `Book a custom safari that includes ${accommodation.name}: ${BASE_URL}/contact`
    )
    lines.push('Makisala. Bespoke African safari experiences. https://makisala.com')

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
    })
}
