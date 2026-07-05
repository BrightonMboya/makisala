import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Invoice, InvoiceLineItem, InvoicePartyDetails } from '@repo/db/schema';

const MUTED = '#878787';
const TEXT = '#0a0a0a';
const BORDER = '#e5e5e5';

const styles = StyleSheet.create({
  page: {
    paddingVertical: 48,
    paddingHorizontal: 44,
    fontFamily: 'Courier',
    fontSize: 9,
    color: TEXT,
    backgroundColor: '#ffffff',
  },
  // header: meta on the left, logo on the right
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  metaCol: {
    flexDirection: 'column',
    gap: 5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    width: 60,
  },
  metaSep: {
    fontSize: 8,
    color: MUTED,
    marginRight: 6,
  },
  metaValue: {
    fontSize: 9,
    color: TEXT,
  },
  logo: {
    width: 56,
    height: 56,
    objectFit: 'contain',
  },
  brandWordmark: {
    fontSize: 13,
    color: TEXT,
    textAlign: 'right',
  },
  // parties
  partyGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 32,
  },
  partyCol: {
    flex: 1,
  },
  label: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  partyLine: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.5,
  },
  // line items
  itemsHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 6,
  },
  cellDesc: { flex: 4, paddingRight: 8 },
  cellQty: { flex: 1, textAlign: 'right' },
  cellPrice: { flex: 2, textAlign: 'right' },
  cellTotal: { flex: 1.6, textAlign: 'right' },
  headCell: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  itemName: {
    fontSize: 9,
    color: TEXT,
  },
  itemDesc: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  cellText: {
    fontSize: 9,
    color: TEXT,
  },
  // summary
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    marginBottom: 32,
  },
  summary: {
    width: 220,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  summaryValueMuted: {
    fontSize: 9,
    color: MUTED,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  totalValue: {
    fontSize: 17,
    color: TEXT,
  },
  // footer blocks (payment details / note)
  footerGrid: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 'auto',
  },
  footerCol: {
    flex: 1,
  },
  footerBody: {
    fontSize: 9,
    color: TEXT,
    lineHeight: 1.6,
  },
});

function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return format(new Date(value), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaSep}>:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

interface PartyProps {
  heading: string;
  details: InvoicePartyDetails | null | undefined;
  fallbackName?: string;
}

function Party({ heading, details, fallbackName }: PartyProps) {
  const name = details?.name || fallbackName || '';
  return (
    <View style={styles.partyCol}>
      <Text style={styles.label}>{heading}</Text>
      {name ? <Text style={styles.partyLine}>{name}</Text> : null}
      {details?.email ? <Text style={styles.partyLine}>{details.email}</Text> : null}
      {details?.phone ? <Text style={styles.partyLine}>{details.phone}</Text> : null}
      {details?.address ? <Text style={styles.partyLine}>{details.address}</Text> : null}
    </View>
  );
}

interface InvoicePdfProps {
  invoice: Invoice;
  paymentTerms?: string | null;
  /** Pre-resolved PNG/JPG logo as a data URI. @react-pdf can't render webp, so
   *  renderInvoicePdf converts the org logo up front. Falls back to a text wordmark. */
  logoSrc?: string | null;
}

export function InvoicePdfDocument({ invoice, paymentTerms, logoSrc }: InvoicePdfProps) {
  const lineItems: InvoiceLineItem[] = invoice.lineItems || [];
  const from = invoice.fromDetails as InvoicePartyDetails | null;
  const to = invoice.toDetails as InvoicePartyDetails | null;
  const brandName = from?.name ?? 'Invoice';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.metaCol}>
            <MetaRow label="Invoice no" value={invoice.number} />
            {invoice.title ? <MetaRow label="Description" value={invoice.title} /> : null}
            <MetaRow label="Issue date" value={formatDate(invoice.issueDate)} />
            {invoice.dueDate ? (
              <MetaRow label="Due date" value={formatDate(invoice.dueDate)} />
            ) : null}
          </View>
          {logoSrc ? (
            <Image src={logoSrc} style={styles.logo} />
          ) : (
            <Text style={styles.brandWordmark}>{brandName}</Text>
          )}
        </View>

        <View style={styles.partyGrid}>
          <Party heading="From" details={from} fallbackName={brandName} />
          <Party heading="Bill to" details={to} />
        </View>

        <View style={styles.itemsHeader}>
          <Text style={[styles.headCell, styles.cellDesc]}>Description</Text>
          <Text style={[styles.headCell, styles.cellQty]}>Qty</Text>
          <Text style={[styles.headCell, styles.cellPrice]}>Unit price</Text>
          <Text style={[styles.headCell, styles.cellTotal]}>Total</Text>
        </View>
        {lineItems.map((item, index) => {
          const lineTotal = item.quantity * item.unitPriceCents;
          return (
            <View key={`${item.id}-${index}`} style={styles.row}>
              <View style={styles.cellDesc}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.description ? (
                  <Text style={styles.itemDesc}>{item.description}</Text>
                ) : null}
              </View>
              <Text style={[styles.cellText, styles.cellQty]}>{item.quantity}</Text>
              <Text style={[styles.cellText, styles.cellPrice]}>
                {formatMoney(item.unitPriceCents, invoice.currency)}
              </Text>
              <Text style={[styles.cellText, styles.cellTotal]}>
                {formatMoney(lineTotal, invoice.currency)}
              </Text>
            </View>
          );
        })}

        <View style={styles.summaryWrap}>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.label}>Subtotal</Text>
              <Text style={styles.summaryValueMuted}>
                {formatMoney(invoice.subtotalCents, invoice.currency)}
              </Text>
            </View>
            {invoice.taxRatePct ? (
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Tax ({invoice.taxRatePct}%)</Text>
                <Text style={styles.summaryValueMuted}>
                  {formatMoney(invoice.taxCents, invoice.currency)}
                </Text>
              </View>
            ) : null}
            <View style={styles.totalRow}>
              <Text style={styles.label}>Total</Text>
              <Text style={styles.totalValue}>
                {formatMoney(invoice.totalCents, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footerGrid}>
          <View style={styles.footerCol}>
            {paymentTerms ? (
              <>
                <Text style={styles.label}>Payment details</Text>
                <Text style={styles.footerBody}>{paymentTerms}</Text>
              </>
            ) : null}
          </View>
          <View style={styles.footerCol}>
            {invoice.notes ? (
              <>
                <Text style={styles.label}>Note</Text>
                <Text style={styles.footerBody}>{invoice.notes}</Text>
              </>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

/**
 * @react-pdf/renderer only supports PNG/JPG raster images, not webp (the format
 * org logos are stored in). Fetch the logo and convert it to a PNG data URI so it
 * renders in the PDF. Returns null on any failure so the document falls back to a
 * text wordmark.
 */
async function resolveLogoPng(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const input = Buffer.from(await res.arrayBuffer());
    const { default: sharp } = await import('sharp');
    const png = await sharp(input)
      .resize(224, 224, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function renderInvoicePdf(
  invoice: Invoice,
  options: { paymentTerms?: string | null } = {},
): Promise<Buffer> {
  const from = invoice.fromDetails as InvoicePartyDetails | null;
  const logoSrc = await resolveLogoPng(from?.logoUrl);
  return renderToBuffer(
    <InvoicePdfDocument
      invoice={invoice}
      paymentTerms={options.paymentTerms}
      logoSrc={logoSrc}
    />,
  );
}
