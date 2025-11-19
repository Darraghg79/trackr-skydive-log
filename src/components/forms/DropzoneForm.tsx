"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/useToast"
import { Loader2 } from "lucide-react"

interface DropzoneFormProps {
  initialData?: any
  dropzoneId?: string
}

export function DropzoneForm({ initialData, dropzoneId }: DropzoneFormProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    city: initialData?.city || "",
    address: initialData?.address || "",
    country: initialData?.country || "",
    contactName: initialData?.contactName || "",
    contactEmail: initialData?.contactEmail || "",
    currency: initialData?.currency || "",
    rateAFF: initialData?.rateAFF || "",
    rateTandem: initialData?.rateTandem || "",
    rateCamera: initialData?.rateCamera || "",
    rateCoach: initialData?.rateCoach || "",
    rateHandcam: initialData?.rateHandcam || "",
    taxRate: initialData?.taxRate || "",
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
        rateAFF: formData.rateAFF ? parseFloat(formData.rateAFF) : undefined,
        rateTandem: formData.rateTandem
          ? parseFloat(formData.rateTandem)
          : undefined,
        rateCamera: formData.rateCamera
          ? parseFloat(formData.rateCamera)
          : undefined,
        rateCoach: formData.rateCoach
          ? parseFloat(formData.rateCoach)
          : undefined,
        rateHandcam: formData.rateHandcam
          ? parseFloat(formData.rateHandcam)
          : undefined,
        taxRate: formData.taxRate ? parseFloat(formData.taxRate) : undefined,
      }

      const url = dropzoneId
        ? `/api/dropzones/${dropzoneId}`
        : "/api/dropzones"
      const method = dropzoneId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to save dropzone")
      }

      toast({
        title: dropzoneId ? "Dropzone updated" : "Dropzone added",
      })
      router.push("/dropzones")
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
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name">Dropzone Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) =>
              setFormData({ ...formData, city: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            value={formData.currency}
            onChange={(e) =>
              setFormData({ ...formData, currency: e.target.value.toUpperCase() })
            }
            maxLength={3}
            placeholder="USD, EUR, GBP, etc."
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            value={formData.contactName}
            onChange={(e) =>
              setFormData({ ...formData, contactName: e.target.value })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={(e) =>
              setFormData({ ...formData, contactEmail: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Billing Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rateAFF">AFF Rate</Label>
            <Input
              id="rateAFF"
              type="number"
              step="0.01"
              min="0"
              value={formData.rateAFF}
              onChange={(e) =>
                setFormData({ ...formData, rateAFF: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateTandem">Tandem Rate</Label>
            <Input
              id="rateTandem"
              type="number"
              step="0.01"
              min="0"
              value={formData.rateTandem}
              onChange={(e) =>
                setFormData({ ...formData, rateTandem: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateCamera">Camera Rate</Label>
            <Input
              id="rateCamera"
              type="number"
              step="0.01"
              min="0"
              value={formData.rateCamera}
              onChange={(e) =>
                setFormData({ ...formData, rateCamera: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateCoach">Coach Rate</Label>
            <Input
              id="rateCoach"
              type="number"
              step="0.01"
              min="0"
              value={formData.rateCoach}
              onChange={(e) =>
                setFormData({ ...formData, rateCoach: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rateHandcam">Handcam Addon</Label>
            <Input
              id="rateHandcam"
              type="number"
              step="0.01"
              min="0"
              value={formData.rateHandcam}
              onChange={(e) =>
                setFormData({ ...formData, rateHandcam: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) =>
                setFormData({ ...formData, taxRate: e.target.value })
              }
            />
          </div>
        </div>
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
          {dropzoneId ? "Update Dropzone" : "Add Dropzone"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
