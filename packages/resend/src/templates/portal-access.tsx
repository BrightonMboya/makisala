interface PortalAccessProps {
  orgName: string;
  tripName: string;
  code: string;
  magicLink: string;
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

export function renderPortalAccessEmail(props: PortalAccessProps): string {
  const { orgName, tripName, code, magicLink } = props;
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access your trip details</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
    <h1 style="color: #15803d; font-size: 24px; margin-top: 0; margin-bottom: 8px; font-family: Georgia, serif;">
      ${escapeHtml(orgName)}
    </h1>
    <p style="font-size: 15px; margin-bottom: 24px; color: #78716c;">
      Access your traveler details for <strong>${escapeHtml(tripName)}</strong>.
    </p>

    <div style="margin: 24px 0; text-align: center;">
      <a href="${escapeHtml(magicLink)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Open my trip portal
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-bottom: 8px; text-align: center;">
      Or enter this code on the portal:
    </p>
    <p style="font-size: 30px; letter-spacing: 6px; font-weight: 700; color: #1c1917; text-align: center; margin: 0 0 24px;">
      ${escapeHtml(code)}
    </p>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
    <p style="font-size: 12px; color: #a8a29e; margin: 0; text-align: center;">
      This link and code expire in 15 minutes. If you didn't request this, you can ignore this email.
    </p>
  </div>
</body>
</html>`;
}
