'use server';

import { db } from '@repo/db';
import {
  tours,
  accommodations,
  nationalParks,
  proposals,
  proposalDays,
  proposalAccommodations,
  proposalActivities,
  proposalMeals,
  comments,
  commentReplies
} from '@repo/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getToursList(country?: string) {
  try {
    let query = db
      .select({
        id: tours.id,
        name: tours.tourName,
        days: tours.number_of_days,
      })
      .from(tours);

    if (country) {
      // @ts-ignore - dynamic where clause
      query = query.where(eq(tours.country, country));
    }

    const result = await query;
    return result;
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
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
                accommodation: true,
              },
            },
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    if (!tour) return null;

    // Transform to builder format - use IDs for destination and accommodation
    return {
      tourType: 'Private Tour', // Default
      price: tour.pricing,
      days: tour.days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        date: undefined, // Will be calculated from start date
        destination: day.national_park_id || null, // Use ID directly
        accommodation: day.itineraryAccommodations?.[0]?.accommodation?.id || null, // Use ID directly
        activities: [], // Activities are currently stored as JSON in tours table, not per day.
        meals: { breakfast: true, lunch: true, dinner: true }, // Default
      })),
    };
  } catch (error) {
    console.error('Error fetching tour details:', error);
    return null;
  }
}

export async function getAllAccommodations() {
  try {
    return await db
      .select({
        id: accommodations.id,
        name: accommodations.name,
      })
      .from(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    return [];
  }
}

export async function getAllNationalParks() {
  try {
    return await db
      .select({
        id: nationalParks.id,
        name: nationalParks.name,
      })
      .from(nationalParks);
  } catch (error) {
    console.error('Error fetching national parks:', error);
    return [];
  }
}

export async function getAllProposals() {
  try {
    const result = await db
      .select({
        id: proposals.id,
        name: proposals.name,
        status: proposals.status,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
        tourTitle: proposals.tourTitle,
        clientName: proposals.clientName,
      })
      .from(proposals)
      .orderBy(desc(proposals.updatedAt));
    return result;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

export async function getProposal(id: string) {
  try {
    const result = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      with: {
        tour: true,
        days: {
          with: {
            nationalPark: {
              with: {
                destination: true,
              },
            },
            accommodations: {
              with: {
                accommodation: {
                  with: {
                    images: true,
                  },
                },
              },
            },
            activities: true,
            meals: true,
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    return result;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
}

export async function saveProposal(data: {
  id: string;
  name: string;
  data: any; // Builder state data
  status?: 'draft' | 'shared';
  tourId: string; // Required: proposal must be created from a tour
}) {
  try {
    // Generate UUID if id is not provided or is empty
    let proposalId = data.id;
    if (!proposalId || proposalId.trim() === '') {
      const { randomUUID } = await import('crypto');
      proposalId = randomUUID();
    }

    const builderData = data.data;

    // Extract proposal-level data
    const proposalData = {
      id: proposalId,
      name: data.name,
      tourId: data.tourId || builderData.tourId, // Required - must be provided
      clientName: builderData.clientName || null,
      tourTitle: builderData.tourTitle || data.name,
      tourType: builderData.tourType || null,
      startDate: builderData.startDate ? new Date(builderData.startDate).toISOString() : null,
      startCity: builderData.startCity || null,
      pickupPoint: builderData.pickupPoint || null,
      transferIncluded: builderData.transferIncluded || null,
      pricingRows: builderData.pricingRows || null,
      extras: builderData.extras || null,
      travelerGroups: builderData.travelerGroups || null,
      inclusions: builderData.inclusions || null,
      exclusions: builderData.exclusions || null,
      status: data.status || 'draft',
      updatedAt: new Date().toISOString(),
    };

    // Use transaction to save proposal and all related data
    await db.transaction(async (tx) => {
      // Insert or update proposal
      await tx
        .insert(proposals)
        .values({
          id: proposalId,
          name: proposalData.name,
          tourId: proposalData.tourId, // Required
          clientName: proposalData.clientName || null,
          tourTitle: proposalData.tourTitle || null,
          tourType: proposalData.tourType || null,
          startDate: proposalData.startDate || null,
          travelerGroups: proposalData.travelerGroups || null,
          pricingRows: proposalData.pricingRows || null,
          extras: proposalData.extras || null,
          inclusions: proposalData.inclusions || null,
          exclusions: proposalData.exclusions || null,
          status: proposalData.status || 'draft',
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoUpdate({
          target: proposals.id,
          set: {
            name: proposalData.name,
            tourId: proposalData.tourId, // Required
            clientName: proposalData.clientName || null,
            tourTitle: proposalData.tourTitle || null,
            tourType: proposalData.tourType || null,
            startDate: proposalData.startDate || null,
            travelerGroups: proposalData.travelerGroups || null,
            pricingRows: proposalData.pricingRows || null,
            extras: proposalData.extras || null,
            inclusions: proposalData.inclusions || null,
            exclusions: proposalData.exclusions || null,
            status: proposalData.status || 'draft',
            updatedAt: new Date().toISOString(),
          },
        });

      // Delete existing days and related data (cascade will handle children)
      await tx.delete(proposalDays).where(eq(proposalDays.proposalId, proposalId));

      // Insert days with relationships
      const days: any[] = builderData.days || [];

      for (const day of days) {
        // Destination should be a national park ID (UUID) from the picker
        let nationalParkId: string | null = null;

        if (day.destination) {
          // Check if destination is a valid UUID (national park ID)
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            day.destination,
          );

          if (isUUID) {
            // It's an ID from the picker, use it directly
            nationalParkId = day.destination;
          }
          // If it's not a UUID, it means the picker wasn't used properly or data is corrupted
          // We'll skip it rather than trying to match by name
        }

        // Insert proposal day
        const [proposalDay] = await tx
          .insert(proposalDays)
          .values({
            proposalId,
            dayNumber: day.dayNumber,
            title: day.title || `Day ${day.dayNumber}`,
            description: day.description || null,
            nationalParkId,
          })
          .returning();

        if (!proposalDay) {
          throw new Error(`Failed to create proposal day ${day.dayNumber}`);
        }

        // Insert accommodations - accommodation should be an ID from the picker
        if (day.accommodation) {
          // Check if accommodation is a valid UUID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            day.accommodation,
          );

          if (isUUID) {
            // It's an ID from the picker, use it directly
            await tx.insert(proposalAccommodations).values({
              proposalDayId: proposalDay.id,
              accommodationId: day.accommodation,
            });
          }
          // If it's not a UUID, skip it (picker wasn't used properly)
        }

        // Insert activities
        if (day.activities && Array.isArray(day.activities)) {
          for (const activity of day.activities) {
            await tx.insert(proposalActivities).values({
              proposalDayId: proposalDay.id,
              name: activity.name,
              description: activity.description || null,
              location: activity.location || null,
              moment: activity.moment || 'Full Day',
              isOptional: activity.isOptional || false,
              imageUrl: activity.imageUrl || null,
              time: activity.time || null,
            });
          }
        }

        // Insert meals
        if (day.meals) {
          await tx.insert(proposalMeals).values({
            proposalDayId: proposalDay.id,
            breakfast: day.meals.breakfast || false,
            lunch: day.meals.lunch || false,
            dinner: day.meals.dinner || false,
          });
        }
      }
    });

    return { success: true, id: proposalId };
  } catch (error) {
    console.error('Error saving proposal:', error);
    return { success: false, error: 'Failed to save proposal' };
  }
}

export async function createComment(data: {
  proposalId: string;
  authorName: string;
  content: string;
  posX: number;
  posY: number;
  width?: number;
  height?: number;
}) {
  try {
    const [comment] = await db
      .insert(comments)
      .values({
        proposalId: data.proposalId,
        userName: data.authorName,
        content: data.content,
        posX: data.posX.toString(),
        posY: data.posY.toString(),
        width: data.width?.toString(),
        height: data.height?.toString(),
      })
      .returning();
    return { success: true, comment };
  } catch (error) {
    console.error('Error creating comment:', error);
    return { success: false, error: 'Failed to create comment' };
  }
}

export async function getComments(proposalId: string) {
  try {
    const commentsList = await db.query.comments.findMany({
      where: eq(comments.proposalId, proposalId),
      with: {
        replies: {
          orderBy: (replies, { asc }) => [asc(replies.createdAt)],
        },
      },
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });

    // Transform to match the Comment type expected by the frontend
    return commentsList.map((comment) => ({
      id: comment.id,
      posX: parseFloat(comment.posX),
      posY: parseFloat(comment.posY),
      width: comment.width ? parseFloat(comment.width) : undefined,
      height: comment.height ? parseFloat(comment.height) : undefined,
      content: comment.content,
      userName: comment.userName || 'Guest User',
      createdAt: new Date(comment.createdAt),
      status: comment.status,
      replies: comment.replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        userName: reply.userName || 'Guest User',
        createdAt: new Date(reply.createdAt),
      })),
    }));
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

export async function resolveComment(commentId: string) {
  try {
    await db.update(comments).set({ status: 'resolved' }).where(eq(comments.id, commentId));
    return { success: true };
  } catch (error) {
    console.error('Error resolving comment:', error);
    return { success: false, error: 'Failed to resolve comment' };
  }
}

export async function createCommentReply(data: {
  commentId: string;
  authorName: string;
  content: string;
}) {
  try {
    const [reply] = await db
      .insert(commentReplies)
      .values({
        commentId: data.commentId,
        userName: data.authorName,
        content: data.content,
      })
      .returning();
    return { success: true, reply };
  } catch (error) {
    console.error('Error creating comment reply:', error);
    return { success: false, error: 'Failed to create reply' };
  }
}
