interface ProposalAcceptanceEmailProps {
  agencyName: string;
  clientName: string;
  clientEmail?: string;
  proposalTitle: string;
  proposalUrl: string;
  startDate?: string;
  duration?: string;
  totalPrice?: string;
  acceptedAt: string;
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

export function renderProposalAcceptanceEmail(props: ProposalAcceptanceEmailProps): string {
  const {
    agencyName,
    clientName,
    clientEmail,
    proposalTitle,
    proposalUrl,
    startDate,
    duration,
    totalPrice,
    acceptedAt,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proposal Accepted!</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 25px;">
      <div style="display: inline-block; background-color: #15803d; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 style="color: #15803d; font-size: 28px; margin: 0; font-family: Georgia, serif;">
        Proposal Accepted!
      </h1>
    </div>

    <p style="font-size: 16px; margin-bottom: 20px; text-align: center; color: #666;">
      Great news! Your client has accepted the proposal.
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #166534;">Client Details</h2>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Name:</strong> ${escapeHtml(clientName)}
      </p>
      ${clientEmail ? `<p style="margin: 5px 0; font-size: 14px; color: #333;"><strong>Email:</strong> ${escapeHtml(clientEmail)}</p>` : ''}
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Accepted on:</strong> ${escapeHtml(acceptedAt)}
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
      <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1a1a1a;">${escapeHtml(proposalTitle)}</h2>
      ${startDate ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;"><strong>Start Date:</strong> ${escapeHtml(startDate)}</p>` : ''}
      ${duration ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;"><strong>Duration:</strong> ${escapeHtml(duration)}</p>` : ''}
      ${totalPrice ? `<p style="margin: 5px 0; font-size: 14px; color: #666666;"><strong>Total Price:</strong> ${escapeHtml(totalPrice)}</p>` : ''}
    </div>

    <p style="font-size: 16px; margin-bottom: 25px;">
      The client has confirmed they want to proceed with this trip. You can now begin the booking process and reach out to finalize the details.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Proposal
      </a>
    </div>

    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: 15px; margin-bottom: 25px;">
      <p style="margin: 0; font-size: 14px; color: #854d0e;">
        <strong>Next Steps:</strong> Contact the client to collect payment and finalize booking details.
      </p>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="font-size: 14px; color: #666; margin: 0;">
      This notification was sent to you as the tour operator for ${escapeHtml(agencyName)}.
    </p>

    <p style="margin-top: 30px; font-size: 11px; color: #999999; text-align: center;">
      Powered by Kitasuro
    </p>
  </div>
</body>
</html>
  `.trim();
}
