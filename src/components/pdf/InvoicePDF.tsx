import React from 'react'
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import { format } from 'date-fns'

// Register fonts if needed (optional)
// Font.register({ family: 'Roboto', src: '...' })

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  // Header Section
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  companyInfo: {
    width: '50%',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 5,
  },
  companyAddress: {
    fontSize: 9,
    lineHeight: 1.4,
    color: '#555',
  },
  invoiceTitle: {
    textAlign: 'right',
    width: '50%',
  },
  invoiceTitleText: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: '#2563EB',
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 11,
    color: '#555',
  },
  // Bill To Section
  billToSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
  },
  billToColumn: {
    width: '45%',
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#374151',
  },
  infoText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#555',
  },
  // Table Section
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderBottom: 1,
    borderBottomColor: '#D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: 1,
    borderBottomColor: '#E5E7EB',
    fontSize: 9,
  },
  // Table Columns
  col1: { width: '10%' },
  col2: { width: '30%' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '25%', textAlign: 'right' },
  // Summary Section
  summarySection: {
    marginTop: 20,
    marginLeft: 'auto',
    width: '50%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 6,
    fontSize: 10,
  },
  summaryLabel: {
    color: '#555',
  },
  summaryValue: {
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#F3F4F6',
    marginTop: 5,
  },
  // Remittance Section
  remittanceSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
  },
  remittanceTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#374151',
  },
  remittanceText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: '#555',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingTop: 10,
    borderTop: 1,
    borderTopColor: '#E5E7EB',
  },
  // Tax Info
  taxInfo: {
    marginTop: 20,
    fontSize: 8,
    color: '#6B7280',
  },
})

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string
  dueDate?: string
  status: string
  currency: string
  subtotal: number
  taxRate?: number
  taxAmount?: number
  total: number
  dropzone: {
    name: string
    city?: string
    address?: string
    country?: string
    contactName?: string
    contactEmail?: string
  }
  lineItems: Array<{
    id: string
    jumpId?: string | null
    workJumpType?: string | null
    itemType: string
    description?: string | null
    quantity: number
    unitPrice: number
    lineTotal: number
    jump: {
      id?: string
      jumpNumber: number
      date: string
      customerName?: string
      hasHandcam?: boolean
    } | null
  }>
  user: {
    name?: string
    address?: string
    phone?: string
    taxRegistrationNumber?: string
    remittanceDetails?: string
    brandingCompanyName?: string
    brandingInvoiceFooter?: string
  }
}

interface InvoicePDFProps {
  invoice: InvoiceData
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Group line items by work jump type for summary. Ad-hoc lines are free-text
// and keyed by their own id so they never merge with each other or with jump lines.
const groupLineItemsByType = (lineItems: InvoiceData['lineItems']) => {
  const grouped = new Map<string, { label: string; count: number; total: number; unitPrice: number }>()

  lineItems.forEach(item => {
    const isAdhoc = item.itemType === 'ADHOC'
    const key = isAdhoc
      ? `adhoc-${item.id}`
      : item.itemType === 'HANDCAM_ADDON'
        ? `${item.workJumpType} - Handcam`
        : (item.workJumpType || 'Other')
    const label = isAdhoc ? (item.description || 'Additional charge') : key

    if (!grouped.has(key)) {
      grouped.set(key, { label, count: 0, total: 0, unitPrice: item.unitPrice })
    }
    const group = grouped.get(key)!
    group.count += item.quantity
    group.total += item.lineTotal
  })

  return Array.from(grouped.values()).map(({ label, ...data }) => ({
    type: label,
    ...data,
  }))
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice }) => {
  const groupedItems = groupLineItemsByType(invoice.lineItems)
  // Page 2 breaks down individual jumps — ad-hoc lines have no jump behind them
  // and are already represented in the page 1 summary table via their description.
  const jumpDetailItems = invoice.lineItems.filter(item => item.jump !== null)

  return (
    <Document>
      {/* Page 1: Invoice Summary */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>
                {invoice.user.brandingCompanyName || invoice.user.name || 'Skydiving Professional'}
              </Text>
              {invoice.user.address && (
                <Text style={styles.companyAddress}>{invoice.user.address}</Text>
              )}
              {invoice.user.phone && (
                <Text style={styles.companyAddress}>Phone: {invoice.user.phone}</Text>
              )}
              {invoice.user.taxRegistrationNumber && (
                <Text style={styles.taxInfo}>
                  Tax Registration: {invoice.user.taxRegistrationNumber}
                </Text>
              )}
            </View>

            <View style={styles.invoiceTitle}>
              <Text style={styles.invoiceTitleText}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
              <Text style={styles.invoiceNumber}>
                Date: {format(new Date(invoice.invoiceDate), 'MMM d, yyyy')}
              </Text>
              {invoice.dueDate && (
                <Text style={styles.invoiceNumber}>
                  Due: {format(new Date(invoice.dueDate), 'MMM d, yyyy')}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bill To Section */}
        <View style={styles.billToSection}>
          <View style={styles.billToColumn}>
            <Text style={styles.sectionTitle}>BILL TO</Text>
            <Text style={styles.infoText}>{invoice.dropzone.name}</Text>
            {invoice.dropzone.contactName && (
              <Text style={styles.infoText}>{invoice.dropzone.contactName}</Text>
            )}
            {invoice.dropzone.address && (
              <Text style={styles.infoText}>{invoice.dropzone.address}</Text>
            )}
            {invoice.dropzone.city && invoice.dropzone.country && (
              <Text style={styles.infoText}>
                {invoice.dropzone.city}, {invoice.dropzone.country}
              </Text>
            )}
            {invoice.dropzone.contactEmail && (
              <Text style={styles.infoText}>{invoice.dropzone.contactEmail}</Text>
            )}
          </View>

          <View style={styles.billToColumn}>
            <Text style={styles.sectionTitle}>INVOICE DETAILS</Text>
            <Text style={styles.infoText}>Status: {invoice.status}</Text>
            <Text style={styles.infoText}>Currency: {invoice.currency}</Text>
            <Text style={styles.infoText}>
              Total Work Jumps: {invoice.lineItems.length}
            </Text>
          </View>
        </View>

        {/* Line Items Table - Summary by Type */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, { width: '10%' }]}>#</Text>
            <Text style={[styles.col2, { width: '40%' }]}>Description</Text>
            <Text style={[styles.col3, { width: '15%' }]}>Qty</Text>
            <Text style={[styles.col4, { width: '15%' }]}>Unit Price</Text>
            <Text style={[styles.col5, { width: '20%' }]}>Total</Text>
          </View>

          {groupedItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.col1, { width: '10%' }]}>{index + 1}</Text>
              <Text style={[styles.col2, { width: '40%' }]}>{item.type}</Text>
              <Text style={[styles.col3, { width: '15%' }]}>{item.count}</Text>
              <Text style={[styles.col4, { width: '15%' }]}>
                {formatCurrency(item.unitPrice, invoice.currency)}
              </Text>
              <Text style={[styles.col5, { width: '20%' }]}>
                {formatCurrency(item.total, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>

          {invoice.taxAmount && invoice.taxRate && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({invoice.taxRate}%)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(invoice.taxAmount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text>TOTAL</Text>
            <Text>{formatCurrency(invoice.total, invoice.currency)}</Text>
          </View>
        </View>

        {/* Remittance Details */}
        {invoice.user.remittanceDetails && (
          <View style={styles.remittanceSection}>
            <Text style={styles.remittanceTitle}>PAYMENT DETAILS</Text>
            <Text style={styles.remittanceText}>
              {invoice.user.remittanceDetails}
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            {invoice.user.brandingInvoiceFooter ||
             'Thank you for your business. Payment is due within 30 days.'}
          </Text>
        </View>
      </Page>

      {/* Page 2: Jump Details (only when the invoice has jump-derived lines) */}
      {jumpDetailItems.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.companyName}>Jump Details</Text>
            <Text style={styles.invoiceNumber}>Invoice #{invoice.invoiceNumber}</Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.col2, { width: '30%' }]}>Date</Text>
              <Text style={[styles.col3, { width: '30%', textAlign: 'left' }]}>Work Type</Text>
              <Text style={[styles.col4, { width: '40%', textAlign: 'left' }]}>Customer Name</Text>
            </View>

            {jumpDetailItems
              .slice()
              .sort((a, b) => (a.jump!.jumpNumber - b.jump!.jumpNumber))
              .map((item) => {
                // Display work jump type, appending " - Handcam" for handcam add-ons
                const displayType = item.itemType === 'HANDCAM_ADDON'
                  ? `${item.workJumpType} - Handcam`
                  : item.workJumpType

                return (
                  <View key={item.id} style={styles.tableRow}>
                    <Text style={[styles.col2, { width: '30%' }]}>
                      {format(new Date(item.jump!.date), 'MMM d, yyyy')}
                    </Text>
                    <Text style={[styles.col3, { width: '30%', textAlign: 'left' }]}>
                      {displayType}
                    </Text>
                    <Text style={[styles.col4, { width: '40%', textAlign: 'left' }]}>
                      {item.jump!.customerName || '-'}
                    </Text>
                  </View>
                )
              })}
          </View>

          <View style={styles.footer}>
            <Text>Page 2 of 2 - Jump Details</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
