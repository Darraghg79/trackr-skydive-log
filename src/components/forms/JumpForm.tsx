"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { DropzoneCombobox } from "@/components/ui/dropzone-combobox"
import { GearMultiselect } from "@/components/ui/gear-multiselect"
import { useToast } from "@/hooks/useToast"
import { Loader2, CheckCircle2 } from "lucide-react"
import { secondsToHHMMSS, parseHHMMSSToSeconds, isValidHHMMSS } from "@/lib/utils/timeFormat"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"

interface JumpFormProps {
  initialData?: any
  jumpId?: string
}

export function JumpForm({ initialData, jumpId }: JumpFormProps) {
  const [loading, setLoading] = useState(false)
  const [rigs, setRigs] = useState<any[]>([])
  const [gearComponents, setGearComponents] = useState<any[]>([])
  const [jumpTypes, setJumpTypes] = useState<any[]>([])
  const [aircrafts, setAircrafts] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)
  const [unitPreference, setUnitPreference] = useState<"METRIC" | "IMPERIAL">("IMPERIAL")
  const manuallyEditedFreefallTimeRef = useRef(false)

  const [formData, setFormData] = useState({
    jumpNumber: initialData?.jumpNumber ?? 1,
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    dropzoneId: initialData?.dropzoneId ?? "",
    aircraftId: initialData?.aircraftId ?? "",
    jumpTypeId: initialData?.jumpTypeId ?? "",
    rigId: initialData?.rigId ?? "",
    gearComponentIds: initialData?.gearComponents?.map((gc: any) => gc.gearComponentId) ?? [],
    exitAltitude: initialData?.exitAltitude ?? "",
    deploymentAltitude: initialData?.deploymentAltitude ?? "",
    freefallTime: initialData?.freefallTime !== undefined ? secondsToHHMMSS(initialData.freefallTime) : "",
    distanceToTarget: initialData?.distanceToTarget ?? "",
    isCutaway: initialData?.isCutaway ?? false,
    notes: initialData?.notes ?? "",
    isWorkJump: initialData?.isWorkJump ?? false,
    workJumpType: initialData?.workJumpType ?? "",
    customerName: initialData?.customerName ?? "",
    hasHandcam: initialData?.hasHandcam ?? false,
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchOptions = async () => {
    try {
      const timestamp = Date.now()
      const [rigRes, gearRes, jtRes, acRes, userRes] = await Promise.all([
        fetch(`/api/rigs?isActive=true&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/gear-components?isActive=true&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/user-jump-types?isActive=true&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/user-aircrafts?isActive=true&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/user?t=${timestamp}`, { cache: 'no-store' }),
      ])

      const [rigData, gearData, jtData, acData, userData] = await Promise.all([
        rigRes.json(),
        gearRes.json(),
        jtRes.json(),
        acRes.json(),
        userRes.json(),
      ])

      // Rigs come with rigComponents included from API
      setRigs(rigData.data || [])
      setGearComponents(gearData.data || [])
      setJumpTypes(jtData.data || [])
      setAircrafts(acData.data || [])
      setUserProfile(userData)

      // Set unit preference from user profile
      if (userData?.unitPreference) {
        setUnitPreference(userData.unitPreference)
      }

      // Always set the next jump number from server — whether new or copied jump
      // Only skip for EDIT mode (when jumpId is provided)
      if (!jumpId && userData?.currentJumpNumber) {
        setFormData((prev) => ({
          ...prev,
          jumpNumber: userData.currentJumpNumber + 1,
          // Only apply defaults for brand new jumps (not copies)
          ...(!initialData && {
            dropzoneId: userData.defaultDropzoneId || prev.dropzoneId,
            exitAltitude: userData.defaultExitAltitude || prev.exitAltitude,
            deploymentAltitude: userData.defaultDeploymentAltitude || prev.deploymentAltitude,
          }),
        }))
      }
    } catch (error) {
      console.error("Failed to fetch options:", error)
      toast({
        title: "Failed to load form options",
        description: "Please refresh the page to try again",
        variant: "destructive"
      })
    }
  }

  // Calculate freefall time based on exit and deployment altitudes
  const calculateFreefallTime = (
    exitAlt: number,
    deployAlt: number,
    unit: "IMPERIAL" | "METRIC"
  ): number => {
    const threshold = unit === "IMPERIAL" ? 1000 : 305
    const freefallDistance = exitAlt - deployAlt

    if (freefallDistance <= 0) return 0
    if (freefallDistance <= threshold) return 10

    const remainingDistance = freefallDistance - threshold
    const additionalIntervals = Math.floor(remainingDistance / threshold)
    const result = 10 + additionalIntervals * 5
    return result
  }

  // Auto-calculate freefall time when altitudes change
  useEffect(() => {
    const exitAlt = formData.exitAltitude
      ? parseInt(formData.exitAltitude.toString())
      : 0
    const deployAlt = formData.deploymentAltitude
      ? parseInt(formData.deploymentAltitude.toString())
      : 0

    if (exitAlt && deployAlt && exitAlt > deployAlt) {
      const calculatedSeconds = calculateFreefallTime(
        exitAlt,
        deployAlt,
        unitPreference
      )
      const calculatedTime = secondsToHHMMSS(calculatedSeconds)

      // Only auto-update if the user hasn't manually edited the field
      if (!manuallyEditedFreefallTimeRef.current) {
        setFormData((prev) => ({ ...prev, freefallTime: calculatedTime }))
      }
    }
  }, [formData.exitAltitude, formData.deploymentAltitude, unitPreference])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        jumpNumber: parseInt(formData.jumpNumber.toString()),
        exitAltitude: formData.exitAltitude
          ? parseInt(formData.exitAltitude.toString())
          : undefined,
        deploymentAltitude: formData.deploymentAltitude
          ? parseInt(formData.deploymentAltitude.toString())
          : undefined,
        freefallTime: formData.freefallTime
          ? parseHHMMSSToSeconds(formData.freefallTime.toString())
          : undefined,
        distanceToTarget: formData.distanceToTarget
          ? parseInt(formData.distanceToTarget.toString())
          : undefined,
        aircraftId: formData.aircraftId || undefined,
        jumpTypeId: formData.jumpTypeId || undefined,
        rigId: formData.rigId || undefined,
        gearComponentIds: formData.gearComponentIds.length > 0 ? formData.gearComponentIds : undefined,
        workJumpType: formData.isWorkJump ? formData.workJumpType : undefined,
        customerName: formData.isWorkJump ? formData.customerName : undefined,
        hasHandcam: formData.isWorkJump ? formData.hasHandcam : false,
      }

      const url = jumpId ? `/api/jumps/${jumpId}` : "/api/jumps"
      const method = jumpId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save jump")
      }

      toast({ title: jumpId ? "Jump updated" : "Jump logged successfully" })
      router.push("/jumps")
      router.refresh()
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Jump Number</Label>
          <div className="flex items-center h-10 px-3 py-2 border border-muted bg-muted/50 rounded-md">
            <span className="text-2xl font-bold text-primary">#{formData.jumpNumber}</span>
            <span className="ml-2 text-xs text-muted-foreground">(auto)</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            max={new Date().toISOString().split("T")[0]}
            required
          />
          <p className="text-xs text-muted-foreground">
            Cannot log jumps in the future
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dropzoneId">Dropzone *</Label>
          <DropzoneCombobox
            value={formData.dropzoneId}
            onValueChange={(value) =>
              setFormData({ ...formData, dropzoneId: value })
            }
            placeholder="Select dropzone..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="gearUsed">Gear Used</Label>
          <GearMultiselect
            rigs={rigs}
            gearComponents={gearComponents}
            selectedComponentIds={formData.gearComponentIds}
            onSelectionChange={(componentIds) =>
              setFormData({ ...formData, gearComponentIds: componentIds, rigId: "" })
            }
          />
          <p className="text-xs text-muted-foreground">
            Select a rig to use all its components, or pick individual items
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aircraftId">Aircraft</Label>
          <Select
            value={formData.aircraftId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, aircraftId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select aircraft" />
            </SelectTrigger>
            <SelectContent>
              {aircrafts.map((ac) => (
                <SelectItem key={ac.id} value={ac.id}>
                  {ac.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jumpTypeId">Jump Type</Label>
          <Select
            value={formData.jumpTypeId}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, jumpTypeId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select jump type" />
            </SelectTrigger>
            <SelectContent>
              {jumpTypes.map((jt) => (
                <SelectItem key={jt.id} value={jt.id}>
                  {jt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exitAltitude">Exit Altitude ({unitPreference === "METRIC" ? "m" : "ft"})</Label>
          <Input
            id="exitAltitude"
            type="number"
            min="0"
            value={formData.exitAltitude}
            onChange={(e) =>
              setFormData({ ...formData, exitAltitude: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deploymentAltitude">Deployment Altitude ({unitPreference === "METRIC" ? "m" : "ft"})</Label>
          <Input
            id="deploymentAltitude"
            type="number"
            min="0"
            value={formData.deploymentAltitude}
            onChange={(e) =>
              setFormData({ ...formData, deploymentAltitude: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="freefallTime">Freefall Time (HH:MM:SS)</Label>
          <Input
            id="freefallTime"
            type="text"
            value={formData.freefallTime}
            onChange={(e) => {
              manuallyEditedFreefallTimeRef.current = true
              setFormData({ ...formData, freefallTime: e.target.value })
            }}
            placeholder="00:00:45 or 01:23 or 60"
          />
          <p className="text-xs text-muted-foreground">
            Auto-calculated based on altitudes (you can override). Enter as HH:MM:SS, MM:SS, or seconds
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="distanceToTarget">
            Distance to Target ({unitPreference === "METRIC" ? "m" : "ft"})
          </Label>
          <Input
            id="distanceToTarget"
            type="number"
            min="0"
            value={formData.distanceToTarget}
            onChange={(e) =>
              setFormData({ ...formData, distanceToTarget: e.target.value })
            }
            placeholder="e.g., 10"
          />
          <p className="text-xs text-muted-foreground">
            Distance from planned landing target (accuracy measurement)
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isCutaway"
          checked={formData.isCutaway}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isCutaway: checked as boolean })
          }
        />
        <Label htmlFor="isCutaway">Cutaway</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isWorkJump"
          checked={formData.isWorkJump}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isWorkJump: checked as boolean })
          }
        />
        <Label htmlFor="isWorkJump">Work Jump (billable)</Label>
      </div>

      {formData.isWorkJump && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="workJumpType">Work Jump Type *</Label>
            <Select
              value={formData.workJumpType}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  workJumpType: value,
                  // Reset handcam if switching away from TANDEM
                  hasHandcam: value === "TANDEM" ? formData.hasHandcam : false
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AFF">AFF</SelectItem>
                <SelectItem value="TANDEM">Tandem</SelectItem>
                <SelectItem value="CAMERA">Camera</SelectItem>
                <SelectItem value="COACH">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
            />
          </div>

          {/* Only show handcam for tandem jumps */}
          {formData.workJumpType === "TANDEM" && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hasHandcam"
                checked={formData.hasHandcam}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, hasHandcam: checked as boolean })
                }
              />
              <Label htmlFor="hasHandcam">Has Handcam</Label>
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
        />
      </div>

      {/* Signature Display Section - Read Only */}
      {initialData?.signatures && initialData.signatures.length > 0 && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-lg">Signature</h3>
            </div>

            {initialData.signatures.map((signature: any) => (
              <div key={signature.id} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Signed by:</span>
                    <p className="font-medium">{signature.signerLicenseNumber}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>
                    <p className="font-medium">
                      {format(new Date(signature.createdAt), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                </div>

                <div className="border-2 border-muted rounded-lg bg-white p-4">
                  <img
                    src={signature.signatureImage}
                    alt="Instructor signature"
                    className="w-full max-h-[200px] object-contain"
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {jumpId ? "Update Jump" : "Log Jump"}
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
  )
}
