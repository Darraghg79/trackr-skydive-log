"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/useToast"
import { Loader2, AlertTriangle } from "lucide-react"
import { secondsToHHMMSS, parseHHMMSSToSeconds } from "@/lib/utils/timeFormat"

export const dynamic = 'force-dynamic'

export default function JumpStatsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    currentJumpNumber: 1,
    startingFreefallTime: "00:00:00",
    startingCutaways: 0,
    reason: ""
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/user")
      const data = await res.json()

      setFormData({
        currentJumpNumber: data.currentJumpNumber || 1,
        startingFreefallTime: secondsToHHMMSS(data.startingFreefallTime || 0),
        startingCutaways: data.startingCutaways || 0,
        reason: ""
      })
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.reason.trim()) {
      toast({
        title: "Reason required",
        description: "Please provide a reason for changing these values",
        variant: "destructive"
      })
      return
    }

    setSaving(true)

    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentJumpNumber: parseInt(formData.currentJumpNumber.toString()),
          startingFreefallTime: parseHHMMSSToSeconds(formData.startingFreefallTime.toString()),
          startingCutaways: parseInt(formData.startingCutaways.toString()),
          reason: formData.reason
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update settings")
      }

      toast({
        title: "Settings updated",
        description: "Your jump statistics have been updated"
      })

      router.push("/settings")
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Jump Number & Statistics</h1>
        <p className="text-muted-foreground">
          Adjust your starting jump number, freefall time, and cutaway count
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 dark:text-amber-200">
              <p className="font-semibold mb-1">Important: Changes are audited</p>
              <p>All changes to these values are logged with your reason for auditing purposes. This helps maintain the integrity of your logbook.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Statistics</CardTitle>
          <CardDescription>
            Modify your jump statistics and provide a reason for the change
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="currentJumpNumber">Current Jump Number</Label>
              <Input
                id="currentJumpNumber"
                type="number"
                min="1"
                value={formData.currentJumpNumber}
                onChange={(e) =>
                  setFormData({ ...formData, currentJumpNumber: parseInt(e.target.value) || 1 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Your next logged jump will be this number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startingFreefallTime">Starting Freefall Time (HH:MM:SS)</Label>
              <Input
                id="startingFreefallTime"
                type="text"
                value={formData.startingFreefallTime}
                onChange={(e) =>
                  setFormData({ ...formData, startingFreefallTime: e.target.value })
                }
                placeholder="00:00:00 or 01:23 or 60"
                required
              />
              <p className="text-xs text-muted-foreground">
                Total freefall time from previous jumps - Enter as HH:MM:SS, MM:SS, or seconds
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startingCutaways">Starting Cutaway Count</Label>
              <Input
                id="startingCutaways"
                type="number"
                min="0"
                value={formData.startingCutaways}
                onChange={(e) =>
                  setFormData({ ...formData, startingCutaways: parseInt(e.target.value) || 0 })
                }
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of cutaways from previous jumps
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Change *</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Importing logbook from another system, correcting initial setup, etc."
                rows={3}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be recorded in the audit log
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
