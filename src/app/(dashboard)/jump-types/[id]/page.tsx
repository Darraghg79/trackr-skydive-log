"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserJumpTypeForm } from "@/components/forms/UserJumpTypeForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"

export default function JumpTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [jumpType, setJumpType] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkingJumps, setCheckingJumps] = useState(false)
  const [jumpCount, setJumpCount] = useState(0)
  const [otherJumpTypes, setOtherJumpTypes] = useState<any[]>([])
  const [reassignToId, setReassignToId] = useState<string>("")

  useEffect(() => {
    if (params.id) {
      fetchJumpType()
    }
  }, [params.id])

  const fetchJumpType = async () => {
    try {
      const res = await fetch(`/api/user-jump-types/${params.id}`)
      if (!res.ok) throw new Error("Jump type not found")
      const data = await res.json()
      setJumpType(data)
    } catch (error) {
      console.error("Failed to fetch jump type:", error)
      router.push("/jump-types")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = async () => {
    setCheckingJumps(true)
    try {
      // Check if any jumps use this jump type
      const [jumpsRes, jumpTypesRes] = await Promise.all([
        fetch(`/api/jumps?jumpTypeId=${params.id}`),
        fetch("/api/user-jump-types")
      ])

      const jumpsData = await jumpsRes.json()
      const jumpTypesData = await jumpTypesRes.json()

      const count = jumpsData.pagination?.total || 0
      setJumpCount(count)

      if (count > 0) {
        // Filter out the current jump type from the list
        const others = (jumpTypesData.data || []).filter((jt: any) => jt.id !== params.id)
        setOtherJumpTypes(others)

        if (others.length === 0) {
          toast({
            title: "Cannot delete",
            description: "This jump type is used by jumps and you have no other jump types to reassign to. Create another jump type first.",
            variant: "destructive"
          })
          return
        }

        // Show reassignment dialog
        setShowReassign(true)
      } else {
        // No jumps use this, show simple confirmation
        setShowDelete(true)
      }
    } catch (error) {
      console.error("Failed to check jumps:", error)
      toast({
        title: "Error",
        description: "Failed to check jump usage",
        variant: "destructive"
      })
    } finally {
      setCheckingJumps(false)
    }
  }

  const handleDelete = async (reassignTo?: string) => {
    setDeleting(true)
    try {
      const url = reassignTo
        ? `/api/user-jump-types/${params.id}?reassignToId=${reassignTo}`
        : `/api/user-jump-types/${params.id}`

      const res = await fetch(url, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      const data = await res.json()

      toast({
        title: "Jump type deleted",
        description: data.jumpsReassigned > 0
          ? `${data.jumpsReassigned} jumps were reassigned`
          : undefined
      })

      router.push("/jump-types")
      router.refresh()
    } catch (error) {
      console.error("Error deleting jump type:", error)
      toast({
        title: "Failed to delete jump type",
        variant: "destructive"
      })
    } finally {
      setDeleting(false)
      setShowDelete(false)
      setShowReassign(false)
    }
  }

  const handleReassignAndDelete = () => {
    if (!reassignToId) {
      toast({
        title: "Please select a jump type",
        description: "Choose which jump type to reassign jumps to",
        variant: "destructive"
      })
      return
    }
    handleDelete(reassignToId)
  }

  if (loading) {
    return <PageLoader />
  }

  if (!jumpType) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Jump Type</h1>
          <p className="text-muted-foreground">Update jump type settings</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDeleteClick}
          disabled={checkingJumps}
        >
          {checkingJumps ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Delete
        </Button>
      </div>

      <UserJumpTypeForm initialData={jumpType} />

      {/* Simple Delete Confirmation (no jumps using this type) */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => handleDelete()}
        title="Delete Jump Type"
        description="Are you sure you want to delete this jump type? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* Reassignment Dialog (jumps are using this type) */}
      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reassign Jumps
            </DialogTitle>
            <DialogDescription>
              This jump type is used by {jumpCount} jump{jumpCount !== 1 ? "s" : ""}.
              Please select another jump type to reassign them to before deleting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reassignTo">Reassign jumps to:</Label>
              <Select value={reassignToId} onValueChange={setReassignToId}>
                <SelectTrigger id="reassignTo">
                  <SelectValue placeholder="Select a jump type" />
                </SelectTrigger>
                <SelectContent>
                  {otherJumpTypes.map((jt) => (
                    <SelectItem key={jt.id} value={jt.id}>
                      {jt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReassign(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReassignAndDelete}
              disabled={deleting || !reassignToId}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Reassign & Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
