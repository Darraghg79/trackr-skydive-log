"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"


export default function NewInvoicePage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Create Invoice</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Generation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Invoice creation will be available in the next update. This feature will allow you to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Select a dropzone and date range</li>
            <li>Auto-populate billable work jumps</li>
            <li>Apply dropzone rates and tax</li>
            <li>Generate PDF invoices</li>
          </ul>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
