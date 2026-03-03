"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface ProfileBlockProps {
  onNext: (data: { unitPreference: "IMPERIAL" | "METRIC" }) => void
}

export function ProfileBlock({ onNext }: ProfileBlockProps) {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [unitPreference, setUnitPreference] = useState<"IMPERIAL" | "METRIC">("IMPERIAL")
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const body: Record<string, unknown> = { unitPreference }
      if (licenseNumber.trim()) body.licenseNumber = licenseNumber.trim()

      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
    } catch {
      // Non-critical — continue regardless
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    await save()
    onNext({ unitPreference })
  }

  const handleSkip = () => {
    onNext({ unitPreference })
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Welcome to TrackR — let&apos;s get you set up</CardTitle>
        <CardDescription>
          This takes about 2 minutes. You can skip any step and update everything later in Settings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="licenseNumber">Licence / Certificate Number</Label>
          <Input
            id="licenseNumber"
            placeholder="e.g. D-12345"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Displayed on jump signatures.</p>
        </div>

        <div className="space-y-2">
          <Label>Units</Label>
          <div className="flex rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={() => setUnitPreference("IMPERIAL")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                unitPreference === "IMPERIAL"
                  ? "bg-primary text-white"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Imperial (ft)
            </button>
            <button
              type="button"
              onClick={() => setUnitPreference("METRIC")}
              className={`flex-1 py-2 text-sm font-medium transition-colors border-l ${
                unitPreference === "METRIC"
                  ? "bg-primary text-white"
                  : "bg-background text-foreground hover:bg-muted"
              }`}
            >
              Metric (m)
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
          <Button variant="ghost" onClick={handleSkip} disabled={saving} className="text-sm">
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
