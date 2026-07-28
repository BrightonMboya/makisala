import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@repo/db';
import { invoices, linkViews } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { getSignedDownloadUrl } from '@/lib/storage';
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf';
import { resolveInvoicePaymentMethods } from '@/lib/invoices/payment-methods';
import { isLikelyBot, parseUserAgent } from '@/lib/tracking/user-agent';
import { decodeCityHeader } from '@/lib/tracking/geo';
import { isOwnOrgViewer } from '@/lib/tracking/internal-viewer';
import { log, serializeError } from '@/lib/logger';

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.shareToken, token),
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', { status: 404 });
  }

  await recordPdfView(req, invoice);

  if (invoice.sentAt && invoice.pdfKey) {
    const url = await getSignedDownloadUrl(invoice.pdfKey, {
      expiresInSeconds: 300,
      downloadAs: `${invoice.number}.pdf`,
    });
    return NextResponse.redirect(url, 302);
  }

  // Draft/unsent: render live so the operator's current payout methods show even
  // if this invoice predates snapshotting. Sent invoices are served frozen above.
  const paymentMethods = await resolveInvoicePaymentMethods(db, invoice);
  const buffer = await renderInvoicePdf({ ...invoice, paymentMethods });

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`,
      'Cache-Control': 'private, max-age=0, no-store',
    },
  });
}

// Tracking is best-effort and must never take down the actual PDF download -
// failures are logged and swallowed rather than propagated.
async function recordPdfView(req: Request, invoice: { id: string; organizationId: string }) {
  try {
    const userAgent = req.headers.get('user-agent');
    if (isLikelyBot(userAgent)) return;
    if (await isOwnOrgViewer(invoice.organizationId)) return;

    const fwd = req.headers.get('x-forwarded-for');
    const ip = fwd?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || null;
    const { device, browser } = parseUserAgent(userAgent);

    await db.insert(linkViews).values({
      organizationId: invoice.organizationId,
      invoiceId: invoice.id,
      format: 'pdf',
      // No visitor-cookie session for a direct PDF fetch (no page/JS context);
      // each request gets its own row instead of being grouped.
      sessionId: `pdf:${randomUUID()}`,
      ip,
      country: req.headers.get('x-vercel-ip-country'),
      region: req.headers.get('x-vercel-ip-country-region'),
      city: decodeCityHeader(req.headers.get('x-vercel-ip-city')),
      device,
      browser,
    });
  } catch (error) {
    log.error('Failed to record PDF link view', {
      invoiceId: invoice.id,
      error: serializeError(error),
    });
  }
}
