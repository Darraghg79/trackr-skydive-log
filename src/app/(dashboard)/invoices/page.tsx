"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, FileText, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"


interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  total: number
  currency: string
  status: string
  dropzone: { id: string; name: string }
  _count: { lineItems: number }
}

const statusVariants: Record<string, "default" | "secondary" | "success"> = {
  OPEN: "secondary",
  SENT: "default",
  PAID: "success",
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const res = await fetch(
        "/api/invoices?orderBy=invoiceDate&order=desc&limit=50"
      )
      const data = await res.json()
      setInvoices(data.data || [])
    } catch (error) {
      console.error("Failed to fetch invoices:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">
            Manage your work jump invoices
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Link>
        </Button>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices yet"
          description="Create invoices from your work jumps to bill dropzones."
          actionLabel="Create Invoice"
          actionHref="/invoices/new"
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <Link key={invoice.id} href={`/invoices/${invoice.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold">
                          #{invoice.invoiceNumber}
                        </h3>
                        <Badge variant={statusVariants[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(
                            new Date(invoice.invoiceDate),
                            "MMM d, yyyy"
                          )}
                        </div>
                        <span>{invoice.dropzone.name}</span>
                        <span>{invoice._count.lineItems} items</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-lg font-semibold">
                        <DollarSign className="h-4 w-4" />
                        {parseFloat(invoice.total.toString()).toFixed(2)}{" "}
                        {invoice.currency}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
