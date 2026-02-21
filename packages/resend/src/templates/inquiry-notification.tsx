interface InquiryNotificationEmailProps {
  fullName: string;
  email: string;
  countryOfResidence: string;
  phoneNumber: string;
  numberOfTravellers: number;
  startDate: string;
  comments: string;
  pageUrl: string;
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

export function renderInquiryNotificationEmail(props: InquiryNotificationEmailProps): string {
  const {
    fullName,
    email,
    countryOfResidence,
    phoneNumber,
    numberOfTravellers,
    startDate,
    comments,
    pageUrl,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Inquiry Received</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #15803d; font-size: 24px; margin: 0 0 20px 0;">
      New Inquiry Received
    </h1>

    <p style="font-size: 16px; margin-bottom: 20px; color: #666;">
      A new inquiry has been submitted from <strong>${escapeHtml(pageUrl)}</strong>
    </p>

    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #166534;">Contact Details</h2>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Name:</strong> ${escapeHtml(fullName)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Email:</strong> ${escapeHtml(email)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Phone:</strong> ${escapeHtml(phoneNumber)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Country:</strong> ${escapeHtml(countryOfResidence)}
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 20px; margin-bottom: 25px; border-radius: 4px;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1a1a1a;">Travel Details</h2>
      <p style="margin: 5px 0; font-size: 14px; color: #666666;">
        <strong>Travellers:</strong> ${numberOfTravellers}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #666666;">
        <strong>Start Date:</strong> ${escapeHtml(startDate)}
      </p>
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #1a1a1a;">Comments</h2>
      <p style="margin: 0; font-size: 14px; color: #666666; white-space: pre-wrap;">${escapeHtml(comments)}</p>
    </div>

    <div style="margin: 25px 0; text-align: center;">
      <a href="mailto:${escapeHtml(email)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Reply to ${escapeHtml(fullName)}
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="margin-top: 30px; font-size: 11px; color: #999999; text-align: center;">
      Makisala Safaris — Inquiry Notification
    </p>
  </div>
</body>
</html>
  `.trim();
}
