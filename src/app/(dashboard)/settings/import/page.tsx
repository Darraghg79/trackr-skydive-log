"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { Upload, FileText, AlertCircle, CheckCircle, Info, Loader2, ArrowRight } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export const dynamic = 'force-dynamic'

type UnitPreference = "METRIC" | "IMPERIAL"

// Standard Trackr field names
const TRACKR_FIELDS = [
  { value: "jumpnumber", label: "Jump Number" },
  { value: "date", label: "Date" },
  { value: "dropzone", label: "Dropzone" },
  { value: "aircraft", label: "Aircraft" },
  { value: "jumptype", label: "Jump Type" },
  { value: "rig", label: "Gear (comma-separated components)" },
  { value: "exitaltitude", label: "Exit Altitude" },
  { value: "deploymentaltitude", label: "Deployment Altitude" },
  { value: "freefalltime", label: "Freefall Time" },
  { value: "distancetotarget", label: "Distance to Target" },
  { value: "iscutaway", label: "Is Cutaway" },
  { value: "workjump", label: "Work Jump" },
  { value: "workjumptype", label: "Work Jump Type" },
  { value: "customername", label: "Customer Name" },
  { value: "hashandcam", label: "Has Handcam" },
  { value: "photourl", label: "Photo URL" },
  { value: "notes", label: "Notes" },
  { value: "skip", label: "--- Skip This Column ---" },
]

export default function ImportJumpsPage() {
  const [step, setStep] = useState<"upload" | "mapping" | "importing">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [overwrite, setOverwrite] = useState(false)
  const [csvAltitudeUnit, setCsvAltitudeUnit] = useState<UnitPreference>("IMPERIAL")
  const [userUnitPreference, setUserUnitPreference] = useState<UnitPreference>("IMPERIAL")
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    imported?: number
    updated?: number
    skipped?: number
    total?: number
    errors?: Array<{ jumpNumber: number; reason: string }>
    hasMoreErrors?: boolean
  } | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch user's unit preference
  useEffect(() => {
    const fetchUserPreference = async () => {
      try {
        const res = await fetch("/api/user")
        if (res.ok) {
          const userData = await res.json()
          if (userData.unitPreference) {
            setUserUnitPreference(userData.unitPreference)
            setCsvAltitudeUnit(userData.unitPreference)
          }
        }
      } catch (error) {
        console.error("Failed to fetch user preference:", error)
      }
    }
    fetchUserPreference()
  }, [])

  // Prevent navigation during import
  useEffect(() => {
    if (importing) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault()
        e.returnValue = ''
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [importing])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setResult(null)

      // Parse CSV to extract headers and data
      const text = await selectedFile.text()
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const headers = results.meta.fields || []
          setCsvHeaders(headers)
          setCsvData(results.data)

          // Auto-map columns with matching names
          const autoMapping: Record<string, string> = {}
          headers.forEach(header => {
            const normalized = header.toLowerCase().trim()
            const trackrField = TRACKR_FIELDS.find(f =>
              f.value === normalized ||
              f.label.toLowerCase() === normalized
            )
            if (trackrField) {
              autoMapping[header] = trackrField.value
            }
          })
          setColumnMapping(autoMapping)
          setStep("mapping")
        },
        error: (error) => {
          toast({
            title: "Error parsing CSV",
            description: error.message,
            variant: "destructive"
          })
        }
      })
    }
  }

  const handleImport = async () => {
    if (!csvData.length) {
      toast({ title: "No data to import", variant: "destructive" })
      return
    }

    // Check required fields are mapped
    const mappedFields = Object.values(columnMapping).filter(v => v !== "skip")
    if (!mappedFields.includes("jumpnumber")) {
      toast({ title: "Jump Number column must be mapped", variant: "destructive" })
      return
    }
    if (!mappedFields.includes("date")) {
      toast({ title: "Date column must be mapped", variant: "destructive" })
      return
    }
    if (!mappedFields.includes("dropzone")) {
      toast({ title: "Dropzone column must be mapped", variant: "destructive" })
      return
    }

    setImporting(true)
    setStep("importing")
    setProgress(0)
    setResult(null)

    try {
      // Transform data according to column mapping
      const jumps = csvData.map((row: any) => {
        const mapped: any = {}
        Object.entries(columnMapping).forEach(([csvCol, trackrField]) => {
          if (trackrField !== "skip" && row[csvCol]) {
            mapped[trackrField] = row[csvCol]
          }
        })
        return mapped
      })

      // Send to API
      const res = await fetch("/api/jumps/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jumps, overwrite, csvAltitudeUnit }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Import failed")
      }

      const data = await res.json()
      setProgress(100)

      const parts = []
      if (data.imported > 0) parts.push(`${data.imported} imported`)
      if (data.updated > 0) parts.push(`${data.updated} updated`)
      if (data.skipped > 0) parts.push(`${data.skipped} skipped`)
      const message = parts.length > 0 ? `${parts.join(", ")} out of ${data.total} total` : "No changes made"

      setResult({
        success: true,
        message,
        imported: data.imported,
        updated: data.updated,
        skipped: data.skipped,
        total: data.total,
        errors: data.errors,
        hasMoreErrors: data.hasMoreErrors,
      })

      const hasErrors = data.errors && data.errors.length > 0

      toast({
        title: hasErrors ? "Import completed with errors" : "Import successful",
        description: message,
      })

      // Only auto-redirect if no errors
      if (!hasErrors && (data.imported > 0 || data.updated > 0)) {
        setTimeout(() => {
          router.push("/jumps")
          router.refresh()
        }, 3000)
      }

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

  // Upload Step
  if (step === "upload") {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Import Jumps</CardTitle>
            <CardDescription>
              Upload a CSV file to import your existing jump logs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="file">CSV File</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </div>
              )}
            </div>

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Next: Column Mapping</p>
                    <p className="text-xs text-muted-foreground">
                      After uploading, you'll map your CSV columns to Trackr fields. This allows you to import from any logbook format!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Mapping Step
  if (step === "mapping") {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Map CSV Columns</CardTitle>
            <CardDescription>
              Match your CSV columns to Trackr fields. Required fields: Jump Number, Date, Dropzone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              {csvHeaders.map((header) => (
                <div key={header} className="grid grid-cols-2 gap-4 items-center">
                  <div className="font-mono text-sm bg-muted p-2 rounded">
                    {header}
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={columnMapping[header] || "skip"}
                      onValueChange={(value) => {
                        setColumnMapping(prev => ({ ...prev, [header]: value }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TRACKR_FIELDS.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <Card className="bg-muted/30">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Unit Conversion</p>
                      <p className="text-xs text-muted-foreground">
                        Your account is set to <strong>{userUnitPreference}</strong> units.
                        Specify the units in your CSV file.
                      </p>
                    </div>
                    <div className="space-y-1 pt-2 border-t">
                      <p className="text-sm font-medium">Gear Components (Optional)</p>
                      <p className="text-xs text-muted-foreground">
                        List all gear used in the <strong>Gear</strong> column with commas: <code className="text-xs bg-muted px-1 rounded">Mirage G4, Crossfire 2 149, PD Reserve 176</code>
                        <br />
                        Each item becomes a separate component. Jump counts are tracked per component. Group into rigs later in the app.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csvAltitudeUnit">Altitude Units in CSV</Label>
                  <Select
                    value={csvAltitudeUnit}
                    onValueChange={(value) => setCsvAltitudeUnit(value as UnitPreference)}
                  >
                    <SelectTrigger id="csvAltitudeUnit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMPERIAL">Feet (Imperial)</SelectItem>
                      <SelectItem value="METRIC">Meters (Metric)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked as boolean)}
              />
              <Label htmlFor="overwrite" className="text-sm font-normal cursor-pointer">
                Overwrite existing jumps with matching jump numbers
              </Label>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={handleImport} className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                Import {csvData.length} Jumps
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Importing Step
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {importing ? "Importing Jumps..." : "Import Complete"}
          </CardTitle>
          <CardDescription>
            {importing ? "Please wait while we import your jumps. Do not close this page." : "Your import has finished"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {importing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-4">
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
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.success
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}>
                    {result.success ? "Import Complete!" : "Import Failed"}
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

              {result.errors && result.errors.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      Import Errors ({result.errors.length}{result.hasMoreErrors ? "+" : ""})
                    </CardTitle>
                    <CardDescription>
                      The following jumps could not be imported
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {result.errors.map((error, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 p-2 text-sm border rounded bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                        >
                          <span className="font-mono text-amber-900 dark:text-amber-100 min-w-[4rem]">
                            Jump #{error.jumpNumber || "?"}
                          </span>
                          <span className="text-amber-700 dark:text-amber-300 flex-1">
                            {error.reason}
                          </span>
                        </div>
                      ))}
                      {result.hasMoreErrors && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          ...and more errors. Only the first 50 are shown.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button onClick={() => router.push("/jumps")} className="w-full">
                View Jumps
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
