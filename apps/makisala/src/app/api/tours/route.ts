import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { itineraryDays, nationalParks, tours } from '@/db/schema'
import { and, eq, exists, gte, ilike, inArray, lte, or, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const countries = searchParams.get('country')?.split(',').filter(Boolean) || []
    const np = searchParams.get('np') || ''
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
            ? or(ilike(tours.tourName, `%${search}%`), ilike(tours.overview, `%${search}%`))
            : undefined,
        countries.length > 0 ? inArray(tours.country, countries) : undefined,
        gte(tours.pricing, String(minPrice)),
        lte(tours.pricing, String(maxPrice)),
        gte(tours.number_of_days, minDays),
        lte(tours.number_of_days, maxDays),
        tags && tags.length > 0
            ? sql`${tours.tags}
            &&
            ${sql.raw(`ARRAY[${tags.map(t => `'${t}'`).join(', ')}]::text[]`)}`
            : undefined,
        np
            ? exists(
                  db
                      .select()
                      .from(itineraryDays)
                      .innerJoin(
                          nationalParks,
                          eq(itineraryDays.national_park_id, nationalParks.id)
                      )
                      .where(
                          and(
                              eq(itineraryDays.tourId, tours.id),
                              ilike(nationalParks.name, `%${np}%`)
                          )
                      )
              )
            : undefined
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
