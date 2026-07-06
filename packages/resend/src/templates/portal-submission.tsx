interface PortalSubmissionProps {
  orgName: string;
  tripName: string;
  leadEmail?: string;
  travelerCount: number;
  portalUrl: string;
  submittedAt: string;
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

export function renderPortalSubmissionEmail(props: PortalSubmissionProps): string {
  const { orgName, tripName, leadEmail, travelerCount, portalUrl, submittedAt } = props;
  const travelerLabel = travelerCount === 1 ? '1 traveler' : `${travelerCount} travelers`;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traveler details submitted</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
    <h1 style="color: #15803d; font-size: 22px; margin-top: 0; margin-bottom: 8px; font-family: Georgia, serif;">
      Traveler details submitted
    </h1>
    <p style="font-size: 15px; margin-bottom: 24px; color: #78716c;">
      Your client has completed the trip portal for <strong>${escapeHtml(tripName)}</strong>.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #78716c;">Trip</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right; font-weight: 600;">${escapeHtml(tripName)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #78716c; border-top: 1px solid #f5f5f4;">Travelers</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right; font-weight: 600; border-top: 1px solid #f5f5f4;">${escapeHtml(travelerLabel)}</td>
      </tr>
      ${
        leadEmail
          ? `<tr>
        <td style="padding: 8px 0; font-size: 14px; color: #78716c; border-top: 1px solid #f5f5f4;">Lead traveler</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right; font-weight: 600; border-top: 1px solid #f5f5f4;">${escapeHtml(leadEmail)}</td>
      </tr>`
          : ''
      }
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #78716c; border-top: 1px solid #f5f5f4;">Submitted</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1c1917; text-align: right; font-weight: 600; border-top: 1px solid #f5f5f4;">${escapeHtml(submittedAt)}</td>
      </tr>
    </table>

    <div style="margin: 24px 0; text-align: center;">
      <a href="${escapeHtml(portalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Review traveler details
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
    <p style="font-size: 12px; color: #a8a29e; margin: 0; text-align: center;">
      Sent by ${escapeHtml(orgName)} via Ratiba. Passport and personal details are stored encrypted and shown only inside your dashboard.
    </p>
  </div>
</body>
</html>`;
}
