"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropzoneCombobox } from "@/components/ui/dropzone-combobox"
import { Loader2 } from "lucide-react"

interface DropzoneBlockProps {
  unitPreference: "IMPERIAL" | "METRIC"
  onNext: (defaultDropzoneId: string) => void
}

export function DropzoneBlock({ unitPreference, onNext }: DropzoneBlockProps) {
  const [defaultDropzoneId, setDefaultDropzoneId] = useState("")
  const [exitAltitude, setExitAltitude] = useState("")
  const [deploymentAltitude, setDeploymentAltitude] = useState("")
  const [saving, setSaving] = useState(false)

  const unit = unitPreference === "METRIC" ? "m" : "ft"

  const save = async () => {
    const body: Record<string, unknown> = {}
    if (defaultDropzoneId) body.defaultDropzoneId = defaultDropzoneId
    if (exitAltitude) body.defaultExitAltitude = parseInt(exitAltitude)
    if (deploymentAltitude) body.defaultDeploymentAltitude = parseInt(deploymentAltitude)
    if (Object.keys(body).length === 0) return

    await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await save()
    } catch {
      // Non-critical — continue regardless
    } finally {
      setSaving(false)
    }
    onNext(defaultDropzoneId)
  }

  const handleSkip = () => {
    onNext("")
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Where do you mainly jump?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Home / Current Dropzone</Label>
          <DropzoneCombobox
            value={defaultDropzoneId}
            onValueChange={setDefaultDropzoneId}
            placeholder="Search dropzones..."
          />
        </div>

        <div className="space-y-2">
          <Label>Default Exit Altitude ({unit})</Label>
          <Input
            type="number"
            min="0"
            placeholder={unitPreference === "METRIC" ? "e.g. 4200" : "e.g. 14000"}
            value={exitAltitude}
            onChange={(e) => setExitAltitude(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Default Deployment Altitude ({unit})</Label>
          <Input
            type="number"
            min="0"
            placeholder={unitPreference === "METRIC" ? "e.g. 900" : "e.g. 3000"}
            value={deploymentAltitude}
            onChange={(e) => setDeploymentAltitude(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            These will be pre-filled every time you log a jump — you can always change them per jump.
          </p>
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
