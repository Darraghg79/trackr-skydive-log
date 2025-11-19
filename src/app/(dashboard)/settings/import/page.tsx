"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/useToast"
import { Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function ImportJumpsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; imported?: number; updated?: number } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast({ title: "Please select a file", variant: "destructive" })
      return
    }

    setImporting(true)
    setResult(null)

    try {
      const text = await file.text()
      const lines = text.trim().split("\n")

      if (lines.length < 2) {
        throw new Error("File must contain header and at least one jump record")
      }

      // Parse CSV
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase())
      const jumps = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",")
        const jump: any = {}

        headers.forEach((header, index) => {
          const value = values[index]?.trim()
          if (value) {
            jump[header] = value
          }
        })

        if (jump.date) {
          jumps.push(jump)
        }
      }

      if (jumps.length === 0) {
        throw new Error("No valid jump records found in file")
      }

      // Send to API
      const res = await fetch("/api/jumps/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumps, overwrite }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Import failed")
      }

      const data = await res.json()

      const parts = []
      if (data.imported > 0) parts.push(`${data.imported} imported`)
      if (data.updated > 0) parts.push(`${data.updated} updated`)
      const message = `Successfully ${parts.join(", ")}`

      setResult({
        success: true,
        message,
        imported: data.imported,
        updated: data.updated,
      })

      toast({
        title: "Import successful",
        description: message
      })

      // Refresh after success
      setTimeout(() => {
        router.push("/jumps")
        router.refresh()
      }, 2000)

    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Import failed",
      })
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Import Jumps</CardTitle>
          <CardDescription>
            Upload a CSV file to import your existing jump logs. The jump number will continue from your highest imported jump.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">CSV File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          {/* Overwrite Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overwrite"
              checked={overwrite}
              onCheckedChange={(checked) => setOverwrite(checked as boolean)}
              disabled={importing}
            />
            <Label
              htmlFor="overwrite"
              className="text-sm font-normal cursor-pointer"
            >
              Overwrite existing jumps with matching jump numbers
            </Label>
          </div>

          {/* Result Message */}
          {result && (
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${
              result.success
                ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              )}
              <div>
                <p className={`font-medium ${
                  result.success
                    ? "text-green-900 dark:text-green-100"
                    : "text-red-900 dark:text-red-100"
                }`}>
                  {result.success ? "Success!" : "Error"}
                </p>
                <p className={`text-sm ${
                  result.success
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!file || importing}
            size="lg"
            className="w-full"
          >
            {importing ? (
              <>Importing...</>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Import Jumps
              </>
            )}
          </Button>

          {/* CSV Format Info */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">CSV Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Your CSV file should include the following columns:
              </p>
              <div className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto">
                jumpnumber,date,dropzone,aircraft,jumptype,exitaltitude,deploymentaltitude,freefalltime,notes
              </div>
              <div className="text-sm space-y-1 text-muted-foreground">
                <p><strong>Required:</strong> jumpnumber, date, dropzone</p>
                <p><strong>Optional:</strong> aircraft, jumptype, exitaltitude, deploymentaltitude, freefalltime, notes</p>
                <p><strong>Date format:</strong> YYYY-MM-DD (e.g., 2024-01-15)</p>
                <p><strong>Auto-creation:</strong> Missing dropzones, aircraft, and jump types will be automatically created.</p>
                <p><strong>Overwrite mode:</strong> Enable to update jumps with matching jump numbers (otherwise they'll be skipped).</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
