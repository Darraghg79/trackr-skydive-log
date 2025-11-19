"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { Download, FileText, Loader2 } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function ExportPage() {
  const [exporting, setExporting] = useState(false)
  const { toast } = useToast()

  const handleExportCSV = async () => {
    setExporting(true)
    try {
      const res = await fetch("/api/jumps")
      const data = await res.json()

      if (!data.data || data.data.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any jumps to export yet",
          variant: "destructive"
        })
        return
      }

      // Convert to CSV
      const jumps = data.data
      const headers = [
        "jumpNumber",
        "date",
        "dropzone",
        "aircraft",
        "jumpType",
        "exitAltitude",
        "deploymentAltitude",
        "freefallTime",
        "isCutaway",
        "notes"
      ]

      const csvRows = [headers.join(",")]

      jumps.forEach((jump: any) => {
        const row = [
          jump.jumpNumber,
          jump.date,
          `"${jump.dropzone?.name || ""}"`,
          `"${jump.aircraft?.name || ""}"`,
          `"${jump.jumpType?.name || ""}"`,
          jump.exitAltitude || "",
          jump.deploymentAltitude || "",
          jump.freefallTime || "",
          jump.isCutaway ? "true" : "false",
          `"${(jump.notes || "").replace(/"/g, '""')}"` // Escape quotes
        ]
        csvRows.push(row.join(","))
      })

      const csvContent = csvRows.join("\n")
      const blob = new Blob([csvContent], { type: "text/csv" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `trackr-jumps-export-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export successful",
        description: `Exported ${jumps.length} jumps to CSV`
      })
    } catch (error) {
      console.error("Export failed:", error)
      toast({
        title: "Export failed",
        description: "Failed to export your jump data",
        variant: "destructive"
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-muted-foreground">
          Download your logbook data for backup or transfer
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export to CSV
          </CardTitle>
          <CardDescription>
            Download all your jump logs in CSV format. This file can be opened in Excel, Google Sheets, or imported into other logbook applications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h4 className="font-medium mb-2">What's included:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Jump number, date, and location</li>
              <li>Aircraft and jump type information</li>
              <li>Altitude data (exit and deployment)</li>
              <li>Freefall time and cutaway status</li>
              <li>Jump notes and comments</li>
            </ul>
          </div>

          <Button onClick={handleExportCSV} disabled={exporting} size="lg">
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                Export All Jumps to CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-2">💡 Pro Tip</p>
            <p>Export your data regularly as a backup. You can re-import this CSV file later if needed using the Import feature in Settings.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
