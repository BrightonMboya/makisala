'use server';

import { db } from '@repo/db';
import {
  tours,
  accommodations,
  nationalParks,
  itineraryDays,
  itineraryAccommodations,
  proposals,
  comments,
  commentReplies,
} from '@repo/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

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

    // Fetch national parks map for quick lookup if needed, or just fetch individual names
    // Since we can't easily rely on the relation being present in the schema object without checking,
    // we will manually fetch the national park name if a day has a national_park_id.
    // Optimization: Fetch all needed national parks in one go.
    const parkIds = tour.days.map((d) => d.national_park_id).filter((id): id is string => !!id);

    let parkMap = new Map<string, string>();
    if (parkIds.length > 0) {
      const parks = await db
        .select({
          id: nationalParks.id,
          name: nationalParks.name,
        })
        .from(nationalParks)
        .where(inArray(nationalParks.id, parkIds));

      parks.forEach((p) => {
        parkMap.set(p.id, p.name);
      });
    }

    // Transform to builder format
    return {
      tourType: 'Private Tour', // Default
      price: tour.pricing,
      days: tour.days.map((day) => ({
        id: day.id,
        dayNumber: day.dayNumber,
        date: undefined, // Will be calculated from start date
        destination: day.national_park_id
          ? parkMap.get(day.national_park_id) || ''
          : day.dayTitle || '',
        accommodation: day.itineraryAccommodations?.[0]?.accommodation?.name || '',
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
        data: proposals.data,
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
  data: any;
  status?: 'draft' | 'shared';
}) {
  try {
    // Generate UUID if id is not provided or is empty
    let proposalId = data.id;
    if (!proposalId || proposalId.trim() === '') {
      const { randomUUID } = await import('crypto');
      proposalId = randomUUID();
    }

    await db
      .insert(proposals)
      .values({
        id: proposalId,
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
