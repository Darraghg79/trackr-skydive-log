"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DropzoneForm } from "@/components/forms/DropzoneForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
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

export default function DropzoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dropzone, setDropzone] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkingJumps, setCheckingJumps] = useState(false)
  const [jumpCount, setJumpCount] = useState(0)
  const [otherDropzones, setOtherDropzones] = useState<any[]>([])
  const [reassignToId, setReassignToId] = useState<string>("")

  useEffect(() => {
    fetchDropzone()
  }, [params.id])

  const fetchDropzone = async () => {
    try {
      const res = await fetch(`/api/dropzones/${params.id}`)
      if (!res.ok) throw new Error("Dropzone not found")
      const data = await res.json()
      setDropzone(data)
    } catch (error) {
      toast({ title: "Failed to load dropzone", variant: "destructive" })
      router.push("/dropzones")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = async () => {
    setCheckingJumps(true)
    try {
      // Check if any jumps use this dropzone
      const [jumpsRes, dropzonesRes] = await Promise.all([
        fetch(`/api/jumps?dropzoneId=${params.id}`),
        fetch("/api/dropzones?orderBy=name&order=asc")
      ])

      const jumpsData = await jumpsRes.json()
      const dropzonesData = await dropzonesRes.json()

      const count = jumpsData.pagination?.total || 0
      setJumpCount(count)

      if (count > 0) {
        // Filter out the current dropzone from the list
        const others = (dropzonesData.data || []).filter((dz: any) => dz.id !== params.id)
        setOtherDropzones(others)

        if (others.length === 0) {
          toast({
            title: "Cannot delete",
            description: "This dropzone is used by jumps and you have no other dropzones to reassign to. Create another dropzone first.",
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
        ? `/api/dropzones/${params.id}?reassignToId=${reassignTo}`
        : `/api/dropzones/${params.id}`

      const res = await fetch(url, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      const data = await res.json()

      toast({
        title: "Dropzone deleted",
        description: data.jumpsReassigned > 0
          ? `${data.jumpsReassigned} jumps were reassigned`
          : undefined
      })

      router.push("/dropzones")
      router.refresh()
    } catch (error) {
      console.error("Error deleting dropzone:", error)
      toast({
        title: "Failed to delete dropzone",
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
        title: "Please select a dropzone",
        description: "Choose which dropzone to reassign jumps to",
        variant: "destructive"
      })
      return
    }
    handleDelete(reassignToId)
  }

  if (loading) {
    return <PageLoader />
  }

  if (!dropzone) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit {dropzone.name}</h1>
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

      <DropzoneForm initialData={dropzone} dropzoneId={params.id as string} />

      {/* Simple Delete Confirmation (no jumps using this dropzone) */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => handleDelete()}
        title="Delete Dropzone"
        description={`Are you sure you want to delete ${dropzone.name}? This action cannot be undone.`}
        loading={deleting}
      />

      {/* Reassignment Dialog (jumps are using this dropzone) */}
      <Dialog open={showReassign} onOpenChange={setShowReassign}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reassign Jumps
            </DialogTitle>
            <DialogDescription>
              This dropzone is used by {jumpCount} jump{jumpCount !== 1 ? "s" : ""}.
              Please select another dropzone to reassign them to before deleting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reassignTo">Reassign jumps to:</Label>
              <Select value={reassignToId} onValueChange={setReassignToId}>
                <SelectTrigger id="reassignTo">
                  <SelectValue placeholder="Select a dropzone" />
                </SelectTrigger>
                <SelectContent>
                  {otherDropzones.map((dz) => (
                    <SelectItem key={dz.id} value={dz.id}>
                      {dz.name} ({dz.city || dz.country})
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
