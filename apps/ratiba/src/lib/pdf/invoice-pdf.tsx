import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { renderToBuffer } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Invoice, InvoiceLineItem, InvoicePartyDetails } from '@repo/db/schema';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1c1917',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#15803d',
  },
  brand: {
    flexDirection: 'column',
  },
  brandLogo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
    marginBottom: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#15803d',
  },
  brandLine: {
    fontSize: 9,
    color: '#57534e',
    marginTop: 2,
  },
  invoiceMeta: {
    textAlign: 'right',
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 4,
  },
  invoiceLabel: {
    fontSize: 9,
    color: '#78716c',
    marginTop: 6,
  },
  invoiceValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  partyGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
  },
  partyCol: {
    flex: 1,
  },
  partyHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78716c',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 10,
    color: '#57534e',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 10,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e7e5e4',
  },
  table: {
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#15803d',
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78716c',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f4',
  },
  cellDesc: {
    flex: 4,
    paddingRight: 8,
  },
  cellQty: {
    flex: 1,
    textAlign: 'right',
  },
  cellPrice: {
    flex: 1.2,
    textAlign: 'right',
  },
  cellTotal: {
    flex: 1.3,
    textAlign: 'right',
  },
  lineItemName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  lineItemDesc: {
    fontSize: 9,
    color: '#78716c',
    marginTop: 2,
  },
  totalsBox: {
    marginLeft: 'auto',
    width: '45%',
    marginTop: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalsLabel: {
    fontSize: 10,
    color: '#57534e',
  },
  totalsValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#15803d',
  },
  grandLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d',
  },
  grandValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#15803d',
  },
  notesBlock: {
    marginTop: 30,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e7e5e4',
  },
  notesHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#78716c',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  notesBody: {
    fontSize: 10,
    color: '#57534e',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#a8a29e',
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

interface PartyProps {
  heading: string;
  details: InvoicePartyDetails | null | undefined;
  fallbackName?: string;
}

function Party({ heading, details, fallbackName }: PartyProps) {
  const name = details?.name || fallbackName || '';
  return (
    <View style={styles.partyCol}>
      <Text style={styles.partyHeading}>{heading}</Text>
      {name ? <Text style={styles.partyName}>{name}</Text> : null}
      {details?.email ? <Text style={styles.partyLine}>{details.email}</Text> : null}
      {details?.phone ? <Text style={styles.partyLine}>{details.phone}</Text> : null}
      {details?.address ? <Text style={styles.partyLine}>{details.address}</Text> : null}
    </View>
  );
}

interface InvoicePdfProps {
  invoice: Invoice;
  paymentTerms?: string | null;
}

export function InvoicePdfDocument({ invoice, paymentTerms }: InvoicePdfProps) {
  const lineItems: InvoiceLineItem[] = invoice.lineItems || [];
  const from = invoice.fromDetails as InvoicePartyDetails | null;
  const to = invoice.toDetails as InvoicePartyDetails | null;
  const logoUrl = from?.logoUrl ?? null;
  const brandName = from?.name ?? 'Invoice';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {logoUrl ? <Image src={logoUrl} style={styles.brandLogo} /> : null}
            <Text style={styles.brandName}>{brandName}</Text>
            {from?.email ? <Text style={styles.brandLine}>{from.email}</Text> : null}
            {from?.phone ? <Text style={styles.brandLine}>{from.phone}</Text> : null}
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceLabel}>Invoice number</Text>
            <Text style={styles.invoiceValue}>{invoice.number}</Text>
            {invoice.title ? (
              <>
                <Text style={styles.invoiceLabel}>Description</Text>
                <Text style={styles.invoiceValue}>{invoice.title}</Text>
              </>
            ) : null}
            <Text style={styles.invoiceLabel}>Issue date</Text>
            <Text style={styles.invoiceValue}>{formatDate(invoice.issueDate)}</Text>
            {invoice.dueDate ? (
              <>
                <Text style={styles.invoiceLabel}>Due date</Text>
                <Text style={styles.invoiceValue}>{formatDate(invoice.dueDate)}</Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.partyGrid}>
          <Party heading="From" details={from} fallbackName={brandName} />
          <Party heading="Bill to" details={to} />
        </View>

        <Text style={styles.sectionTitle}>Line items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.cellDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.cellQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.cellPrice]}>Unit price</Text>
            <Text style={[styles.tableHeaderCell, styles.cellTotal]}>Total</Text>
          </View>
          {lineItems.map((item) => {
            const lineTotal = item.quantity * item.unitPriceCents;
            return (
              <View key={item.id} style={styles.tableRow}>
                <View style={styles.cellDesc}>
                  <Text style={styles.lineItemName}>{item.name}</Text>
                  {item.description ? (
                    <Text style={styles.lineItemDesc}>{item.description}</Text>
                  ) : null}
                </View>
                <Text style={[styles.cellQty, styles.lineItemName]}>{item.quantity}</Text>
                <Text style={styles.cellPrice}>
                  {formatMoney(item.unitPriceCents, invoice.currency)}
                </Text>
                <Text style={[styles.cellTotal, styles.lineItemName]}>
                  {formatMoney(lineTotal, invoice.currency)}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>
              {formatMoney(invoice.subtotalCents, invoice.currency)}
            </Text>
          </View>
          {invoice.taxRatePct ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax ({invoice.taxRatePct}%)</Text>
              <Text style={styles.totalsValue}>
                {formatMoney(invoice.taxCents, invoice.currency)}
              </Text>
            </View>
          ) : null}
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>Total due</Text>
            <Text style={styles.grandValue}>
              {formatMoney(invoice.totalCents, invoice.currency)}
            </Text>
          </View>
        </View>

        {invoice.notes ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesHeading}>Notes</Text>
            <Text style={styles.notesBody}>{invoice.notes}</Text>
          </View>
        ) : null}

        {paymentTerms ? (
          <View style={styles.notesBlock}>
            <Text style={styles.notesHeading}>Payment details</Text>
            <Text style={styles.notesBody}>{paymentTerms}</Text>
          </View>
        ) : null}

        <Text style={styles.footer} fixed>
          {invoice.number} · {brandName}
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(
  invoice: Invoice,
  options: { paymentTerms?: string | null } = {},
): Promise<Buffer> {
  return renderToBuffer(<InvoicePdfDocument invoice={invoice} paymentTerms={options.paymentTerms} />);
}
