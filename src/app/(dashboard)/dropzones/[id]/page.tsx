"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DropzoneForm } from "@/components/forms/DropzoneForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Trash2, GitMerge, AlertTriangle, Loader2 } from "lucide-react"
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
  const [showMerge, setShowMerge] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkingJumps, setCheckingJumps] = useState(false)
  const [jumpCount, setJumpCount] = useState(0)
  const [otherDropzones, setOtherDropzones] = useState<any[]>([])
  const [mergeIntoId, setMergeIntoId] = useState<string>("")

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

  const fetchOtherDropzones = async () => {
    const res = await fetch("/api/dropzones?orderBy=name&order=asc")
    const data = await res.json()
    return (data.data || []).filter((dz: any) => dz.id !== params.id)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = async () => {
    setCheckingJumps(true)
    try {
      const [jumpsRes, others] = await Promise.all([
        fetch(`/api/jumps?dropzoneId=${params.id}&limit=1`),
        fetchOtherDropzones(),
      ])
      const jumpsData = await jumpsRes.json()
      const count = jumpsData.pagination?.total || 0
      setJumpCount(count)
      setOtherDropzones(others)

      if (count > 0) {
        if (others.length === 0) {
          toast({
            title: "Cannot delete",
            description: "This dropzone has jumps and you have no other dropzones to reassign to. Create another dropzone first.",
            variant: "destructive",
          })
          return
        }
        setMergeIntoId("")
        setShowMerge(true)
      } else {
        setShowDelete(true)
      }
    } catch {
      toast({ title: "Error", description: "Failed to check jump usage", variant: "destructive" })
    } finally {
      setCheckingJumps(false)
    }
  }

  // ── Merge ─────────────────────────────────────────────────────────────────
  const handleMergeClick = async () => {
    setCheckingJumps(true)
    try {
      const [jumpsRes, others] = await Promise.all([
        fetch(`/api/jumps?dropzoneId=${params.id}&limit=1`),
        fetchOtherDropzones(),
      ])
      const jumpsData = await jumpsRes.json()
      setJumpCount(jumpsData.pagination?.total || 0)
      setOtherDropzones(others)

      if (others.length === 0) {
        toast({
          title: "No other dropzones",
          description: "You need at least one other dropzone to merge into.",
          variant: "destructive",
        })
        return
      }
      setMergeIntoId("")
      setShowMerge(true)
    } catch {
      toast({ title: "Error", description: "Failed to load dropzones", variant: "destructive" })
    } finally {
      setCheckingJumps(false)
    }
  }

  // ── Execute delete / merge ────────────────────────────────────────────────
  const handleDelete = async (reassignTo?: string) => {
    setDeleting(true)
    try {
      const url = reassignTo
        ? `/api/dropzones/${params.id}?reassignToId=${reassignTo}`
        : `/api/dropzones/${params.id}`

      const res = await fetch(url, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Failed to delete dropzone",
          description: data.details || data.error || "An error occurred",
          variant: "destructive",
        })
        setDeleting(false)
        return
      }

      toast({
        title: reassignTo ? "Dropzone merged" : "Dropzone deleted",
        description: data.jumpsReassigned > 0
          ? `${data.jumpsReassigned} jump${data.jumpsReassigned !== 1 ? "s" : ""} reassigned`
          : undefined,
      })

      setShowDelete(false)
      setShowMerge(false)
      router.push("/dropzones")
      router.refresh()
    } catch {
      toast({ title: "Failed to delete dropzone", description: "An unexpected error occurred", variant: "destructive" })
      setDeleting(false)
    }
  }

  const handleMergeConfirm = () => {
    if (!mergeIntoId) {
      toast({ title: "Please select a dropzone", description: "Choose which dropzone to merge into", variant: "destructive" })
      return
    }
    handleDelete(mergeIntoId)
  }

  if (loading) return <PageLoader />
  if (!dropzone) return null

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit {dropzone.name}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMergeClick}
            disabled={checkingJumps}
          >
            {checkingJumps ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GitMerge className="h-4 w-4 mr-2" />
            )}
            Merge
          </Button>
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
      </div>

      <DropzoneForm initialData={dropzone} dropzoneId={params.id as string} />

      {/* Simple Delete Confirmation (no jumps) */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => handleDelete()}
        title="Delete Dropzone"
        description={`Are you sure you want to delete ${dropzone.name}? This action cannot be undone.`}
        loading={deleting}
      />

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" />
              Merge Dropzone
            </DialogTitle>
            <DialogDescription>
              All {jumpCount > 0 ? `${jumpCount} jump${jumpCount !== 1 ? "s" : ""} from` : "jumps from"}{" "}
              <strong>{dropzone.name}</strong> will be moved to the selected dropzone, then{" "}
              <strong>{dropzone.name}</strong> will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mergeInto">Merge into:</Label>
              <Select value={mergeIntoId} onValueChange={setMergeIntoId}>
                <SelectTrigger id="mergeInto">
                  <SelectValue placeholder="Select a dropzone" />
                </SelectTrigger>
                <SelectContent>
                  {otherDropzones.map((dz) => (
                    <SelectItem key={dz.id} value={dz.id}>
                      {dz.name}{dz.city ? ` — ${dz.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMerge(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleMergeConfirm} disabled={deleting || !mergeIntoId}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                "Merge & Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
