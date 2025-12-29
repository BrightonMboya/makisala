import { resend } from '../client';
import { env } from '../env';
import { renderCommentNotificationEmail } from '../templates/comment-notification';

export interface CommentNotificationData {
  proposalId: string;
  clientName: string;
  proposalTitle: string;
  commentContent: string;
  commentAuthor: string;
  proposalUrl?: string;
  commentDate?: string;
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
      data.proposalUrl ||
      `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/proposal/${data.proposalId}`;

    // Render the email HTML
    const html = renderCommentNotificationEmail({
      ...data,
      commentDate,
      proposalUrl,
    });

    // Determine the from email address
    const fromEmail = env.RESEND_FROM_EMAIL || 'notifications@makisala.com';

    // Send the email
    const result = await resend.emails.send({
      from: fromEmail,
      to: env.NOTIFICATION_EMAIL,
      subject: `New comment on proposal from ${data.clientName}`,
      html,
    });

    if (result.error) {
      console.error('Resend API error:', result.error);
      return {
        success: false,
        error: result.error.message || 'Failed to send email',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending comment notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
