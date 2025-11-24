"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"
import { Upload, FileText, AlertCircle, CheckCircle, Info } from "lucide-react"

export const dynamic = 'force-dynamic'

type UnitPreference = "METRIC" | "IMPERIAL"

export default function ImportJumpsPage() {
  const [file, setFile] = useState<File | null>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [csvAltitudeUnit, setCsvAltitudeUnit] = useState<UnitPreference>("IMPERIAL")
  const [userUnitPreference, setUserUnitPreference] = useState<UnitPreference>("IMPERIAL")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; imported?: number; updated?: number } | null>(null)
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
            setCsvAltitudeUnit(userData.unitPreference) // Default to user's preference
          }
        }
      } catch (error) {
        console.error("Failed to fetch user preference:", error)
      }
    }
    fetchUserPreference()
  }, [])

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

      // Send to API with CSV unit information
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

          {/* Unit Settings */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Unit Conversion</p>
                  <p className="text-xs text-muted-foreground">
                    Your account is set to <strong>{userUnitPreference}</strong> units.
                    Specify the units used in your CSV file, and values will be automatically converted if needed.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvAltitudeUnit">Altitude Units in CSV File</Label>
                <Select
                  value={csvAltitudeUnit}
                  onValueChange={(value) => setCsvAltitudeUnit(value as UnitPreference)}
                  disabled={importing}
                >
                  <SelectTrigger id="csvAltitudeUnit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IMPERIAL">Feet (Imperial)</SelectItem>
                    <SelectItem value="METRIC">Meters (Metric)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {csvAltitudeUnit !== userUnitPreference && (
                    <span className="text-amber-600 dark:text-amber-400">
                      ⚠ Altitudes will be converted from {csvAltitudeUnit === "IMPERIAL" ? "feet" : "meters"} to {userUnitPreference === "IMPERIAL" ? "feet" : "meters"}
                    </span>
                  )}
                  {csvAltitudeUnit === userUnitPreference && (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ No conversion needed - units match your account settings
                    </span>
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Freefall Time</Label>
                <div className="text-sm text-muted-foreground">
                  Measured in <strong>seconds</strong> (duration of freefall, not distance)
                  <br />
                  <span className="text-xs">No conversion needed - always use seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
                Your CSV file should match this format with header row and data rows:
              </p>

              {/* Sample CSV */}
              <div className="text-xs font-mono bg-background p-3 rounded border overflow-x-auto space-y-1">
                <div className="text-muted-foreground">jumpnumber,date,dropzone,aircraft,jumptype,rig,exitaltitude,deploymentaltitude,freefalltime,iscutaway,workjump,workjumptype,customername,hashandcam,photourl,notes</div>
                <div>1,2024-01-15,Skydive City,Cessna 182,Freefly,Vector 3,13000,4000,60,no,no,,,,,"Great jump!"</div>
                <div>2,2024-01-16,Skydive City,Twin Otter,Tandem,Sigma Tandem,14000,5000,50,no,yes,Tandem,John Smith,yes,,</div>
                <div>3,2024-01-17,Mile High DZ,Caravan,RW,Icon,12500,3500,55,no,no,,,,,"4-way formation"</div>
              </div>

              {/* Field Reference */}
              <div className="text-sm space-y-2 text-muted-foreground">
                <div>
                  <p className="font-semibold text-foreground mb-1">Required Fields:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>jumpnumber:</strong> Jump number (integer)</li>
                    <li><strong>date:</strong> YYYY-MM-DD format (e.g., 2024-01-15)</li>
                    <li><strong>dropzone:</strong> Dropzone name (will be auto-created if missing)</li>
                  </ul>
                </div>

                <div>
                  <p className="font-semibold text-foreground mb-1">Optional Fields:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li><strong>aircraft:</strong> Aircraft name (auto-created if missing)</li>
                    <li><strong>jumptype:</strong> Jump type/discipline (auto-created if missing)</li>
                    <li><strong>rig:</strong> Rig name (must already exist, not auto-created)</li>
                    <li><strong>exitaltitude:</strong> Exit altitude in feet or meters (specify units above)</li>
                    <li><strong>deploymentaltitude:</strong> Deployment altitude in feet or meters</li>
                    <li><strong>freefalltime:</strong> Freefall time in seconds</li>
                    <li><strong>iscutaway:</strong> yes/no - was this a cutaway?</li>
                    <li><strong>workjump:</strong> yes/no - marks as paid work jump (no invoice created)</li>
                    <li><strong>workjumptype:</strong> Type of work jump (Tandem, Video, Coach, etc.)</li>
                    <li><strong>customername:</strong> Customer name for work jumps</li>
                    <li><strong>hashandcam:</strong> yes/no - did you use a handcam?</li>
                    <li><strong>photourl:</strong> URL to jump photo/video</li>
                    <li><strong>notes:</strong> Any additional notes</li>
                  </ul>
                </div>

                <div className="pt-2 border-t">
                  <p><strong>Auto-creation:</strong> Missing dropzones, aircraft, and jump types will be automatically created.</p>
                  <p><strong>Overwrite mode:</strong> Enable above to update jumps with matching jump numbers (otherwise they'll be skipped).</p>
                  <p><strong>Work jumps:</strong> Imported work jumps are counted in reports but do not generate invoices.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  )
}
