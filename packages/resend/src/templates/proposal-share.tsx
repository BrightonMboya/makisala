interface ProposalShareEmailProps {
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  message?: string;
}

function escapeHtml(text: string | undefined): string {
  if (!text) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

export function renderProposalShareEmail(props: ProposalShareEmailProps): string {
  const {
    clientName,
    agencyName,
    proposalTitle,
    proposalUrl,
    startDate,
    duration,
    message,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Travel Proposal</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #15803d; font-size: 28px; margin-top: 0; margin-bottom: 10px; font-family: Georgia, serif;">
      ${escapeHtml(agencyName)}
    </h1>

    <p style="font-size: 16px; margin-bottom: 25px; color: #666;">
      Your personalized travel proposal is ready
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Dear <strong>${escapeHtml(clientName)}</strong>,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      We're excited to share your customized travel proposal with you!
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1a1a1a;">${escapeHtml(proposalTitle)}</h2>
      ${startDate ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;"><strong>Start Date:</strong> ${escapeHtml(startDate)}</p>` : ''}
      ${duration ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;"><strong>Duration:</strong> ${escapeHtml(duration)}</p>` : ''}
    </div>

    ${message ? `
    <div style="background-color: #fff; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 14px; color: #666; font-style: italic;">"${escapeHtml(message)}"</p>
    </div>
    ` : ''}

    <p style="font-size: 16px; margin-bottom: 25px;">
      Click the button below to view your complete itinerary, accommodations, and pricing details. You can also leave comments directly on the proposal if you have any questions or would like to request changes.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Your Proposal
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      If you have any questions, simply reply to this email or leave a comment on the proposal.
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="font-size: 14px; color: #666; margin: 0;">
      Best regards,<br />
      <strong>${escapeHtml(agencyName)}</strong>
    </p>

    <p style="margin-top: 30px; font-size: 11px; color: #999999; text-align: center;">
      This email was sent by ${escapeHtml(agencyName)}. If you did not request this proposal, please ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
