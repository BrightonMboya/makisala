import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { invoices } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { getSignedDownloadUrl } from '@/lib/storage';
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf';
import { resolveInvoicePaymentMethods } from '@/lib/invoices/payment-methods';

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { token } = await params;

  const invoice = await db.query.invoices.findFirst({
    where: eq(invoices.shareToken, token),
  });

  if (!invoice) {
    return new NextResponse('Invoice not found', { status: 404 });
  }

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
