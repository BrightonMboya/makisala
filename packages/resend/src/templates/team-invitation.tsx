interface TeamInvitationEmailProps {
  recipientEmail: string;
  inviterName: string;
  organizationName: string;
  role: 'admin' | 'member';
  inviteUrl: string;
  expiresAt: string;
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

export function renderTeamInvitationEmail(props: TeamInvitationEmailProps): string {
  const { inviterName, organizationName, role, inviteUrl, expiresAt } = props;

  const roleDescription =
    role === 'admin'
      ? 'full access to manage settings, team members, and all content'
      : 'access to create and manage itineraries, clients, and proposals';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${escapeHtml(organizationName)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #15803d; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-family: Georgia, serif;">
      You're Invited!
    </h1>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${escapeHtml(inviterName)}</strong> has invited you to join <strong>${escapeHtml(organizationName)}</strong> on Makisala.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px;"><strong>Role:</strong> ${role === 'admin' ? 'Admin' : 'Team Member'}</p>
      <p style="margin: 8px 0 0 0; font-size: 13px; color: #666;">You will have ${roleDescription}.</p>
    </div>

    <p style="font-size: 16px; margin-bottom: 25px;">
      Click the button below to accept this invitation and join the team.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapeHtml(inviteUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Accept Invitation
      </a>
    </div>

    <p style="font-size: 13px; color: #888; margin-bottom: 20px; text-align: center;">
      This invitation expires on ${escapeHtml(expiresAt)}
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
      If you didn't expect this invitation, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
