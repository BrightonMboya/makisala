interface EmailVerificationProps {
  userName: string;
  verificationUrl: string;
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

export function renderEmailVerificationEmail(props: EmailVerificationProps): string {
  const { userName, verificationUrl } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email Address</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #15803d; font-size: 24px; margin-top: 0; margin-bottom: 20px; font-family: Georgia, serif;">
      Verify Your Email
    </h1>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Hi <strong>${escapeHtml(userName)}</strong>,
    </p>

    <p style="font-size: 16px; margin-bottom: 20px;">
      Thanks for signing up for Kitasuro! Please verify your email address by clicking the button below.
    </p>

    <div style="margin: 30px 0; text-align: center;">
      <a href="${escapeHtml(verificationUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verify Email Address
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="font-size: 13px; color: #15803d; word-break: break-all; margin-bottom: 25px;">
      ${escapeHtml(verificationUrl)}
    </p>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
      If you didn't create an account with Kitasuro, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `.trim();
}
