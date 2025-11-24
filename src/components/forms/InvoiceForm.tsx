"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Combobox } from "@/components/ui/combobox"
import { Loader2, Plus, Trash2 } from "lucide-react"

interface InvoiceFormProps {
  initialData?: any
  onSuccess?: () => void
}

interface Dropzone {
  id: string
  name: string
  currency: string
  taxRate?: number
}

export function InvoiceForm({ initialData, onSuccess }: InvoiceFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dropzones, setDropzones] = useState<Dropzone[]>([])
  const [formData, setFormData] = useState({
    dropzoneId: initialData?.dropzoneId || "",
    invoiceNumber: initialData?.invoiceNumber || "",
    invoiceDate: initialData?.invoiceDate?.split("T")[0] || new Date().toISOString().split("T")[0],
    dueDate: initialData?.dueDate?.split("T")[0] || "",
    status: initialData?.status || "OPEN",
    notes: initialData?.notes || "",
  })

  useEffect(() => {
    fetchDropzones()
  }, [])

  const fetchDropzones = async () => {
    try {
      const res = await fetch("/api/dropzones?isActive=true")
      const data = await res.json()
      setDropzones(data.data || [])
    } catch (error) {
      console.error("Failed to fetch dropzones:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    alert("Invoice creation requires work jumps. Please create work jumps first, then generate invoices from the Invoices page.")
    router.push("/invoices")
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dropzoneId">Dropzone *</Label>
            <Combobox
              options={dropzones.map((dz) => ({
                value: dz.id,
                label: `${dz.name} (${dz.currency})`,
              }))}
              value={formData.dropzoneId}
              onValueChange={(value) =>
                setFormData({ ...formData, dropzoneId: value })
              }
              placeholder="Select dropzone"
              searchPlaceholder="Search dropzones..."
              emptyText="No dropzones found."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceNumber: e.target.value })
                }
                placeholder="INV-001"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceDate">Invoice Date *</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-md">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> Invoice creation from scratch requires work jumps with customer details.
          It's recommended to create work jumps first, then generate invoices from the Invoices list page.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Back to Invoices
        </Button>
      </div>
    </form>
  )
}
