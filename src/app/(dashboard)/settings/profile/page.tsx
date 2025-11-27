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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/useToast"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Loader2, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"


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
    taxRegistrationNumber: "",
    remittanceDetails: "",
    defaultDropzoneId: null as string | null,
    defaultExitAltitude: null as number | null,
    defaultDeploymentAltitude: null as number | null,
  })
  const [dropzones, setDropzones] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [deleting, setDeleting] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchProfile()
    fetchAuditLogs()
    fetchDropzones()
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
        taxRegistrationNumber: data.taxRegistrationNumber || "",
        remittanceDetails: data.remittanceDetails || "",
        defaultDropzoneId: data.defaultDropzoneId || null,
        defaultExitAltitude: data.defaultExitAltitude || null,
        defaultDeploymentAltitude: data.defaultDeploymentAltitude || null,
      })
    } catch (error) {
      toast({ title: "Failed to load profile", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const fetchDropzones = async () => {
    try {
      const res = await fetch("/api/dropzones?limit=1000")
      const data = await res.json()
      setDropzones(data.data || [])
    } catch (error) {
      console.error("Failed to load dropzones:", error)
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
          defaultDropzoneId: profile.defaultDropzoneId || null,
          defaultExitAltitude: profile.defaultExitAltitude ? parseInt(profile.defaultExitAltitude.toString()) : null,
          defaultDeploymentAltitude: profile.defaultDeploymentAltitude ? parseInt(profile.defaultDeploymentAltitude.toString()) : null,
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmation.toLowerCase() !== "delete") {
      toast({
        title: "Confirmation required",
        description: 'Please type "delete" to confirm account deletion',
        variant: "destructive",
      })
      return
    }

    setDeleting(true)
    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete account")

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted",
      })

      // Sign out and redirect to home
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/")
    } catch (error) {
      toast({
        title: "Failed to delete account",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeleteConfirmation("")
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
          <CardTitle>Invoice Information (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="taxRegistrationNumber">Tax Registration Number</Label>
            <Input
              id="taxRegistrationNumber"
              value={profile.taxRegistrationNumber}
              onChange={(e) =>
                setProfile({ ...profile, taxRegistrationNumber: e.target.value })
              }
              placeholder="e.g., VAT123456789"
            />
            <p className="text-xs text-muted-foreground">
              Optional - for invoice generation if required
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remittanceDetails">Remittance Details</Label>
            <Textarea
              id="remittanceDetails"
              value={profile.remittanceDetails}
              onChange={(e) =>
                setProfile({ ...profile, remittanceDetails: e.target.value })
              }
              rows={4}
              placeholder="e.g., Bank: XYZ Bank, Account: 12345678, Sort Code: 12-34-56"
            />
            <p className="text-xs text-muted-foreground">
              Optional - bank details for payment if required
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Jump Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultDropzone">Default Dropzone</Label>
            <Select
              value={profile.defaultDropzoneId || "none"}
              onValueChange={(value) =>
                setProfile({ ...profile, defaultDropzoneId: value === "none" ? null : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select default dropzone (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {dropzones.map((dz) => (
                  <SelectItem key={dz.id} value={dz.id}>
                    {dz.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pre-fill new jumps with this dropzone
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultExitAltitude">
              Default Exit Altitude ({profile.unitPreference === "METRIC" ? "m" : "ft"})
            </Label>
            <Input
              id="defaultExitAltitude"
              type="number"
              min="0"
              value={profile.defaultExitAltitude || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  defaultExitAltitude: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="e.g., 14000"
            />
            <p className="text-xs text-muted-foreground">
              Pre-fill new jumps with this exit altitude
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultDeploymentAltitude">
              Default Deployment Altitude ({profile.unitPreference === "METRIC" ? "m" : "ft"})
            </Label>
            <Input
              id="defaultDeploymentAltitude"
              type="number"
              min="0"
              value={profile.defaultDeploymentAltitude || ""}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  defaultDeploymentAltitude: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              placeholder="e.g., 3500"
            />
            <p className="text-xs text-muted-foreground">
              Pre-fill new jumps with this deployment altitude
            </p>
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

      <Card className="border-destructive">
        <CardHeader className="bg-destructive/10">
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Delete Account</p>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data including jumps,
              dropzones, aircraft, gear, and settings. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="mt-4"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account Permanently
            </DialogTitle>
            <DialogDescription>
              This will permanently delete your account and all associated data.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-mono font-bold">delete</span> to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type delete here"
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setDeleteConfirmation("")
              }}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmation.toLowerCase() !== "delete"}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
