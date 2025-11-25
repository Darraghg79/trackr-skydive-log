"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, ChevronRight, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface DropzoneCardProps {
  id: string
  name: string
  uninvoicedCount: number
  openInvoiceId: string | null
}

export function DropzoneCard({ id, name, uninvoicedCount, openInvoiceId }: DropzoneCardProps) {
  const href = openInvoiceId ? `/invoices/${openInvoiceId}` : `/invoices/dropzone/${id}`
  const hasOpenInvoice = !!openInvoiceId

  return (
    <Link href={href}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {hasOpenInvoice ? (
                  <FileText className="h-5 w-5 text-blue-600" />
                ) : (
                  <MapPin className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base">{name}</h3>
                  {hasOpenInvoice && (
                    <Badge variant="secondary" className="text-xs">OPEN</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {hasOpenInvoice ? (
                    'View open invoice'
                  ) : (
                    `${uninvoicedCount} uninvoiced work ${uninvoicedCount === 1 ? 'jump' : 'jumps'}`
                  )}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
