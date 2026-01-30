interface NoteMentionEmailProps {
  recipientName: string;
  mentionerName: string;
  noteContent: string;
  proposalTitle: string;
  proposalUrl: string;
  mentionedAt: string;
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

export function renderNoteMentionEmail(props: NoteMentionEmailProps): string {
  const { recipientName, mentionerName, noteContent, proposalTitle, proposalUrl, mentionedAt } =
    props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You were mentioned in a note</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #15803d; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-family: Georgia, serif;">
      You were mentioned
    </h1>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi ${escapeHtml(recipientName)},
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${escapeHtml(mentionerName)}</strong> mentioned you in a note on the proposal <strong>${escapeHtml(proposalTitle)}</strong>.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; white-space: pre-wrap;">${escapeHtml(noteContent)}</p>
    </div>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapeHtml(proposalUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        View Proposal
      </a>
    </div>

    <p style="font-size: 13px; color: #888; margin-bottom: 20px; text-align: center;">
      ${escapeHtml(mentionedAt)}
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
      This is a notification from your team workspace.
    </p>
  </div>
</body>
</html>
  `.trim();
}
