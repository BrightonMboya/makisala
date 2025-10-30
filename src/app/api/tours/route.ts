import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { tours } from '@/db/schema'
import { and, eq, gte, ilike, lte, or, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const country = searchParams.get('country') || ''
    const minPrice = Number.parseFloat(searchParams.get('minPrice') || '0')
    const maxPrice = Number.parseFloat(searchParams.get('maxPrice') || '10000')
    const minDays = Number.parseInt(searchParams.get('minDays') || '1')
    const maxDays = Number.parseInt(searchParams.get('maxDays') || '30')
    const tags = searchParams.get('tags')?.split(',').filter(Boolean) || []
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '12')

    const offset = (page - 1) * limit

    // Build where conditions
    const conditions = and(
        search
            ? or(
                  ilike(tours.tourName, `%${search}%`),
                  ilike(tours.overview, `%${search}%`),
              )
            : undefined,
        country ? eq(tours.country, country) : undefined,
        gte(tours.pricing, String(minPrice)),
        lte(tours.pricing, String(maxPrice)),
        gte(tours.number_of_days, minDays),
        lte(tours.number_of_days, maxDays),
        tags && tags.length > 0
            ? sql`${tours.tags}
            &&
            ${sql.raw(`ARRAY[${tags.map((t) => `'${t}'`).join(', ')}]::text[]`)}`
            : undefined,
    )

    // Query paginated tours
    const paginatedTours = await db
        .select()
        .from(tours)
        .where(conditions)
        .limit(limit)
        .offset(offset)

    // Count total results (for pagination)
    const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(tours)
        .where(conditions)

    const totalCount = Number(count)
    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
        tours: paginatedTours,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    })
}
