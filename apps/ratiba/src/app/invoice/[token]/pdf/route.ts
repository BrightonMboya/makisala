import { NextResponse } from 'next/server';
import { db } from '@repo/db';
import { invoices, organizations } from '@repo/db/schema';
import { eq } from 'drizzle-orm';
import { getSignedDownloadUrl } from '@/lib/storage';
import { renderInvoicePdf } from '@/lib/pdf/invoice-pdf';

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

  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, invoice.organizationId),
    columns: { paymentTerms: true },
  });

  const buffer = await renderInvoicePdf(invoice, {
    paymentTerms: org?.paymentTerms ?? null,
  });

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.number}.pdf"`,
      'Cache-Control': 'private, max-age=0, no-store',
    },
  });
}
