interface ReviewRequestEmailProps {
  clientName: string;
  agencyName: string;
  proposalTitle: string;
  reviewUrl?: string;
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

export function renderReviewRequestEmail(props: ReviewRequestEmailProps): string {
  const { clientName, agencyName, proposalTitle, reviewUrl } = props;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #15803d; padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Thank You!</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; color: #1c1917; font-size: 16px; line-height: 1.6;">
                Dear ${escapeHtml(clientName)},
              </p>
              <p style="margin: 0 0 16px; color: #44403c; font-size: 15px; line-height: 1.6;">
                We hope you had an incredible experience on your <strong>${escapeHtml(proposalTitle)}</strong> trip! Your adventure means the world to us, and we'd love to hear about it.
              </p>
              <p style="margin: 0 0 24px; color: #44403c; font-size: 15px; line-height: 1.6;">
                Would you take a moment to share your experience? Your feedback helps other travelers discover their perfect safari and means so much to our team.
              </p>
              ${
                reviewUrl
                  ? `<table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${escapeHtml(reviewUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px; font-weight: 600;">
                      Leave a Review
                    </a>
                  </td>
                </tr>
              </table>`
                  : ''
              }
              <p style="margin: 0 0 8px; color: #44403c; font-size: 15px; line-height: 1.6;">
                Thank you for choosing ${escapeHtml(agencyName)}. We look forward to your next adventure!
              </p>
              <p style="margin: 24px 0 0; color: #1c1917; font-size: 15px; font-weight: 600;">
                Warm regards,<br />
                The ${escapeHtml(agencyName)} Team
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #fafaf9; border-top: 1px solid #e7e5e4; text-align: center;">
              <p style="margin: 0; color: #a8a29e; font-size: 12px;">
                Sent by ${escapeHtml(agencyName)} via Makisala
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
