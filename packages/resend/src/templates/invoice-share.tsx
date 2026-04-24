interface InvoiceShareEmailProps {
  clientName: string;
  agencyName: string;
  invoiceNumber: string;
  invoiceTitle?: string;
  amountDisplay: string;
  dueDate?: string;
  invoiceUrl: string;
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

export function renderInvoiceShareEmail(props: InvoiceShareEmailProps): string {
  const {
    clientName,
    agencyName,
    invoiceNumber,
    invoiceTitle,
    amountDisplay,
    dueDate,
    invoiceUrl,
    message,
  } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${escapeHtml(invoiceNumber)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1c1917; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f4;">
  <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.06);">
    <h1 style="color: #15803d; font-size: 26px; margin-top: 0; margin-bottom: 8px; font-family: Georgia, serif;">
      ${escapeHtml(agencyName)}
    </h1>

    <p style="font-size: 15px; margin-bottom: 24px; color: #78716c;">
      Your invoice is ready to view
    </p>

    <p style="font-size: 15px; margin-bottom: 18px;">
      Hi <strong>${escapeHtml(clientName)}</strong>,
    </p>

    <p style="font-size: 15px; margin-bottom: 24px;">
      Please find your invoice details below. A PDF copy is attached and can also be downloaded from the link.
    </p>

    <div style="background-color: #f8f9fa; border-left: 4px solid #15803d; padding: 18px 20px; margin-bottom: 24px; border-radius: 4px;">
      <p style="margin: 0 0 6px 0; font-size: 13px; color: #78716c;">Invoice ${escapeHtml(invoiceNumber)}</p>
      ${invoiceTitle ? `<p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold; color: #1c1917;">${escapeHtml(invoiceTitle)}</p>` : ''}
      <p style="margin: 8px 0 0 0; font-size: 22px; font-weight: bold; color: #15803d;">${escapeHtml(amountDisplay)}</p>
      ${dueDate ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #57534e;"><strong>Due:</strong> ${escapeHtml(dueDate)}</p>` : ''}
    </div>

    ${message ? `
    <div style="background-color: #fff; border: 1px solid #e7e5e4; border-radius: 6px; padding: 14px 16px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #57534e; font-style: italic;">${escapeHtml(message)}</p>
    </div>
    ` : ''}

    <div style="margin: 28px 0; text-align: center;">
      <a href="${escapeHtml(invoiceUrl)}" style="display: inline-block; background-color: #15803d; color: #ffffff; padding: 13px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">
        View invoice
      </a>
    </div>

    <p style="font-size: 13px; color: #78716c; margin-bottom: 18px;">
      If you have any questions about this invoice, reply to this email and we will get back to you.
    </p>

    <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 22px 0;" />

    <p style="font-size: 13px; color: #57534e; margin: 0;">
      Thank you,<br />
      <strong>${escapeHtml(agencyName)}</strong>
    </p>

    <p style="margin-top: 28px; font-size: 11px; color: #a8a29e; text-align: center;">
      This invoice was sent by ${escapeHtml(agencyName)}.
    </p>
  </div>
</body>
</html>
  `.trim();
}
