"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, Download, Send, Loader2, Eye, Mail, RefreshCw, Plus, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/currencyFormat"
import { pdf } from "@react-pdf/renderer"
import { InvoicePDF } from "@/components/pdf/InvoicePDF"
import { isShareableUrlExpired } from "@/lib/utils/shareableUrl"
import { AddInvoiceLineForm, AdhocLineFormValues } from "@/components/invoices/AddInvoiceLineForm"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [showSentDialog, setShowSentDialog] = useState(false)
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null)

  useEffect(() => {
    fetchInvoice()
  }, [params.id])

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`)
      if (!res.ok) throw new Error("Invoice not found")
      const data = await res.json()
      setInvoice(data)
    } catch (error) {
      toast({ title: "Failed to load invoice", variant: "destructive" })
      router.push("/invoices")
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/invoices/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast({ title: `Invoice marked as ${status.toLowerCase()}` })
      fetchInvoice()
    } catch (error) {
      toast({ title: "Failed to update status", variant: "destructive" })
    }
  }

  const handleViewPDF = async () => {
    if (!invoice) return

    setGeneratingPDF(true)
    try {
      // Generate PDF
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()

      // Create blob URL and open in new tab
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')

      toast({
        title: "PDF opened",
        description: `Invoice ${invoice.invoiceNumber} opened in new tab`
      })

      // Clean up the URL after a delay to ensure the window has opened
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "Failed to generate PDF",
        description: "There was an error creating the PDF file",
        variant: "destructive"
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!invoice) return

    setGeneratingPDF(true)
    try {
      // Generate PDF
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()

      // Create download link
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "PDF downloaded successfully",
        description: `Invoice ${invoice.invoiceNumber} has been downloaded`
      })
    } catch (error) {
      console.error("PDF generation error:", error)
      toast({
        title: "Failed to generate PDF",
        description: "There was an error creating the PDF file",
        variant: "destructive"
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleSendInvoice = async () => {
    if (!invoice) return

    // Check if dropzone has email
    if (!invoice.dropzone.contactEmail) {
      toast({
        title: "No email address",
        description: "This dropzone doesn't have a contact email set",
        variant: "destructive"
      })
      return
    }

    setGeneratingPDF(true)
    try {
      // Generate/get shareable URL first
      const shareResponse = await fetch(`/api/invoices/${params.id}/share`, {
        method: 'POST',
      })

      if (!shareResponse.ok) {
        throw new Error('Failed to generate shareable link')
      }

      const { shareableUrl } = await shareResponse.json()

      // Auto-download PDF
      const blob = await pdf(<InvoicePDF invoice={invoice} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Invoice-${invoice.invoiceNumber}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Prepare email content with shareable link
      const companyName = invoice.user.brandingCompanyName || invoice.user.name || 'Skydiving Professional'
      const subject = `Invoice ${invoice.invoiceNumber} - ${companyName}`

      const emailBody = `Dear ${invoice.dropzone.contactName || 'Accounts'},

Please find enclosed invoice ${invoice.invoiceNumber} for skydiving services.

View Invoice: ${shareableUrl}

Amount Due: ${invoice.currency} ${formatCurrency(invoice.total, invoice.currency).replace(/[^\d.,]/g, '')}
${invoice.dueDate ? `Due Date: ${format(new Date(invoice.dueDate), 'MMMM d, yyyy')}` : 'Due Date: Upon receipt'}

${invoice.user.remittanceDetails ? `Payment Details:\n${invoice.user.remittanceDetails}\n\n` : ''}Thank you for your business.

Best regards,
${companyName}
${invoice.user.phone ? `Phone: ${invoice.user.phone}` : ''}`

      // Create mailto link
      const mailtoLink = `mailto:${invoice.dropzone.contactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`

      // Open email client
      window.location.href = mailtoLink

      // Show dialog to mark as sent
      setShowSentDialog(true)

      toast({
        title: "Email client opened",
        description: "Invoice link included in email (PDF also downloaded)"
      })
    } catch (error) {
      console.error("Email preparation error:", error)
      toast({
        title: "Failed to prepare email",
        description: "There was an error preparing the email",
        variant: "destructive"
      })
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleAddLine = async (values: AdhocLineFormValues) => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/line-items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to add line")
      toast({ title: "Line added" })
      await fetchInvoice()
    } catch (error) {
      toast({ title: "Failed to add line", variant: "destructive" })
      throw error
    }
  }

  const handleEditLine = async (lineItemId: string, values: AdhocLineFormValues) => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/line-items/${lineItemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to update line")
      toast({ title: "Line updated" })
      await fetchInvoice()
    } catch (error) {
      toast({ title: "Failed to update line", variant: "destructive" })
      throw error
    }
  }

  const handleDeleteLine = async () => {
    if (!deletingLineId) return
    try {
      const res = await fetch(`/api/invoices/${params.id}/line-items/${deletingLineId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete line")
      toast({ title: "Line removed" })
      await fetchInvoice()
    } catch (error) {
      toast({ title: "Failed to remove line", variant: "destructive" })
    } finally {
      setDeletingLineId(null)
    }
  }

  const handleConfirmSent = async () => {
    try {
      await updateStatus("SENT")
      setShowSentDialog(false)
    } catch (error) {
      // Error already handled by updateStatus
    }
  }

  const handleRegenerateInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${params.id}/share`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error("Failed to regenerate")

      const { shareableUrl, expiresAt } = await res.json()

      toast({
        title: "Invoice link regenerated",
        description: `New link expires on ${format(new Date(expiresAt), 'MMM d, yyyy')}`
      })

      // Refresh invoice data to get updated shareable URL
      fetchInvoice()
    } catch (error) {
      toast({
        title: "Failed to regenerate link",
        variant: "destructive"
      })
    }
  }

  const getShareableUrl = () => {
    if (!invoice?.shareableUrl) return null
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://login.trackr-app.online'
    return `${baseUrl}/share/invoice/${invoice.shareableUrl}`
  }

  const isLinkExpired = invoice?.shareableUrlExpiry
    ? isShareableUrlExpired(invoice.shareableUrlExpiry)
    : true

  if (loading) {
    return <PageLoader />
  }

  if (!invoice) {
    return null
  }

  const statusVariants: Record<string, "default" | "secondary" | "success"> = {
    OPEN: "secondary",
    SENT: "default",
    PAID: "success",
  }

  const jumpLineItems = invoice.lineItems.filter((li: any) => li.itemType !== "ADHOC")
  const adhocLineItems = invoice.lineItems.filter((li: any) => li.itemType === "ADHOC")
  const isOpen = invoice.status === "OPEN"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Invoice #{invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              {invoice.dropzone.name} -{" "}
              {format(new Date(invoice.invoiceDate), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusVariants[invoice.status]} className="text-sm">
            {invoice.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dropzone</span>
              <span>{invoice.dropzone.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>
                {format(new Date(invoice.invoiceDate), "MMM d, yyyy")}
              </span>
            </div>
            {invoice.dueDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due Date</span>
                <span>
                  {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Currency</span>
              <span>{invoice.currency}</span>
            </div>
            {invoice.sentDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sent On</span>
                <span>
                  {format(new Date(invoice.sentDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.status === "OPEN" && (
              <>
                <Button
                  className="w-full"
                  onClick={handleSendInvoice}
                  disabled={generatingPDF}
                >
                  {generatingPDF ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Preparing...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Invoice
                    </>
                  )}
                </Button>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => updateStatus("SENT")}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Mark as Sent
                </Button>
              </>
            )}
            {invoice.status === "SENT" && (
              <Button
                className="w-full"
                variant="default"
                onClick={() => updateStatus("PAID")}
              >
                Mark as Paid
              </Button>
            )}
            {invoice.status === "PAID" && (
              <div className="text-center text-sm text-muted-foreground py-2">
                Invoice has been paid
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewPDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  View PDF
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadPDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
            {(invoice.status === "SENT" || invoice.status === "PAID") && (
              <>
                {invoice.shareableUrl && !isLinkExpired && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">
                      Shareable link expires: {format(new Date(invoice.shareableUrlExpiry), 'MMM d, yyyy')}
                    </p>
                  </div>
                )}
                {(!invoice.shareableUrl || isLinkExpired) && (
                  <div className="pt-2 border-t">
                    {isLinkExpired && (
                      <p className="text-xs text-amber-600 mb-2">
                        Shareable link has expired
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRegenerateInvoice}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {invoice.shareableUrl ? 'Regenerate Invoice Link' : 'Generate Shareable Link'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {invoice.status === "OPEN" && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">
              <strong>This invoice automatically includes all uninvoiced work jumps for {invoice.dropzone.name}.</strong>
              {" "}New jumps will appear here automatically until you mark the invoice as sent.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Line Items</CardTitle>
        </CardHeader>
        <CardContent>
          {jumpLineItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No work jumps found for this dropzone.</p>
              {invoice.status === "OPEN" && (
                <p className="text-sm mt-2">New work jumps will appear here automatically.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Jump</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {jumpLineItems.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">
                        #{item.jump.jumpNumber} -{" "}
                        {format(new Date(item.jump.date), "MMM d")}
                      </td>
                      <td className="py-2">
                        {item.workJumpType}
                        {item.itemType === "HANDCAM_ADDON" && " (Handcam)"}
                      </td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td className="text-right py-2">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(item.lineTotal, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                  </tbody>
                <tfoot>
                  <tr className="border-t">
                    <td colSpan={4} className="text-right py-2 font-medium">
                      Subtotal
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(invoice.subtotal, invoice.currency)}
                    </td>
                  </tr>
                  {invoice.taxAmount > 0 && (
                    <tr>
                      <td colSpan={4} className="text-right py-2 font-medium">
                        Tax ({invoice.taxRate}%)
                      </td>
                      <td className="text-right py-2">
                        {formatCurrency(invoice.taxAmount, invoice.currency)}
                      </td>
                    </tr>
                  )}
                  <tr className="font-bold">
                    <td colSpan={4} className="text-right py-2">
                      Total
                    </td>
                    <td className="text-right py-2">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Additional Charges</CardTitle>
          {isOpen && (
            <AddInvoiceLineForm
              currency={invoice.currency}
              title="Add Charge"
              trigger={
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add line
                </Button>
              }
              onSubmit={handleAddLine}
            />
          )}
        </CardHeader>
        <CardContent>
          {adhocLineItems.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No additional charges on this invoice.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Description</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Total</th>
                    {isOpen && <th className="text-right py-2 w-20">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {adhocLineItems.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.description}</td>
                      <td className="text-right py-2">{item.quantity}</td>
                      <td
                        className={`text-right py-2 ${
                          Number(item.unitPrice) < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td
                        className={`text-right py-2 ${
                          Number(item.lineTotal) < 0 ? "text-red-600" : ""
                        }`}
                      >
                        {formatCurrency(item.lineTotal, invoice.currency)}
                      </td>
                      {isOpen && (
                        <td className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            <AddInvoiceLineForm
                              currency={invoice.currency}
                              title="Edit Charge"
                              initialValues={{
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: Number(item.unitPrice),
                              }}
                              trigger={
                                <Button size="icon" variant="ghost" className="h-7 w-7">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                              onSubmit={(values) => handleEditLine(item.id, values)}
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setDeletingLineId(item.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingLineId} onOpenChange={(open) => !open && setDeletingLineId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this charge?</AlertDialogTitle>
            <AlertDialogDescription>
              This additional charge will be removed from the invoice and totals will be recalculated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLine}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSentDialog} onOpenChange={setShowSentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark Invoice as Sent?</AlertDialogTitle>
            <AlertDialogDescription>
              Have you sent the invoice to {invoice.dropzone.name}? This will mark the invoice as SENT and prevent further changes to the line items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep as Open</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSent}>Yes, Mark as Sent</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
