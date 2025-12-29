import { NextResponse } from 'next/server'

export async function GET() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    const placeId = process.env.GOOGLE_PLACE_ID

    if (!apiKey || !placeId) {
        return NextResponse.json(
            { error: 'Missing Google Places API credentials' },
            { status: 500 },
        )
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,reviews,user_ratings_total&key=${apiKey}`,
            { next: { revalidate: 3600 } }, // Cache for 1 hour
        )

        const data = await response.json()

        if (data.status !== 'OK') {
            throw new Error(data.error_message || 'Failed to fetch reviews')
        }

        return NextResponse.json({
            rating: data.result.rating,
            total_reviews: data.result.user_ratings_total,
            reviews: data.result.reviews,
        })
    } catch (error) {
        console.error('Error fetching Google Reviews:', error)
        return NextResponse.json(
            { error: 'Failed to fetch reviews' },
            { status: 500 },
        )
    }
}
