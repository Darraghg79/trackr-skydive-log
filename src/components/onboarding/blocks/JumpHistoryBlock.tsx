"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { parseHHMMSSToSeconds } from "@/lib/utils/timeFormat"

interface JumpHistoryBlockProps {
  onNext: () => void
}

export function JumpHistoryBlock({ onNext }: JumpHistoryBlockProps) {
  const [lastJumpNumber, setLastJumpNumber] = useState("")
  const [cutaways, setCutaways] = useState("")
  const [freefallTime, setFreefallTime] = useState("")
  const [saving, setSaving] = useState(false)

  const nextJumpPreview = lastJumpNumber
    ? parseInt(lastJumpNumber) + 1
    : null

  const save = async () => {
    const body: Record<string, unknown> = {}
    const jumpNum = parseInt(lastJumpNumber)
    if (lastJumpNumber && !isNaN(jumpNum) && jumpNum >= 1) {
      body.currentJumpNumber = jumpNum
    }
    if (cutaways && parseInt(cutaways) >= 0) {
      body.startingCutaways = parseInt(cutaways)
    }
    if (freefallTime.trim()) {
      body.startingFreefallTime = parseHHMMSSToSeconds(freefallTime.trim())
    }
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
    onNext()
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">How many jumps have you done?</CardTitle>
        <CardDescription>
          We need this to keep your logbook numbering accurate.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="lastJumpNumber">What was your last completed jump number?</Label>
          <Input
            id="lastJumpNumber"
            type="number"
            min="1"
            placeholder="e.g. 500"
            value={lastJumpNumber}
            onChange={(e) => setLastJumpNumber(e.target.value)}
          />
          {nextJumpPreview !== null && !isNaN(nextJumpPreview) && (
            <p className="text-sm font-medium text-primary">
              Your next jump in TrackR will be #{nextJumpPreview}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter the number of your most recent jump — not the next one.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="cutaways">Total cutaways (optional)</Label>
          <Input
            id="cutaways"
            type="number"
            min="0"
            placeholder="e.g. 2"
            value={cutaways}
            onChange={(e) => setCutaways(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="freefallTime">Freefall time before TrackR (optional)</Label>
          <Input
            id="freefallTime"
            type="text"
            placeholder="HH:MM:SS  e.g. 01:30:00"
            value={freefallTime}
            onChange={(e) => setFreefallTime(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Accumulated freefall total from before you started using TrackR.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={() => handleSubmit()} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Continue
          </Button>
          <Button
            variant="ghost"
            onClick={() => onNext()}
            disabled={saving}
            className="text-sm"
          >
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
