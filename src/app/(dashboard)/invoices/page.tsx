"use client"

import { useEffect, useState } from "react"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { FileText } from "lucide-react"
import { InvoiceTabs } from "@/components/invoices/InvoiceTabs"
import { DropzoneCard } from "@/components/invoices/DropzoneCard"
import { InvoiceCard } from "@/components/invoices/InvoiceCard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Dropzone {
  id: string
  name: string
  uninvoicedCount: number
}

interface Invoice {
  id: string
  invoiceNumber: string
  invoiceDate: string
  total: number
  currency: string
  status: "OPEN" | "SENT" | "PAID"
  dropzone: { id: string; name: string }
}

export default function InvoicesPage() {
  const [dropzones, setDropzones] = useState<Dropzone[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [dropzonesRes, invoicesRes] = await Promise.all([
        fetch("/api/dropzones/with-uninvoiced"),
        fetch("/api/invoices?orderBy=invoiceDate&order=desc&limit=100"),
      ])

      const dropzonesData = await dropzonesRes.json()
      const invoicesData = await invoicesRes.json()

      setDropzones(dropzonesData.data || [])
      setInvoices(invoicesData.data || [])
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const filteredInvoices =
    statusFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter)

  const toInvoiceContent = (
    <div className="space-y-4">
      {dropzones.length === 0 ? (
        <EmptyState
          title="No work jumps to invoice"
          description="Log work jumps at dropzones to create invoices."
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {dropzones.map((dropzone) => (
            <DropzoneCard
              key={dropzone.id}
              id={dropzone.id}
              name={dropzone.name}
              uninvoicedCount={dropzone.uninvoicedCount}
            />
          ))}
        </div>
      )}
    </div>
  )

  const historyContent = (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setStatusFilter("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "all"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setStatusFilter("OPEN")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "OPEN"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Open
        </button>
        <button
          onClick={() => setStatusFilter("SENT")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "SENT"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Sent
        </button>
        <button
          onClick={() => setStatusFilter("PAID")}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "PAID"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Paid
        </button>
      </div>

      {filteredInvoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          description={
            statusFilter === "all"
              ? "Create your first invoice from work jumps."
              : `No ${statusFilter.toLowerCase()} invoices found.`
          }
          icon={<FileText className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              id={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              invoiceDate={invoice.invoiceDate}
              total={invoice.total}
              currency={invoice.currency}
              status={invoice.status}
              dropzoneName={invoice.dropzone.name}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Invoices</h1>
        <p className="text-muted-foreground">
          Manage your work jump invoices
        </p>
      </div>

      <Tabs defaultValue="to-invoice" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="to-invoice">To Invoice</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="to-invoice" className="mt-6">
          {toInvoiceContent}
        </TabsContent>
        <TabsContent value="history" className="mt-6">
          {historyContent}
        </TabsContent>
      </Tabs>
    </div>
  )
}
