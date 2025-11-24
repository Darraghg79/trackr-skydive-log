"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

interface GearFormProps {
  initialData?: any
  gearId?: string
}

export function GearForm({ initialData, gearId }: GearFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: initialData?.type || "MAIN",
    name: initialData?.name || "",
    manufacturer: initialData?.manufacturer || "",
    model: initialData?.model || "",
    serialNumber: initialData?.serialNumber || "",
    previousJumpCount: initialData?.previousJumpCount || 0,
    serviceDate: initialData?.serviceDate
      ? new Date(initialData.serviceDate).toISOString().split("T")[0]
      : "",
    isActive: initialData?.isActive ?? true,
  })

  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        previousJumpCount: parseInt(formData.previousJumpCount.toString()),
        serviceDate: formData.serviceDate
          ? new Date(formData.serviceDate)
          : undefined,
      }

      const url = gearId
        ? `/api/gear-components/${gearId}`
        : "/api/gear-components"
      const method = gearId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save gear")
      }

      toast({
        title: gearId ? "Gear updated" : "Gear added",
      })
      router.push("/gear")
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
          <Label htmlFor="type">Type *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value,
                // Clear service date if switching away from RESERVE or AAD
                serviceDate:
                  value === "RESERVE" || value === "AAD"
                    ? formData.serviceDate
                    : "",
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MAIN">Main Canopy</SelectItem>
              <SelectItem value="RESERVE">Reserve Canopy</SelectItem>
              <SelectItem value="AAD">AAD</SelectItem>
              <SelectItem value="CONTAINER">Container</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., My Main"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manufacturer">Manufacturer *</Label>
          <Input
            id="manufacturer"
            value={formData.manufacturer}
            onChange={(e) =>
              setFormData({ ...formData, manufacturer: e.target.value })
            }
            placeholder="e.g., Performance Designs"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            placeholder="e.g., Sabre 3 170"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            value={formData.serialNumber}
            onChange={(e) =>
              setFormData({ ...formData, serialNumber: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="previousJumpCount">Previous Jump Count</Label>
          <Input
            id="previousJumpCount"
            type="number"
            min="0"
            value={formData.previousJumpCount}
            onChange={(e) =>
              setFormData({ ...formData, previousJumpCount: e.target.value })
            }
          />
        </div>

        {/* Only show service date for Reserve and AAD */}
        {(formData.type === "RESERVE" || formData.type === "AAD") && (
          <div className="space-y-2">
            <Label htmlFor="serviceDate">Next Service Date</Label>
            <Input
              id="serviceDate"
              type="date"
              value={formData.serviceDate}
              onChange={(e) =>
                setFormData({ ...formData, serviceDate: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              {formData.type === "RESERVE"
                ? "Next repack due"
                : "Next AAD service due"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked as boolean })
          }
        />
        <Label htmlFor="isActive">Active</Label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {gearId ? "Update Gear" : "Add Gear"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
