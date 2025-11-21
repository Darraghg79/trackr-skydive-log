"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Calendar, DollarSign, ChevronRight } from "lucide-react"
import { format } from "date-fns"

interface InvoiceCardProps {
  id: string
  invoiceNumber: string
  invoiceDate: string
  total: number
  currency: string
  status: "OPEN" | "SENT" | "PAID"
  dropzoneName: string
}

const statusVariants: Record<string, "default" | "secondary" | "success"> = {
  OPEN: "secondary",
  SENT: "default",
  PAID: "success",
}

export function InvoiceCard({
  id,
  invoiceNumber,
  invoiceDate,
  total,
  currency,
  status,
  dropzoneName,
}: InvoiceCardProps) {
  return (
    <Link href={`/invoices/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold">#{invoiceNumber}</h3>
                <Badge variant={statusVariants[status]} className="text-xs">
                  {status}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span>{dropzoneName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(invoiceDate), "MMM d, yyyy")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex items-center gap-1 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  <span>{parseFloat(total.toString()).toFixed(2)}</span>
                </div>
                <div className="text-xs text-muted-foreground">{currency}</div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
