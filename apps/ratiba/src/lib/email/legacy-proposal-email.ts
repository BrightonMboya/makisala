/**
 * Static fallback template for the share email.
 *
 * Used only when no composed body HTML is available (the operator normally
 * composes the email in the `@react-email/editor` composer on /share, and the
 * page sends its rendered HTML). Kept as a safety net so a send never goes out
 * empty.
 */
export interface LegacyEmailProps {
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  message?: string;
  isTest?: boolean;
}

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  return text.replace(/[&<>"']/g, (m) => ESCAPE_MAP[m] ?? m);
}

export function renderLegacyProposalEmail(props: LegacyEmailProps): string {
  const { clientName, agencyName, proposalTitle, proposalUrl, startDate, duration, message, isTest } =
    props;

  const formattedMessage = message
    ? escapeHtml(message)
        .replace(/\n\n/g, '</p><p style="margin-bottom: 16px;">')
        .replace(/\n/g, '<br />')
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Travel Proposal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  ${
    isTest
      ? `
  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; text-align: center;">
    <strong style="color: #92400e;">TEST EMAIL</strong>
    <span style="color: #78716c;"> - This is a preview of how your email will look</span>
  </div>
  `
      : ''
  }

  <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear <strong>${escapeHtml(clientName)}</strong>,
    </p>

    ${
      formattedMessage
        ? `
    <div style="margin-bottom: 25px;">
      <p style="margin-bottom: 16px;">${formattedMessage}</p>
    </div>
    `
        : `
    <p style="font-size: 16px; margin-bottom: 20px;">
      Thank you for choosing ${escapeHtml(agencyName)} to plan your unforgettable journey! We've carefully crafted this personalized travel proposal based on your preferences and dreams.
    </p>
    <p style="font-size: 16px; margin-bottom: 25px;">
      Inside, you'll find a detailed day-by-day itinerary, handpicked accommodations, exciting activities, and transparent pricing. We've poured our expertise and passion into creating an experience you'll cherish forever.
    </p>
    `
    }

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 24px; margin-bottom: 30px; border-radius: 0 8px 8px 0;">
      <h2 style="margin: 0 0 12px 0; font-size: 22px; color: #1a1a1a; font-family: Georgia, serif;">
        ${escapeHtml(proposalTitle)}
      </h2>
      ${
        startDate
          ? `
      <p style="margin: 6px 0; font-size: 14px; color: #525252;">
        <strong style="color: #737373;">Start Date:</strong> ${escapeHtml(startDate)}
      </p>
      `
          : ''
      }
      ${
        duration
          ? `
      <p style="margin: 6px 0; font-size: 14px; color: #525252;">
        <strong style="color: #737373;">Duration:</strong> ${escapeHtml(duration)}
      </p>
      `
          : ''
      }
    </div>

    <div style="margin: 35px 0; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(21, 128, 61, 0.3);">
        View Your Proposal
      </a>
    </div>

    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 25px;">
      <p style="font-size: 14px; color: #166534; margin: 0;">
        <strong>Have questions?</strong> Simply leave a comment directly on your proposal. We're here to make your trip absolutely perfect!
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;" />

    <p style="font-size: 14px; color: #666; margin: 0;">
      We can't wait to help you embark on this adventure!
    </p>
    <p style="font-size: 14px; color: #666; margin-top: 15px;">
      Warm regards,<br />
      <strong style="color: #333;">${escapeHtml(agencyName)}</strong>
    </p>

    <p style="margin-top: 35px; font-size: 11px; color: #999999; text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0;">
      This email was sent by ${escapeHtml(agencyName)}. If you did not request this proposal, please ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
