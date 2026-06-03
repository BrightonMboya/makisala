interface PaymentChangeRequestProps {
  organizationName: string;
  organizationId: string;
  requesterName: string;
  requesterEmail: string;
  reason?: string;
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

export function renderPaymentChangeRequestEmail(props: PaymentChangeRequestProps): string {
  const { organizationName, organizationId, requesterName, requesterEmail, reason } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Details Change Request</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #261B07; font-size: 24px; margin: 0 0 20px 0;">
      Payment Details Change Request
    </h1>

    <p style="font-size: 16px; margin-bottom: 20px; color: #666;">
      An organization with locked payment details has requested permission to change them.
      Verify the request with the requester before unlocking.
    </p>

    <div style="background-color: #f8f7f5; border: 1px solid #e3dfD5; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Organization:</strong> ${escapeHtml(organizationName)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Organization ID:</strong> ${escapeHtml(organizationId)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Requested by:</strong> ${escapeHtml(requesterName)}
      </p>
      <p style="margin: 5px 0; font-size: 14px; color: #333;">
        <strong>Email:</strong> ${escapeHtml(requesterEmail)}
      </p>
      ${
        reason
          ? `<p style="margin: 15px 0 5px 0; font-size: 14px; color: #333;"><strong>Reason:</strong></p>
      <p style="margin: 5px 0; font-size: 14px; color: #555; white-space: pre-line;">${escapeHtml(reason)}</p>`
          : ''
      }
    </div>

    <p style="font-size: 13px; color: #666;">
      To unlock, clear <code>payment_details_locked_at</code> for this organization once the
      request is verified.
    </p>

    <div style="margin: 25px 0; text-align: center;">
      <a href="mailto:${escapeHtml(requesterEmail)}" style="display: inline-block; background-color: #261B07; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Reply to ${escapeHtml(requesterName)}
      </a>
    </div>

    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 25px 0;" />

    <p style="margin-top: 30px; font-size: 11px; color: #999999; text-align: center;">
      Ratiba — Payment Details Security
    </p>
  </div>
</body>
</html>
  `.trim();
}
