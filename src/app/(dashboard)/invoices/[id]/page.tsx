"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, Download, Send } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/currencyFormat"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoice.status === "OPEN" && (
              <Button
                className="w-full"
                onClick={() => updateStatus("SENT")}
              >
                <Send className="h-4 w-4 mr-2" />
                Mark as Sent
              </Button>
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
            <Button variant="outline" className="w-full" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download PDF (Coming Soon)
            </Button>
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
          {invoice.lineItems.length === 0 ? (
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
                  {invoice.lineItems.map((item: any) => (
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
                  {invoice.taxAmount && (
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
    </div>
  )
}
