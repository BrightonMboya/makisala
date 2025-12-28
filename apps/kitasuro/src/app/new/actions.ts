'use server'

import { db } from '@repo/db'
import { tours, accommodations, nationalParks, itineraryDays, itineraryAccommodations, proposals, comments } from '@repo/db/schema'
import { eq, inArray } from 'drizzle-orm'

export async function getToursList(country?: string) {
    try {
        let query = db.select({
            id: tours.id,
            name: tours.tourName,
            days: tours.number_of_days,
        }).from(tours)

        if (country) {
            // @ts-ignore - dynamic where clause
            query = query.where(eq(tours.country, country))
        }

        const result = await query
        return result
    } catch (error) {
        console.error('Error fetching tours:', error)
        return []
    }
}

export async function getTourDetails(id: string) {
    try {
        const tour = await db.query.tours.findFirst({
            where: eq(tours.id, id),
            with: {
                days: {
                    with: {
                        itineraryAccommodations: {
                            with: {
                                accommodation: true
                            }
                        }
                    },
                    orderBy: (days, { asc }) => [asc(days.dayNumber)],
                }
            }
        })

        if (!tour) return null

        // Fetch national parks map for quick lookup if needed, or just fetch individual names
        // Since we can't easily rely on the relation being present in the schema object without checking,
        // we will manually fetch the national park name if a day has a national_park_id.
        // Optimization: Fetch all needed national parks in one go.
        const parkIds = tour.days
            .map(d => d.national_park_id)
            .filter((id): id is string => !!id)
        
        let parkMap = new Map<string, string>()
        if (parkIds.length > 0) {
            const parks = await db.select({
                id: nationalParks.id,
                name: nationalParks.name
            })
            .from(nationalParks)
            .where(inArray(nationalParks.id, parkIds))
            
            parks.forEach(p => {
                parkMap.set(p.id, p.name)
            })
        }

        // Transform to builder format
        return {
            tourType: 'Private Tour', // Default
            price: tour.pricing,
            days: tour.days.map(day => ({
                id: day.id,
                dayNumber: day.dayNumber,
                date: undefined, // Will be calculated from start date
                destination: day.national_park_id ? (parkMap.get(day.national_park_id) || '') : (day.dayTitle || ''),
                accommodation: day.itineraryAccommodations?.[0]?.accommodation?.name || '',
                activities: [], // Activities are currently stored as JSON in tours table, not per day.
                meals: { breakfast: true, lunch: true, dinner: true } // Default
            }))
        }
    } catch (error) {
        console.error('Error fetching tour details:', error)
        return null
    }
}

export async function getAllAccommodations() {
    try {
        return await db.select({
            id: accommodations.id,
            name: accommodations.name,
        }).from(accommodations)
    } catch (error) {
        console.error('Error fetching accommodations:', error)
        return []
    }
}

export async function getAllNationalParks() {
    try {
        return await db.select({
            id: nationalParks.id,
            name: nationalParks.name,
        }).from(nationalParks)
    } catch (error) {
        console.error('Error fetching national parks:', error)
        return []
    }
}

export async function getProposal(id: string) {
    try {
        const result = await db.query.proposals.findFirst({
            where: eq(proposals.id, id),
        })
        return result
    } catch (error) {
        console.error('Error fetching proposal:', error)
        return null
    }
}

export async function saveProposal(data: {
    id: string
    name: string
    data: any
    status?: 'draft' | 'shared'
}) {
    try {
        await db
            .insert(proposals)
            .values({
                id: data.id,
                name: data.name,
                data: data.data,
                status: data.status || 'draft',
                updatedAt: new Date().toISOString(),
            })
            .onConflictDoUpdate({
                target: proposals.id,
                set: {
                    name: data.name,
                    data: data.data,
                    status: data.status || 'draft',
                    updatedAt: new Date().toISOString(),
                },
            })
        return { success: true }
    } catch (error) {
        console.error('Error saving proposal:', error)
        return { success: false, error: 'Failed to save proposal' }
    }
}

export async function createComment(data: {
    proposalId: string
    sectionId?: string
    authorName: string
    content: string
}) {
    try {
        const [comment] = await db
            .insert(comments)
            .values({
                proposalId: data.proposalId,
                sectionId: data.sectionId,
                authorName: data.authorName,
                content: data.content,
            })
            .returning()
        return { success: true, comment }
    } catch (error) {
        console.error('Error creating comment:', error)
        return { success: false, error: 'Failed to create comment' }
    }
}

export async function getComments(proposalId: string) {
    try {
        return await db.query.comments.findMany({
            where: eq(comments.proposalId, proposalId),
            orderBy: (comments, { desc }) => [desc(comments.createdAt)],
        })
    } catch (error) {
        console.error('Error fetching comments:', error)
        return []
    }
}

export async function resolveComment(commentId: string) {
    try {
        await db
            .update(comments)
            .set({ isResolved: true })
            .where(eq(comments.id, commentId))
        return { success: true }
    } catch (error) {
        console.error('Error resolving comment:', error)
        return { success: false, error: 'Failed to resolve comment' }
    }
}
