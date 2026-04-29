"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QuickEditNameModalProps {
  open: boolean
  currentName: string
  jumpNumber: number
  onSave: (name: string) => void
  onClose: () => void
}

export function QuickEditNameModal({
  open,
  currentName,
  jumpNumber,
  onSave,
  onClose,
}: QuickEditNameModalProps) {
  const [name, setName] = useState(currentName)

  // Sync local state when modal is opened for a different jump
  useEffect(() => {
    if (open) setName(currentName)
  }, [open, currentName])

  const handleSave = () => {
    onSave(name.trim())
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Customer — Jump #{jumpNumber}</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          <Label htmlFor="customer-name" className="mb-2 block">Customer name</Label>
          <Input
            id="customer-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onClose()
            }}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
