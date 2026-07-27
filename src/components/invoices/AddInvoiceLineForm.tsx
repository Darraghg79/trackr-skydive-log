"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatCurrency } from "@/lib/utils/currencyFormat"

export interface AdhocLineFormValues {
  description: string
  quantity: number
  unitPrice: number
}

interface AddInvoiceLineFormProps {
  currency: string
  title: string
  trigger: React.ReactNode
  initialValues?: AdhocLineFormValues
  onSubmit: (values: AdhocLineFormValues) => Promise<void>
}

const DEFAULT_VALUES: AdhocLineFormValues = { description: "", quantity: 1, unitPrice: 0 }

export function AddInvoiceLineForm({
  currency,
  title,
  trigger,
  initialValues,
  onSubmit,
}: AddInvoiceLineFormProps) {
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState(initialValues?.description ?? DEFAULT_VALUES.description)
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? DEFAULT_VALUES.quantity)
  const [unitPrice, setUnitPrice] = useState(initialValues?.unitPrice ?? DEFAULT_VALUES.unitPrice)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setDescription(initialValues?.description ?? DEFAULT_VALUES.description)
      setQuantity(initialValues?.quantity ?? DEFAULT_VALUES.quantity)
      setUnitPrice(initialValues?.unitPrice ?? DEFAULT_VALUES.unitPrice)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const lineTotal = (Number(quantity) || 0) * (Number(unitPrice) || 0)
  const isValid = description.trim().length > 0 && Number(quantity) >= 1

  const handleSubmit = async () => {
    if (!isValid) return
    setSubmitting(true)
    try {
      await onSubmit({
        description: description.trim(),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice),
      })
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="adhoc-description">Description</Label>
            <Input
              id="adhoc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              placeholder="e.g. Talk-down, Kit hire, Loyalty discount"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adhoc-quantity">Qty</Label>
              <Input
                id="adhoc-quantity"
                type="number"
                min={1}
                step={1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adhoc-unit-price">Unit Price</Label>
              <Input
                id="adhoc-unit-price"
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value))}
                placeholder="Negative for a discount"
              />
            </div>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-muted-foreground">Line total</span>
            <span className={lineTotal < 0 ? "text-red-600 font-medium" : "font-medium"}>
              {formatCurrency(lineTotal, currency)}
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !isValid}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
