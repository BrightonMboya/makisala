'use server';

import { db } from '@repo/db';
import {
  accommodations,
  clients,
  commentReplies,
  comments,
  itineraryAccommodations,
  itineraryDays,
  nationalParks,
  organizations,
  pages,
  proposalAccommodations,
  proposalActivities,
  proposalDays,
  proposalMeals,
  proposals,
  tours,
} from '@repo/db/schema';
import { desc, eq, ilike, inArray, isNull } from 'drizzle-orm';
import {
  sendCommentNotificationEmail,
  sendProposalAcceptanceEmail,
  sendProposalShareEmail,
} from '@repo/resend';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { listStorageFolders, listStorageImages } from '@/lib/storage';
import { env } from '@/lib/env';

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

// Get tours belonging to the user's organization
export async function getToursByOrganization() {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) return [];

    const result = await db
      .select({
        id: tours.id,
        name: tours.tourName,
        days: tours.number_of_days,
      })
      .from(tours)
      .where(eq(tours.organizationId, session.user.organizationId))
      .orderBy(tours.tourName);

    return result;
  } catch (error) {
    console.error('Error fetching organization tours:', error);
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
      selectedTheme: 'minimalistic', // Default theme for tours
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

export async function searchAccommodations(query: string, limit: number = 20) {
  try {
    if (!query.trim()) {
      return await db.query.accommodations.findMany({
        limit,
        with: {
          images: {
            limit: 1,
          },
        },
      });
    }
    return await db.query.accommodations.findMany({
      where: ilike(accommodations.name, `%${query}%`),
      limit,
      with: {
        images: {
          limit: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error searching accommodations:', error);
    return [];
  }
}

export async function getAccommodationById(id: string) {
  try {
    return await db.query.accommodations.findFirst({
      where: eq(accommodations.id, id),
      with: {
        images: {
          limit: 1,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching accommodation by id:', error);
    return null;
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

    const result = await db.query.proposals.findMany({
      where: eq(proposals.organizationId, session.user.organizationId),
      orderBy: desc(proposals.updatedAt),
      with: {
        client: true,
      },
      columns: {
        id: true,
        name: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        tourTitle: true,
        startDate: true,
        travelerGroups: true,
      },
    });
    return result;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

// Combined dashboard data fetch - single session call
// Fetches essential data for sidebar and dashboard (clients, org tours, proposals)
export async function getDashboardData() {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) {
      return { clients: [], tours: [], proposals: [], organization: null };
    }

    const orgId = session.user.organizationId;

    // Fetch essential data in parallel
    const [clientsData, orgToursData, proposalsData, orgData] = await Promise.all([
      db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.organizationId, orgId))
        .orderBy(clients.name),
      // Organization's tours only (properly scoped)
      db
        .select({
          id: tours.id,
          name: tours.tourName,
          days: tours.number_of_days,
        })
        .from(tours)
        .where(eq(tours.organizationId, orgId))
        .orderBy(tours.tourName),
      // Proposals for dashboard display
      db.query.proposals.findMany({
        where: eq(proposals.organizationId, orgId),
        orderBy: desc(proposals.updatedAt),
        with: { client: true },
        columns: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          tourTitle: true,
          startDate: true,
          travelerGroups: true,
        },
      }),
      db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: {
          id: true,
          name: true,
          logoUrl: true,
          primaryColor: true,
          notificationEmail: true,
        },
      }),
    ]);

    return {
      clients: clientsData,
      tours: orgToursData,
      proposals: proposalsData,
      organization: orgData,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { clients: [], tours: [], proposals: [], organization: null };
  }
}

export async function getProposal(id: string) {
  try {
    const result = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      with: {
        organization: true,
        tour: true,
        client: true,
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

// Optimized query for builder - only fetches needed fields, no heavy relations
export async function getProposalForBuilder(id: string) {
  try {
    const result = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      columns: {
        id: true,
        name: true,
        tourId: true,
        tourTitle: true,
        tourType: true,
        clientId: true,
        startDate: true,
        startCity: true,
        endCity: true,
        pickupPoint: true,
        transferIncluded: true,
        travelerGroups: true,
        pricingRows: true,
        extras: true,
        inclusions: true,
        exclusions: true,
        theme: true,
        heroImage: true,
      },
      with: {
        days: {
          columns: {
            id: true,
            dayNumber: true,
            nationalParkId: true,
            description: true,
            previewImage: true,
          },
          with: {
            accommodations: {
              columns: {
                accommodationId: true,
              },
              with: {
                accommodation: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            meals: {
              columns: {
                breakfast: true,
                lunch: true,
                dinner: true,
              },
            },
            activities: {
              columns: {
                id: true,
                name: true,
                description: true,
                duration: true,
                sortOrder: true,
              },
            },
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    return result;
  } catch (error) {
    console.error('Error fetching proposal for builder:', error);
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
      clientId: builderData.clientId || null,
      tourTitle: builderData.tourTitle || data.name,
      tourType: builderData.tourType || null,
      theme: builderData.selectedTheme || 'minimalistic',
      heroImage: builderData.heroImage || null,
      startDate: builderData.startDate ? new Date(builderData.startDate).toISOString() : null,
      startCity: builderData.startCity || null,
      endCity: builderData.endCity || null,
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
          clientId: proposalData.clientId || null,
          tourTitle: proposalData.tourTitle || null,
          tourType: proposalData.tourType || null,
          theme: proposalData.theme || 'minimalistic',
          heroImage: proposalData.heroImage || null,
          startDate: proposalData.startDate || null,
          startCity: proposalData.startCity || null,
          endCity: proposalData.endCity || null,
          pickupPoint: proposalData.pickupPoint || null,
          transferIncluded: proposalData.transferIncluded || null,
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
            clientId: proposalData.clientId || null,
            tourTitle: proposalData.tourTitle || null,
            tourType: proposalData.tourType || null,
            theme: proposalData.theme || 'minimalistic',
            heroImage: proposalData.heroImage || null,
            startDate: proposalData.startDate || null,
            startCity: proposalData.startCity || null,
            endCity: proposalData.endCity || null,
            pickupPoint: proposalData.pickupPoint || null,
            transferIncluded: proposalData.transferIncluded || null,
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
            previewImage: day.previewImage || null,
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

export async function sendProposalToClient(proposalId: string, message?: string) {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Fetch the proposal with client and organization data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
      with: {
        client: true,
        organization: true,
      },
    });

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (!proposal.client?.email) {
      return { success: false, error: 'Client does not have an email address' };
    }

    // Calculate duration
    const daysCount = await db.query.proposalDays.findMany({
      where: eq(proposalDays.proposalId, proposalId),
    });
    const duration = daysCount.length > 0 ? `${daysCount.length} days` : undefined;

    // Format start date
    const startDate = proposal.startDate
      ? new Date(proposal.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined;

    const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${proposalId}`;

    const result = await sendProposalShareEmail({
      clientEmail: proposal.client.email,
      clientName: proposal.client.name,
      agencyName: proposal.organization?.name || 'Your Travel Agency',
      proposalTitle: proposal.tourTitle || proposal.name,
      proposalUrl,
      startDate,
      duration,
      message,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending proposal to client:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

// Storage Actions (Supabase)
const STORAGE_BUCKET = env.SUPABASE_PUBLIC_BUCKET;
const ACCOMMODATIONS_BUCKET = 'accommodations';
const ACCOMMODATIONS_FOLDER = 'accommodations';

// UUID regex pattern
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getStorageImages(folder?: string, bucket?: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    const targetBucket = bucket || STORAGE_BUCKET;
    const images = await listStorageImages(targetBucket, folder);
    return images.map((img) => ({
      public_id: img.id,
      secure_url: img.url,
    }));
  } catch (error) {
    console.error('Error fetching storage images:', error);
    return [];
  }
}

export async function getStorageFolders(parent_folder?: string, bucket?: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    const targetBucket = bucket || STORAGE_BUCKET;
    const folders = await listStorageFolders(targetBucket, parent_folder);

    // If we're in the accommodations folder, map UUIDs to names
    if (targetBucket === ACCOMMODATIONS_BUCKET && parent_folder === ACCOMMODATIONS_FOLDER) {
      const uuidFolders = folders.filter((f) => UUID_PATTERN.test(f.name));

      if (uuidFolders.length > 0) {
        const uuids = uuidFolders.map((f) => f.name);
        const accommodationData = await db
          .select({ id: accommodations.id, name: accommodations.name })
          .from(accommodations)
          .where(inArray(accommodations.id, uuids));

        const nameMap = new Map(accommodationData.map((a) => [a.id, a.name]));

        return folders.map((folder) => ({
          ...folder,
          displayName: nameMap.get(folder.name) || folder.name,
        }));
      }
    }

    return folders.map((folder) => ({
      ...folder,
      displayName: folder.name,
    }));
  } catch (error) {
    console.error('Error fetching storage folders:', error);
    return [];
  }
}

// Search accommodations and return their storage folders
export async function searchAccommodationFolders(query: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    if (!query || query.length < 2) {
      return [];
    }

    const results = await db
      .select({ id: accommodations.id, name: accommodations.name })
      .from(accommodations)
      .where(ilike(accommodations.name, `%${query}%`))
      .limit(20);

    return results.map((acc) => ({
      name: acc.id,
      path: `${ACCOMMODATIONS_FOLDER}/${acc.id}`,
      displayName: acc.name,
    }));
  } catch (error) {
    console.error('Error searching accommodations:', error);
    return [];
  }
}

// Get all accommodations for browsing
export async function getAllAccommodationFolders() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    const results = await db
      .select({ id: accommodations.id, name: accommodations.name })
      .from(accommodations)
      .orderBy(accommodations.name)
      .limit(10);

    return results.map((acc) => ({
      name: acc.id,
      path: `${ACCOMMODATIONS_FOLDER}/${acc.id}`,
      displayName: acc.name,
    }));
  } catch (error) {
    console.error('Error fetching all accommodations:', error);
    return [];
  }
}

export async function confirmProposal(proposalId: string, clientName: string) {
  try {
    // Fetch the proposal with organization and client data
    const proposal = await db.query.proposals.findFirst({
      where: eq(proposals.id, proposalId),
      with: {
        organization: true,
        client: true,
        days: true,
      },
    });

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (!proposal.organization?.notificationEmail) {
      return { success: false, error: 'No notification email configured for this organization' };
    }

    // Calculate duration
    const duration = proposal.days?.length > 0 ? `${proposal.days.length} days` : undefined;

    // Format start date
    const startDate = proposal.startDate
      ? new Date(proposal.startDate).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : undefined;

    // Calculate total price from pricing rows
    let totalPrice: string | undefined;
    if (proposal.pricingRows) {
      const rows = proposal.pricingRows as Array<{ count: number; unitPrice: number }>;
      const total = rows.reduce((acc, row) => acc + row.count * row.unitPrice, 0);
      if (total > 0) {
        totalPrice = `$${total.toLocaleString()}`;
      }
    }

    const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/proposal/${proposalId}`;

    // Send the acceptance email
    const result = await sendProposalAcceptanceEmail({
      agencyName: proposal.organization.name,
      clientName: clientName || proposal.client?.name || 'Guest',
      clientEmail: proposal.client?.email || undefined,
      proposalTitle: proposal.tourTitle || proposal.name,
      proposalUrl,
      startDate,
      duration,
      totalPrice,
      recipientEmail: proposal.organization.notificationEmail,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // Optionally update proposal status to 'confirmed' if you want to track this
    // await db.update(proposals).set({ status: 'confirmed' }).where(eq(proposals.id, proposalId));

    return { success: true };
  } catch (error) {
    console.error('Error confirming proposal:', error);
    return { success: false, error: 'Failed to confirm proposal' };
  }
}

// Get shared templates (tours with no organizationId)
export async function getSharedTemplates() {
  try {
    const templates = await db
      .select({
        id: tours.id,
        name: tours.tourName,
        overview: tours.overview,
        days: tours.number_of_days,
        country: tours.country,
        imageUrl: tours.img_url,
        tags: tours.tags,
      })
      .from(tours)
      .where(isNull(tours.organizationId))
      .orderBy(tours.tourName);

    return templates;
  } catch (error) {
    console.error('Error fetching shared templates:', error);
    return [];
  }
}

// Clone a template to the user's organization
export async function cloneTemplate(templateId: string) {
  try {
    const session = await getSession();
    if (!session?.user?.organizationId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get the template to clone
    const template = await db.query.tours.findFirst({
      where: eq(tours.id, templateId),
      with: {
        days: {
          with: {
            itineraryAccommodations: true,
          },
        },
      },
    });

    if (!template) {
      return { success: false, error: 'Template not found' };
    }

    // Create a new tour for the organization
    const [newTour] = await db
      .insert(tours)
      .values({
        tourName: template.tourName,
        slug: template.slug,
        overview: template.overview,
        pricing: template.pricing,
        country: template.country,
        sourceUrl: template.sourceUrl,
        activities: template.activities,
        topFeatures: template.topFeatures,
        img_url: template.img_url,
        number_of_days: template.number_of_days,
        tags: template.tags,
        organizationId: session.user.organizationId,
        clonedFromId: template.id,
      })
      .returning({ id: tours.id });

    // Clone the itinerary days if they exist
    if (template.days && template.days.length > 0) {
      for (const day of template.days) {
        const [newDay] = await db
          .insert(itineraryDays)
          .values({
            tourId: newTour.id,
            dayNumber: day.dayNumber,
            title: day.title,
            description: day.description,
            nationalParkId: day.nationalParkId,
          })
          .returning({ id: itineraryDays.id });

        // Clone accommodations for this day
        if (day.itineraryAccommodations && day.itineraryAccommodations.length > 0) {
          await db.insert(itineraryAccommodations).values(
            day.itineraryAccommodations.map((acc: any) => ({
              itineraryDayId: newDay.id,
              accommodationId: acc.accommodationId,
              nights: acc.nights,
            }))
          );
        }
      }
    }

    return { success: true, tourId: newTour.id };
  } catch (error) {
    console.error('Error cloning template:', error);
    return { success: false, error: 'Failed to clone template' };
  }
}
