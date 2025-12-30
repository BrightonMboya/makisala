'use server';

import { db } from '@repo/db';
import {
  tours,
  nationalParks,
  proposals,
  proposalDays,
  proposalAccommodations,
  proposalActivities,
  proposalMeals,
  comments,
  commentReplies,
  pages,
  organizations,
} from '@repo/db/schema';
import { eq, desc, inArray } from 'drizzle-orm';
import { sendCommentNotificationEmail } from '@repo/resend';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

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

export async function getOrganizationSettings() {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) return null;

    return await db.query.organizations.findFirst({
      where: eq(organizations.id, session.user.organizationId),
    });
  } catch (error) {
    console.error('Error fetching organization settings:', error);
    return null;
  }
}

export async function updateOrganizationSettings(data: {
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  notificationEmail?: string;
}) {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: 'User must be associated with an organization' };
    }

    await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, session.user.organizationId));

    return { success: true };
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function getAllAccommodations() {
  try {
    return await db.query.accommodations.findMany({
      with: {
        images: {
          limit: 1,
        },
      },
    });
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
        overview_page_id: nationalParks.overview_page_id,
      })
      .from(nationalParks);
  } catch (error) {
    console.error('Error fetching national parks:', error);
    return [];
  }
}

export async function getPageImages(pageIds: string[]) {
  try {
    if (pageIds.length === 0) return [];

    const pagesData = await db
      .select({ id: pages.id, featured_image_url: pages.featured_image_url })
      .from(pages)
      .where(inArray(pages.id, pageIds));

    return pagesData;
  } catch (error) {
    console.error('Error fetching page images:', error);
    return [];
  }
}

export async function getAllProposals() {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) return [];

    const result = await db
      .select({
        id: proposals.id,
        name: proposals.name,
        status: proposals.status,
        createdAt: proposals.createdAt,
        updatedAt: proposals.updatedAt,
        tourTitle: proposals.tourTitle,
        clientName: proposals.clientName,
        startDate: proposals.startDate,
        travelerGroups: proposals.travelerGroups,
      })
      .from(proposals)
      .where(eq(proposals.organizationId, session.user.organizationId))
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
        organization: true,
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
    const session = await getSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: 'User must be associated with an organization' };
    }

    // Extract proposal-level data
    const proposalData = {
      id: proposalId,
      name: data.name,
      tourId: data.tourId || builderData.tourId, // Required - must be provided
      organizationId: session.user.organizationId,
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
          organizationId: proposalData.organizationId,
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
            organizationId: proposalData.organizationId,
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

    // Trigger email notification
    if (comment) {
      try {
        const proposal = await db.query.proposals.findFirst({
          where: eq(proposals.id, data.proposalId),
          with: {
            organization: true,
            days: {
              with: {
                activities: true,
                accommodations: {
                  with: {
                    accommodation: true,
                  },
                },
              },
            },
          },
        });

        if (proposal?.organization?.notificationEmail) {
          await sendCommentNotificationEmail({
            proposalId: data.proposalId,
            clientName: data.authorName,
            proposalTitle: proposal.tourTitle || proposal.name,
            commentContent: data.content,
            commentAuthor: data.authorName,
            recipientEmail: proposal.organization.notificationEmail,
            commentPosition: {
              posX: data.posX,
              posY: data.posY,
              width: data.width,
              height: data.height,
            },
            proposalData: {
              days: (proposal.days as any[]).map((d) => ({
                dayNumber: d.dayNumber,
                title: d.title,
                activities: d.activities,
                accommodations: d.accommodations,
              })),
            },
          });
        }
      } catch (e) {
        console.error('Failed to send comment notification email:', e);
      }
    }

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

    // Trigger email notification for reply
    if (reply) {
      try {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, data.commentId),
        });

        if (comment) {
          const proposal = await db.query.proposals.findFirst({
            where: eq(proposals.id, comment.proposalId),
            with: {
              organization: true,
            },
          });

          if (proposal?.organization?.notificationEmail) {
            await sendCommentNotificationEmail({
              proposalId: proposal.id,
              clientName: data.authorName,
              proposalTitle: proposal.tourTitle || proposal.name,
              commentContent: data.content,
              commentAuthor: data.authorName,
              recipientEmail: proposal.organization.notificationEmail,
              isReply: true,
              parentComment: {
                content: comment.content,
                author: comment.userName || 'Unknown',
              },
            });
          }
        }
      } catch (e) {
        console.error('Failed to send reply notification email:', e);
      }
    }

    return { success: true, reply };
  } catch (error) {
    console.error('Error creating comment reply:', error);
    return { success: false, error: 'Failed to create reply' };
  }
}
