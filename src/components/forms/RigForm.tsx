"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface RigFormProps {
  initialData?: {
    id: string
    name: string
    isActive: boolean
    rigComponents?: Array<{ gearComponentId: string }>
  }
  onSuccess?: () => void
}

interface GearComponent {
  id: string
  name: string
  manufacturer: string
  type: string
}

export function RigForm({ initialData, onSuccess }: RigFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gearComponents, setGearComponents] = useState<GearComponent[]>([])
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    isActive: initialData?.isActive ?? true,
    componentIds: initialData?.rigComponents?.map((rc) => rc.gearComponentId) || [],
  })

  useEffect(() => {
    fetchGearComponents()
  }, [])

  const fetchGearComponents = async () => {
    try {
      const res = await fetch("/api/gear-components?isActive=true")
      const data = await res.json()
      setGearComponents(data.data || [])
    } catch (error) {
      console.error("Failed to fetch gear components:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = initialData
        ? `/api/rigs/${initialData.id}`
        : "/api/rigs"
      const method = initialData ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error("Failed to save rig")

      onSuccess?.()
      router.push("/rigs")
      router.refresh()
    } catch (error) {
      console.error("Error saving rig:", error)
      alert("Failed to save rig")
    } finally {
      setLoading(false)
    }
  }

  const toggleComponent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      componentIds: prev.componentIds.includes(id)
        ? prev.componentIds.filter((cid) => cid !== id)
        : [...prev.componentIds, id],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="name">Rig Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Vector 3"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: !!checked })
              }
            />
            <Label htmlFor="isActive" className="font-normal">
              Active
            </Label>
          </div>
        </CardContent>
      </Card>

      {gearComponents.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <Label className="mb-3 block">Gear Components</Label>
            <div className="space-y-2">
              {gearComponents.map((component) => (
                <div key={component.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={component.id}
                    checked={formData.componentIds.includes(component.id)}
                    onCheckedChange={() => toggleComponent(component.id)}
                  />
                  <Label htmlFor={component.id} className="font-normal">
                    <span className="font-medium">{component.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({component.type} - {component.manufacturer})
                    </span>
                  </Label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? "Update Rig" : "Create Rig"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
