'use server';

import { db } from '@repo/db';
import {
  accommodations,
  clients,
  commentReplies,
  comments,
  itineraryAccommodations,
  itineraryDays,
  member,
  nationalParks,
  organizations,
  pages,
  proposalAccommodations,
  proposalActivities,
  proposalDays,
  proposalMeals,
  proposalNotes,
  proposals,
  tours,
} from '@repo/db/schema';
import { desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';
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

// Helper to get organization ID from session or member table
async function getOrganizationId(
  session: Awaited<ReturnType<typeof getSession>>,
): Promise<string | null> {
  if (!session?.user?.id) return null;

  // First try session's activeOrganizationId (set by Better Auth organization plugin)
  if (session.session?.activeOrganizationId) {
    return session.session.activeOrganizationId as string;
  }

  // Fallback: look up user's first organization from member table
  const [membership] = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, session.user.id))
    .limit(1);

  return membership?.organizationId ?? null;
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
      tourType: 'Private Tour',
      price: tour.pricing,
      country: tour.country,
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

// Get full tour by ID (for detail/edit page)
export async function getTourById(id: string) {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return null;

    const tour = await db.query.tours.findFirst({
      where: eq(tours.id, id),
      with: {
        days: {
          with: {
            itineraryAccommodations: {
              with: {
                accommodation: {
                  with: {
                    images: {
                      limit: 1,
                    },
                  },
                },
              },
            },
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    if (!tour) return null;

    // Authorization: Only allow viewing tours from user's organization
    if (tour.organizationId !== orgId) {
      return null;
    }

    return tour;
  } catch (error) {
    console.error('Error fetching tour by id:', error);
    return null;
  }
}

// Update tour with itinerary days
export async function updateTour(
  id: string,
  data: {
    tourName?: string;
    overview?: string;
    pricing?: string;
    country?: string;
    tags?: string[];
    img_url?: string;
    number_of_days?: number;
    itineraries?: Array<{
      dayNumber: number;
      title: string;
      overview?: string;
      national_park_id?: string;
      accommodation_id?: string;
    }>;
  },
) {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify tour belongs to organization
    const tour = await db.query.tours.findFirst({
      where: eq(tours.id, id),
      columns: { organizationId: true },
    });

    if (!tour || tour.organizationId !== orgId) {
      return { success: false, error: 'Tour not found or unauthorized' };
    }

    const { itineraries, ...tourData } = data;

    // Validate itinerary day numbers if provided
    if (itineraries && itineraries.length > 0) {
      const dayNumbers = itineraries.map((d) => d.dayNumber);
      const uniqueDayNumbers = new Set(dayNumbers);

      // Check for duplicate day numbers
      if (uniqueDayNumbers.size !== dayNumbers.length) {
        return { success: false, error: 'Duplicate day numbers are not allowed' };
      }

      // Check that all day numbers are positive integers
      if (dayNumbers.some((n) => !Number.isInteger(n) || n < 1)) {
        return { success: false, error: 'Day numbers must be positive integers' };
      }

      // Check that day numbers are sequential starting from 1
      const sortedDayNumbers = [...dayNumbers].sort((a, b) => a - b);
      const isSequential = sortedDayNumbers.every((num, idx) => num === idx + 1);
      if (!isSequential) {
        return { success: false, error: 'Day numbers must be sequential starting from 1' };
      }
    }

    await db.transaction(async (tx) => {
      // Update tour basic info
      await tx
        .update(tours)
        .set({
          ...tourData,
          updatedAt: new Date(),
        })
        .where(eq(tours.id, id));

      // Update itinerary days if provided
      if (itineraries && itineraries.length > 0) {
        // Delete existing days (cascade deletes accommodations)
        await tx.delete(itineraryDays).where(eq(itineraryDays.tourId, id));

        // Insert new days
        for (const day of itineraries) {
          const [newDay] = await tx
            .insert(itineraryDays)
            .values({
              tourId: id,
              dayNumber: day.dayNumber,
              dayTitle: day.title,
              overview: day.overview || null,
              national_park_id: day.national_park_id || null,
            })
            .returning({ id: itineraryDays.id });

          // Add accommodation if specified
          if (day.accommodation_id && newDay) {
            await tx.insert(itineraryAccommodations).values({
              itineraryDayId: newDay.id,
              accommodationId: day.accommodation_id,
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating tour:', error);
    return { success: false, error: 'Failed to update tour' };
  }
}

// Delete tour (cascade deletes days and accommodations)
export async function deleteTour(id: string) {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify tour belongs to organization
    const tour = await db.query.tours.findFirst({
      where: eq(tours.id, id),
      columns: { organizationId: true },
    });

    if (!tour || tour.organizationId !== orgId) {
      return { success: false, error: 'Tour not found or unauthorized' };
    }

    // Delete tour (cascade will handle days and accommodations)
    await db.delete(tours).where(eq(tours.id, id));

    return { success: true };
  } catch (error) {
    console.error('Error deleting tour:', error);
    return { success: false, error: 'Failed to delete tour' };
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
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return { success: false, error: 'User must be associated with an organization' };
    }

    await db
      .update(organizations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, orgId));

    return { success: true };
  } catch (error) {
    console.error('Error updating organization settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

export async function getAllAccommodations() {
  try {
    const results = await db.query.accommodations.findMany({
      with: {
        images: true,
      },
    });

    // Generate public URLs for all images
    return results.map((acc) => ({
      ...acc,
      images: acc.images.map((img) => ({
        ...img,
        url: `${env.SUPABASE_URL}/storage/v1/object/public/${img.bucket}/${img.key}`,
      })),
    }));
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
        latitude: nationalParks.latitude,
        longitude: nationalParks.longitude,
      })
      .from(nationalParks);
  } catch (error) {
    console.error('Error fetching national parks:', error);
    return [];
  }
}

export async function searchNationalParks(query: string, limit: number = 20) {
  try {
    const baseQuery = db
      .select({
        id: nationalParks.id,
        name: nationalParks.name,
      })
      .from(nationalParks)
      .limit(limit);

    if (!query.trim()) {
      return await baseQuery;
    }

    return await db
      .select({
        id: nationalParks.id,
        name: nationalParks.name,
      })
      .from(nationalParks)
      .where(ilike(nationalParks.name, `%${query}%`))
      .limit(limit);
  } catch (error) {
    console.error('Error searching national parks:', error);
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

// Fetch organization tours with full display data
export async function getTours() {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return [];

    return await db
      .select({
        id: tours.id,
        name: tours.tourName,
        days: tours.number_of_days,
        imageUrl: tours.img_url,
        overview: tours.overview,
        country: tours.country,
        pricing: tours.pricing,
        tags: tours.tags,
      })
      .from(tours)
      .where(eq(tours.organizationId, orgId))
      .orderBy(tours.tourName);
  } catch (error) {
    console.error('Error fetching tours:', error);
    return [];
  }
}

// Lightweight fetch for tours and clients (for new request dialog)
export async function getToursAndClients() {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return { tours: [], clients: [] };

    const [toursData, clientsData] = await Promise.all([
      db
        .select({
          id: tours.id,
          name: tours.tourName,
          days: tours.number_of_days,
        })
        .from(tours)
        .where(eq(tours.organizationId, orgId))
        .orderBy(tours.tourName),
      db
        .select({ id: clients.id, name: clients.name })
        .from(clients)
        .where(eq(clients.organizationId, orgId))
        .orderBy(clients.name),
    ]);

    return { tours: toursData, clients: clientsData };
  } catch (error) {
    console.error('Error fetching tours and clients:', error);
    return { tours: [], clients: [] };
  }
}

// Lightweight fetch for dashboard proposals only
export async function getProposalsForDashboard() {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return [];

    return await db.query.proposals.findMany({
      where: eq(proposals.organizationId, orgId),
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
      },
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
}

// Lightweight onboarding status check (organization + tour count)
export async function getOnboardingData() {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return { organization: null, tourCount: 0 };

    const [orgData, countResult] = await Promise.all([
      db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        columns: {
          id: true,
          name: true,
          logoUrl: true,
          notificationEmail: true,
          onboardingCompletedAt: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(tours)
        .where(eq(tours.organizationId, orgId)),
    ]);

    return { organization: orgData, tourCount: countResult[0]?.count ?? 0 };
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return { organization: null, tourCount: 0 };
  }
}

// Mark organization onboarding as complete (stores completion at org level)
export async function markOnboardingComplete() {
  try {
    const session = await getSession();
    const orgId = await getOrganizationId(session);
    if (!orgId) return { success: false };

    await db
      .update(organizations)
      .set({ onboardingCompletedAt: new Date() })
      .where(eq(organizations.id, orgId));

    return { success: true };
  } catch (error) {
    console.error('Error marking onboarding complete:', error);
    return { success: false };
  }
}

export async function getProposal(id: string) {
  try {
    const result = await db.query.proposals.findFirst({
      where: eq(proposals.id, id),
      with: {
        organization: {
          columns: {
            name: true,
            logoUrl: true,
          },
        },
        tour: {
          columns: {
            country: true,
            tourName: true,
          },
        },
        client: {
          columns: {
            name: true,
            email: true,
          },
        },
        days: {
          columns: {
            dayNumber: true,
            title: true,
            description: true,
            previewImage: true,
          },
          with: {
            nationalPark: {
              columns: {
                id: true,
                name: true,
                country: true,
                park_overview: true,
                latitude: true,
                longitude: true,
              },
              // with: {
              //   destination: true,
              // },
            },
            accommodations: {
              columns: {
                id: true,
              },
              with: {
                accommodation: {
                  columns: {
                    id: true,
                    name: true,
                    overview: true,
                    description: true,
                  },
                  with: {
                    images: {
                      columns: {
                        bucket: true,
                        key: true,
                      },
                    },
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
        tour: {
          columns: {
            country: true,
          },
        },
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
              },
            },
          },
          orderBy: (days, { asc }) => [asc(days.dayNumber)],
        },
      },
    });

    // Include country from tour relation
    if (result) {
      return {
        ...result,
        country: result.tour?.country || null,
      };
    }
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
    const orgId = await getOrganizationId(session);
    if (!orgId) {
      return { success: false, error: 'User must be associated with an organization' };
    }

    // Extract proposal-level data
    const proposalData = {
      id: proposalId,
      name: data.name,
      tourId: data.tourId || builderData.tourId, // Required - must be provided
      organizationId: orgId,
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

    // Trigger email notification - fetch only required fields
    if (comment) {
      try {
        const proposal = await db.query.proposals.findFirst({
          where: eq(proposals.id, data.proposalId),
          columns: {
            id: true,
            name: true,
            tourTitle: true,
          },
          with: {
            organization: {
              columns: {
                notificationEmail: true,
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

    // Trigger email notification for reply - fetch comment with proposal in one query
    if (reply) {
      try {
        const comment = await db.query.comments.findFirst({
          where: eq(comments.id, data.commentId),
          columns: {
            content: true,
            userName: true,
            proposalId: true,
          },
          with: {
            proposal: {
              columns: {
                id: true,
                name: true,
                tourTitle: true,
              },
              with: {
                organization: {
                  columns: {
                    notificationEmail: true,
                  },
                },
              },
            },
          },
        });

        if (comment?.proposal?.organization?.notificationEmail) {
          await sendCommentNotificationEmail({
            proposalId: comment.proposal.id,
            clientName: data.authorName,
            proposalTitle: comment.proposal.tourTitle || comment.proposal.name,
            commentContent: data.content,
            commentAuthor: data.authorName,
            recipientEmail: comment.proposal.organization.notificationEmail,
            isReply: true,
            parentComment: {
              content: comment.content,
              author: comment.userName || 'Unknown',
            },
          });
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
    const orgId = await getOrganizationId(session);
    if (!orgId) {
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

    // Calculate duration using SQL count (more efficient than fetching all rows)
    const daysCountResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(proposalDays)
      .where(eq(proposalDays.proposalId, proposalId));
    const daysCount = daysCountResult[0]?.count ?? 0;
    const duration = daysCount > 0 ? `${daysCount} days` : undefined;

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
    // Fetch proposal and day count in parallel (don't fetch full days data)
    const [proposal, daysCountResult] = await Promise.all([
      db.query.proposals.findFirst({
        where: eq(proposals.id, proposalId),
        with: {
          organization: true,
          client: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(proposalDays)
        .where(eq(proposalDays.proposalId, proposalId)),
    ]);

    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    if (!proposal.organization?.notificationEmail) {
      return { success: false, error: 'No notification email configured for this organization' };
    }

    // Calculate duration from count
    const daysCount = daysCountResult[0]?.count ?? 0;
    const duration = daysCount > 0 ? `${daysCount} days` : undefined;

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
      .orderBy(tours.tourName)
      .limit(100);

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
    const orgId = await getOrganizationId(session);
    if (!orgId) {
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

    // Authorization: Only allow cloning shared templates (null organizationId)
    // or templates from the user's own organization
    if (template.organizationId !== null && template.organizationId !== orgId) {
      return { success: false, error: 'Unauthorized to clone this template' };
    }

    // Use a transaction to ensure data integrity
    const result = await db.transaction(async (tx) => {
      // Create a new tour for the organization
      const newTourResult = await tx
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
          organizationId: orgId,
          clonedFromId: template.id,
        })
        .returning({ id: tours.id });

      const newTour = newTourResult[0];
      if (!newTour) {
        throw new Error('Failed to create tour');
      }

      // Clone the itinerary days if they exist
      if (template.days && template.days.length > 0) {
        for (const day of template.days) {
          const newDayResult = await tx
            .insert(itineraryDays)
            .values({
              tourId: newTour.id,
              dayNumber: day.dayNumber,
              dayTitle: day.dayTitle,
              overview: day.overview,
              national_park_id: day.national_park_id,
            })
            .returning({ id: itineraryDays.id });

          const newDay = newDayResult[0];
          if (!newDay) {
            throw new Error('Failed to create itinerary day');
          }

          // Clone accommodations for this day
          if (day.itineraryAccommodations && day.itineraryAccommodations.length > 0) {
            await tx.insert(itineraryAccommodations).values(
              day.itineraryAccommodations.map((acc) => ({
                itineraryDayId: newDay.id,
                accommodationId: acc.accommodationId,
              })),
            );
          }
        }
      }

      return { tourId: newTour.id };
    });

    return { success: true, tourId: result.tourId };
  } catch (error) {
    console.error('Error cloning template:', error);
    return { success: false, error: 'Failed to clone template' };
  }
}

// Get random day content template for a national park
export async function getRandomDayTemplate(
  nationalParkId: string,
  dayType?: 'arrival' | 'full_day' | 'half_day' | 'departure',
  excludeDescriptions?: string[],
) {
  try {
    const { dayContentTemplates } = await import('@repo/db/schema');

    // Build query conditions
    let query = db
      .select({
        id: dayContentTemplates.id,
        dayType: dayContentTemplates.dayType,
        description: dayContentTemplates.description,
      })
      .from(dayContentTemplates)
      .where(eq(dayContentTemplates.nationalParkId, nationalParkId));

    const templates = await query;

    if (templates.length === 0) {
      return null;
    }

    // Filter by day type if provided
    let candidates = templates;
    if (dayType) {
      const typeMatches = candidates.filter((t) => t.dayType === dayType);
      if (typeMatches.length > 0) {
        candidates = typeMatches;
      }
    }

    // Exclude already used descriptions
    if (excludeDescriptions && excludeDescriptions.length > 0) {
      const filtered = candidates.filter((t) => !excludeDescriptions.includes(t.description));
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    // Return random template
    const randomIndex = Math.floor(Math.random() * candidates.length);
    return candidates[randomIndex];
  } catch (error) {
    console.error('Error fetching day template:', error);
    return null;
  }
}

// ---------- PROPOSAL NOTES (Internal Team Notes) ----------

export async function createProposalNote(data: { proposalId: string; content: string }) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    const [note] = await db
      .insert(proposalNotes)
      .values({
        proposalId: data.proposalId,
        userId: session.user.id,
        userName: session.user.name || 'Unknown User',
        content: data.content,
      })
      .returning();

    return { success: true, note };
  } catch (error) {
    console.error('Error creating proposal note:', error);
    return { success: false, error: 'Failed to create note' };
  }
}

export async function getProposalNotes(proposalId: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return [];
    }

    const notesList = await db.query.proposalNotes.findMany({
      where: eq(proposalNotes.proposalId, proposalId),
      orderBy: (notes, { desc }) => [desc(notes.createdAt)],
    });

    return notesList.map((note) => ({
      id: note.id,
      content: note.content,
      userName: note.userName || 'Unknown User',
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error('Error fetching proposal notes:', error);
    return [];
  }
}

export async function updateProposalNote(noteId: string, content: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db
      .update(proposalNotes)
      .set({ content, updatedAt: new Date() })
      .where(eq(proposalNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error('Error updating proposal note:', error);
    return { success: false, error: 'Failed to update note' };
  }
}

export async function deleteProposalNote(noteId: string) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.delete(proposalNotes).where(eq(proposalNotes.id, noteId));

    return { success: true };
  } catch (error) {
    console.error('Error deleting proposal note:', error);
    return { success: false, error: 'Failed to delete note' };
  }
}
