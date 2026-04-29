"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QuickEditNameModal } from "@/components/jumps/QuickEditNameModal"
import { Pencil, AlertCircle } from "lucide-react"

export interface QuickEditJump {
  id: string
  jumpNumber: number
  customerName: string | null
  jumpTypeId: string | null
  hasHandcam: boolean
  workJumpType: string | null
  isWorkJump: boolean
}

export interface QuickEditChange {
  customerName?: string | null
  jumpTypeId?: string | null
  hasHandcam?: boolean
}

export interface JumpType {
  id: string
  name: string
}

interface QuickEditRowProps {
  jump: QuickEditJump
  jumpTypes: JumpType[]
  pending: QuickEditChange | undefined
  failed: boolean
  onChange: (jumpId: string, change: QuickEditChange) => void
}

export function QuickEditRow({
  jump,
  jumpTypes,
  pending,
  failed,
  onChange,
}: QuickEditRowProps) {
  const [nameModalOpen, setNameModalOpen] = useState(false)

  // Resolved display values — pending edits take priority over original
  const displayName =
    pending && 'customerName' in pending ? pending.customerName : jump.customerName
  const displayJumpTypeId =
    pending && 'jumpTypeId' in pending ? pending.jumpTypeId : jump.jumpTypeId
  const displayHandcam =
    pending && 'hasHandcam' in pending ? pending.hasHandcam! : jump.hasHandcam

  const isTandem = jump.workJumpType === 'TANDEM'
  const isDirty = pending !== undefined

  const handleNameSave = (name: string) => {
    onChange(jump.id, { ...pending, customerName: name || null })
  }

  const handleJumpTypeChange = (typeId: string) => {
    onChange(jump.id, { ...pending, jumpTypeId: typeId === '__none__' ? null : typeId })
  }

  const handleHandcamChange = (checked: boolean) => {
    onChange(jump.id, { ...pending, hasHandcam: checked })
  }

  return (
    <>
      <Card className={`transition-colors ${isDirty ? 'border-primary/50' : ''} ${failed ? 'border-destructive' : ''}`}>
        <CardContent className="p-4">
          {failed && (
            <div className="flex items-center gap-2 text-destructive text-sm mb-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>Save failed — retry or discard</span>
            </div>
          )}
          <div className="flex items-start gap-3">
            {/* Jump number */}
            <div className="text-xl font-bold text-primary min-w-[3.5rem]">
              #{jump.jumpNumber}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Customer name row */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate flex-1">
                  {displayName || <span className="text-muted-foreground italic">No customer</span>}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 flex-shrink-0"
                  onClick={() => setNameModalOpen(true)}
                  title="Edit customer name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Jump type + handcam row */}
              <div className="flex items-center gap-3 flex-wrap">
                <Select
                  value={displayJumpTypeId ?? '__none__'}
                  onValueChange={handleJumpTypeChange}
                >
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Jump type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      <span className="text-muted-foreground">No type</span>
                    </SelectItem>
                    {jumpTypes.map((jt) => (
                      <SelectItem key={jt.id} value={jt.id}>
                        {jt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Handcam toggle — tandem work jumps only */}
                {isTandem && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`handcam-${jump.id}`}
                      checked={displayHandcam}
                      onCheckedChange={(v) => handleHandcamChange(v === true)}
                    />
                    <Label
                      htmlFor={`handcam-${jump.id}`}
                      className="text-sm cursor-pointer"
                    >
                      Handcam
                    </Label>
                  </div>
                )}

                {/* Dirty indicator badge */}
                {isDirty && (
                  <Badge variant="outline" className="text-xs ml-auto">
                    edited
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <QuickEditNameModal
        open={nameModalOpen}
        currentName={displayName ?? ''}
        jumpNumber={jump.jumpNumber}
        onSave={handleNameSave}
        onClose={() => setNameModalOpen(false)}
      />
    </>
  )
}
