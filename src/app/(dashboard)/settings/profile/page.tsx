"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {

  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/useToast"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"


export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState({
    name: "",
    address: "",
    phone: "",
    licenseNumber: "",
    unitPreference: "IMPERIAL",
    currentJumpNumber: 1,
    startingFreefallTime: 0,
    startingCutaways: 0,
  })
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
    fetchAuditLogs()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user")
      const data = await res.json()
      setProfile({
        name: data.name || "",
        address: data.address || "",
        phone: data.phone || "",
        licenseNumber: data.licenseNumber || "",
        unitPreference: data.unitPreference || "IMPERIAL",
        currentJumpNumber: data.currentJumpNumber || 1,
        startingFreefallTime: data.startingFreefallTime || 0,
        startingCutaways: data.startingCutaways || 0,
      })
    } catch (error) {
      toast({ title: "Failed to load profile", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs?limit=20")
      if (!res.ok) throw new Error("Failed to fetch audit logs")
      const data = await res.json()
      setAuditLogs(data.data || [])
    } catch (error) {
      console.error("Failed to load audit logs:", error)
    } finally {
      setAuditLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          currentJumpNumber: parseInt(profile.currentJumpNumber.toString()),
          startingFreefallTime: parseInt(
            profile.startingFreefallTime.toString()
          ),
          startingCutaways: parseInt(profile.startingCutaways.toString()),
        }),
      })

      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "Profile updated" })
      fetchAuditLogs()
    } catch (error) {
      toast({ title: "Failed to save profile", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={profile.name}
              onChange={(e) =>
                setProfile({ ...profile, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={profile.phone}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={profile.address}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={profile.licenseNumber}
              onChange={(e) =>
                setProfile({ ...profile, licenseNumber: e.target.value })
              }
              placeholder="e.g., D-12345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPreference">Unit Preference</Label>
            <Select
              value={profile.unitPreference}
              onValueChange={(value) =>
                setProfile({ ...profile, unitPreference: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMPERIAL">Imperial (ft)</SelectItem>
                <SelectItem value="METRIC">Metric (m)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jump Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentJumpNumber">Current Jump Number</Label>
            <Input
              id="currentJumpNumber"
              type="number"
              min="1"
              value={profile.currentJumpNumber}
              onChange={(e) =>
                setProfile({ ...profile, currentJumpNumber: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Your next jump will be logged as jump {profile.currentJumpNumber + 1}
            </p>
          </div>

          {!auditLoading && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Jump Number History</Label>
              <div className="rounded-md border border-muted bg-muted/30 p-3 space-y-2 max-h-48 overflow-y-auto">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    No changes recorded
                  </p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="text-xs text-muted-foreground">
                      Changed from <span className="font-medium">{log.previousNumber}</span> to{" "}
                      <span className="font-medium">{log.newNumber}</span> on{" "}
                      {format(new Date(log.changedAt), "MMM d, yyyy 'at' h:mm a")}
                      {log.reason && (
                        <>
                          , Reason: <span className="italic">{log.reason}</span>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="startingFreefallTime">
              Starting Freefall Time (seconds)
            </Label>
            <Input
              id="startingFreefallTime"
              type="number"
              min="0"
              value={profile.startingFreefallTime}
              onChange={(e) =>
                setProfile({ ...profile, startingFreefallTime: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Total freefall time before using this app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startingCutaways">Starting Cutaways</Label>
            <Input
              id="startingCutaways"
              type="number"
              min="0"
              value={profile.startingCutaways}
              onChange={(e) =>
                setProfile({ ...profile, startingCutaways: parseInt(e.target.value) || 0 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Number of cutaways before using this app
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Changes
      </Button>
    </div>
  )
}
