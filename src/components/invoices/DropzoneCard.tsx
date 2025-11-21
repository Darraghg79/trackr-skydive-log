"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, ChevronRight } from "lucide-react"

interface DropzoneCardProps {
  id: string
  name: string
  uninvoicedCount: number
}

export function DropzoneCard({ id, name, uninvoicedCount }: DropzoneCardProps) {
  return (
    <Link href={`/invoices/dropzone/${id}`}>
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">{name}</h3>
                <p className="text-sm text-muted-foreground">
                  {uninvoicedCount} uninvoiced work {uninvoicedCount === 1 ? 'jump' : 'jumps'}
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
