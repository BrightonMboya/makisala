import { resend } from '../client';
import { env } from '../env';
import { renderCommentNotificationEmail } from '../templates/comment-notification';
import { renderProposalShareEmail } from '../templates/proposal-share';
import { renderProposalAcceptanceEmail } from '../templates/proposal-acceptance';
import { renderTeamInvitationEmail } from '../templates/team-invitation';
import { renderEmailVerificationEmail } from '../templates/email-verification';
import { renderNoteMentionEmail } from '../templates/note-mention';

export interface CommentNotificationData {
  proposalId: string;
  clientName: string;
  proposalTitle: string;
  commentContent: string;
  commentAuthor: string;
  proposalUrl?: string;
  commentDate?: string;
  commentPosition?: {
    posX: number;
    posY: number;
    width?: number;
    height?: number;
  };
  proposalData?: {
    days?: Array<{
      dayNumber: number;
      title: string | null;
      activities?: Array<{
        name: string;
        moment: string;
      }>;
      accommodations?: Array<{
        accommodation: {
          name: string;
        };
      }>;
    }>;
  };
  isReply?: boolean;
  parentComment?: {
    content: string;
    author: string;
  };
  recipientEmail?: string;
}

/**
 * Sends an email notification when a client adds a comment on a proposal.
 *
 * @param data - The comment notification data
 * @returns Promise with success status and optional error message
 */
export async function sendCommentNotificationEmail(
  data: CommentNotificationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Format the comment date
    const commentDate =
      data.commentDate ||
      new Date().toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      });

    // Generate the full proposal URL if not provided
    const proposalUrl =
      data.proposalUrl || `${env.NEXT_PUBLIC_APP_URL}/proposal/${data.proposalId}`;

    // Determine comment location description with meaningful context
    let locationDescription = 'on the proposal';
    let commentedSection: string | null = null;

    if (data.commentPosition && data.proposalData) {
      const { posY } = data.commentPosition;
      const { days } = data.proposalData;

      // Hero section is typically 0-15% (85vh hero)
      // Main content starts around 15%
      // Each day section is roughly 8-12% of viewport height
      // Accommodations/pricing are typically in the last 20-30%

      if (posY < 15) {
        locationDescription = 'on the hero section';
        commentedSection = 'Hero/Title Section';
      } else if (days && days.length > 0) {
        // Estimate which day based on position
        // Hero takes ~15%, then each day takes roughly (85% / days.length)
        const contentStart = 15;
        const contentHeight = 85;
        const dayHeight = contentHeight / days.length;

        // Find which day section
        const dayIndex = Math.min(Math.floor((posY - contentStart) / dayHeight), days.length - 1);
        const day = days[dayIndex];

        if (day) {
          // Try to identify if it's an activity, accommodation, or general day content
          const dayProgress = ((posY - contentStart) % dayHeight) / dayHeight;

          if (day.activities && day.activities.length > 0) {
            // Activities are typically in the first 60% of a day section
            if (dayProgress < 0.6) {
              const activityIndex = Math.min(
                Math.floor((dayProgress / 0.6) * day.activities.length),
                day.activities.length - 1,
              );
              const activity = day.activities[activityIndex];
              if (activity) {
                locationDescription = `on Day ${day.dayNumber}: ${activity.moment} Activity - ${activity.name}`;
                commentedSection = `Day ${day.dayNumber} - ${activity.name}`;
              } else {
                // If no specific activity, just show the day
                locationDescription = `on Day ${day.dayNumber}`;
                commentedSection = `Day ${day.dayNumber}`;
              }
            } else if (
              day.accommodations &&
              day.accommodations.length > 0 &&
              day.accommodations[0]?.accommodation
            ) {
              // Accommodation is typically in the last 40% of a day section
              const accommodation = day.accommodations[0].accommodation;
              locationDescription = `on Day ${day.dayNumber}: Accommodation - ${accommodation.name}`;
              commentedSection = `Day ${day.dayNumber} - ${accommodation.name}`;
            } else {
              // Just show the day number, no redundant title
              locationDescription = `on Day ${day.dayNumber}`;
              commentedSection = `Day ${day.dayNumber}`;
            }
          } else {
            // Just show the day number
            locationDescription = `on Day ${day.dayNumber}`;
            commentedSection = `Day ${day.dayNumber}`;
          }
        }
      } else if (posY > 70) {
        // Likely in accommodations, pricing, or footer section
        locationDescription = 'on the accommodations or pricing section';
        commentedSection = 'Accommodations/Pricing';
      } else {
        locationDescription = 'on the itinerary section';
        commentedSection = 'Itinerary';
      }
    }

    // Render the email HTML
    const html = renderCommentNotificationEmail({
      ...data,
      commentDate,
      proposalUrl,
      locationDescription,
      commentedSection: commentedSection || undefined,
      isReply: data.isReply,
      parentComment: data.parentComment,
    });

    // Determine the from email address
    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    // Send the email
    const subject = data.isReply
      ? `New reply on proposal comment from ${data.clientName}`
      : `New comment on proposal from ${data.clientName}`;

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.recipientEmail!,
      subject,
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface ProposalShareData {
  clientEmail: string;
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  message?: string;
}

/**
 * Sends an email to share a proposal with a client.
 */
export async function sendProposalShareEmail(
  data: ProposalShareData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = renderProposalShareEmail({
      clientName: data.clientName,
      agencyName: data.agencyName,
      proposalTitle: data.proposalTitle,
      proposalUrl: data.proposalUrl,
      startDate: data.startDate,
      duration: data.duration,
      message: data.message,
    });

    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.clientEmail,
      subject: `Your Travel Proposal: ${data.proposalTitle}`,
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface ProposalAcceptanceData {
  agencyName: string;
  clientName: string;
  clientEmail?: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  totalPrice?: string;
  recipientEmail: string;
}

/**
 * Sends an email to the tour operator when a client accepts a proposal.
 */
export async function sendProposalAcceptanceEmail(
  data: ProposalAcceptanceData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const acceptedAt = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const html = renderProposalAcceptanceEmail({
      agencyName: data.agencyName,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      proposalTitle: data.proposalTitle,
      proposalUrl: data.proposalUrl,
      startDate: data.startDate,
      duration: data.duration,
      totalPrice: data.totalPrice,
      acceptedAt,
    });

    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.recipientEmail,
      subject: `Proposal Accepted: ${data.proposalTitle} - ${data.clientName}`,
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface TeamInvitationData {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  role: 'admin' | 'member';
  inviteUrl: string;
  expiresAt: string;
}

/**
 * Sends an email invitation to join a team/organization.
 */
export async function sendTeamInvitationEmail(
  data: TeamInvitationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = renderTeamInvitationEmail({
      recipientEmail: data.recipientEmail,
      inviterName: data.inviterName,
      organizationName: data.organizationName,
      role: data.role,
      inviteUrl: data.inviteUrl,
      expiresAt: data.expiresAt,
    });

    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.recipientEmail,
      subject: `You're invited to join ${data.organizationName}`,
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface EmailVerificationData {
  recipientEmail: string;
  userName: string;
  verificationUrl: string;
}

/**
 * Sends an email verification email to a new user.
 */
export async function sendEmailVerificationEmail(
  data: EmailVerificationData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const html = renderEmailVerificationEmail({
      userName: data.userName,
      verificationUrl: data.verificationUrl,
    });

    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.recipientEmail,
      subject: 'Verify your email address - Kitasuro',
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export interface NoteMentionData {
  recipientEmail: string;
  recipientName: string;
  mentionerName: string;
  noteContent: string;
  proposalTitle: string;
  proposalId: string;
}

/**
 * Sends an email notification when a user is @mentioned in a proposal note.
 */
export async function sendNoteMentionEmail(
  data: NoteMentionData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const mentionedAt = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });

    const proposalUrl = `${env.NEXT_PUBLIC_APP_URL}/itineraries/${data.proposalId}`;

    const html = renderNoteMentionEmail({
      recipientName: data.recipientName,
      mentionerName: data.mentionerName,
      noteContent: data.noteContent,
      proposalTitle: data.proposalTitle,
      proposalUrl,
      mentionedAt,
    });

    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    const result = await resend.emails.send({
      from: fromEmail,
      to: data.recipientEmail,
      subject: `${data.mentionerName} mentioned you in a note`,
      html,
    });

    if (result.error) {
      // Error details returned to caller for centralized logging
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    // Error details returned to caller for centralized logging
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
