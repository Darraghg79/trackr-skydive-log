"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/hooks/useToast"
import { Loader2 } from "lucide-react"
import { secondsToHHMMSS, parseHHMMSSToSeconds, isValidHHMMSS } from "@/lib/utils/timeFormat"

interface JumpFormProps {
  initialData?: any
  jumpId?: string
}

export function JumpForm({ initialData, jumpId }: JumpFormProps) {
  const [loading, setLoading] = useState(false)
  const [dropzones, setDropzones] = useState<any[]>([])
  const [rigs, setRigs] = useState<any[]>([])
  const [jumpTypes, setJumpTypes] = useState<any[]>([])
  const [aircrafts, setAircrafts] = useState<any[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  const [formData, setFormData] = useState({
    jumpNumber: initialData?.jumpNumber || 1,
    date: initialData?.date
      ? new Date(initialData.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    dropzoneId: initialData?.dropzoneId || "",
    aircraftId: initialData?.aircraftId || "",
    jumpTypeId: initialData?.jumpTypeId || "",
    rigId: initialData?.rigId || "",
    exitAltitude: initialData?.exitAltitude || "",
    deploymentAltitude: initialData?.deploymentAltitude || "",
    freefallTime: initialData?.freefallTime ? secondsToHHMMSS(initialData.freefallTime) : "",
    isCutaway: initialData?.isCutaway || false,
    notes: initialData?.notes || "",
    isWorkJump: initialData?.isWorkJump || false,
    workJumpType: initialData?.workJumpType || "",
    customerName: initialData?.customerName || "",
    hasHandcam: initialData?.hasHandcam || false,
  })

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const [dzRes, rigRes, jtRes, acRes, userRes] = await Promise.all([
        fetch("/api/dropzones?isActive=true"),
        fetch("/api/rigs?isActive=true"),
        fetch("/api/user-jump-types?isActive=true"),
        fetch("/api/user-aircrafts?isActive=true"),
        fetch("/api/user"),
      ])

      const [dzData, rigData, jtData, acData, userData] = await Promise.all([
        dzRes.json(),
        rigRes.json(),
        jtRes.json(),
        acRes.json(),
        userRes.json(),
      ])

      setDropzones(dzData.data || [])
      setRigs(rigData.data || [])
      setJumpTypes(jtData.data || [])
      setAircrafts(acData.data || [])
      setUserProfile(userData)

      if (!initialData && userData?.currentJumpNumber) {
        setFormData((prev) => ({
          ...prev,
          jumpNumber: userData.currentJumpNumber,
        }))
      }
    } catch (error) {
      console.error("Failed to fetch options:", error)
    }
  }

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
        aircraftId: formData.aircraftId || undefined,
        jumpTypeId: formData.jumpTypeId || undefined,
        rigId: formData.rigId || undefined,
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
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dropzoneId">Dropzone *</Label>
          <Select
            value={formData.dropzoneId}
            onValueChange={(value) =>
              setFormData({ ...formData, dropzoneId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select dropzone" />
            </SelectTrigger>
            <SelectContent>
              {dropzones.map((dz) => (
                <SelectItem key={dz.id} value={dz.id}>
                  {dz.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rigId">Rig</Label>
          <Select
            value={formData.rigId}
            onValueChange={(value) =>
              setFormData({ ...formData, rigId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select rig" />
            </SelectTrigger>
            <SelectContent>
              {rigs.map((rig) => (
                <SelectItem key={rig.id} value={rig.id}>
                  {rig.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="aircraftId">Aircraft</Label>
          <Select
            value={formData.aircraftId}
            onValueChange={(value) =>
              setFormData({ ...formData, aircraftId: value })
            }
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
            onValueChange={(value) =>
              setFormData({ ...formData, jumpTypeId: value })
            }
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
          <Label htmlFor="exitAltitude">Exit Altitude (ft)</Label>
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
          <Label htmlFor="deploymentAltitude">Deployment Altitude (ft)</Label>
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
            onChange={(e) =>
              setFormData({ ...formData, freefallTime: e.target.value })
            }
            placeholder="00:00:45 or 01:23 or 60"
          />
          <p className="text-sm text-muted-foreground">
            Enter as HH:MM:SS, MM:SS, or seconds
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
                setFormData({ ...formData, workJumpType: value })
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
