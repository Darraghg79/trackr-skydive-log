"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserJumpTypeForm } from "@/components/forms/UserJumpTypeForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2, GitMerge, Loader2 } from "lucide-react"
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
  const [showMerge, setShowMerge] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkingJumps, setCheckingJumps] = useState(false)
  const [jumpCount, setJumpCount] = useState(0)
  const [otherJumpTypes, setOtherJumpTypes] = useState<any[]>([])
  const [mergeIntoId, setMergeIntoId] = useState<string>("")

  useEffect(() => {
    if (params.id) fetchJumpType()
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

  const fetchOtherJumpTypes = async () => {
    const res = await fetch("/api/user-jump-types")
    const data = await res.json()
    return (data.data || []).filter((jt: any) => jt.id !== params.id)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = async () => {
    setCheckingJumps(true)
    try {
      const [jumpsRes, others] = await Promise.all([
        fetch(`/api/jumps?jumpTypeId=${params.id}&limit=1`),
        fetchOtherJumpTypes(),
      ])
      const jumpsData = await jumpsRes.json()
      const count = jumpsData.pagination?.total || 0
      setJumpCount(count)
      setOtherJumpTypes(others)

      if (count > 0) {
        if (others.length === 0) {
          toast({
            title: "Cannot delete",
            description: "This jump type is used by jumps and you have no other jump types to reassign to. Create another jump type first.",
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
        fetch(`/api/jumps?jumpTypeId=${params.id}&limit=1`),
        fetchOtherJumpTypes(),
      ])
      const jumpsData = await jumpsRes.json()
      setJumpCount(jumpsData.pagination?.total || 0)
      setOtherJumpTypes(others)

      if (others.length === 0) {
        toast({
          title: "No other jump types",
          description: "You need at least one other jump type to merge into.",
          variant: "destructive",
        })
        return
      }
      setMergeIntoId("")
      setShowMerge(true)
    } catch {
      toast({ title: "Error", description: "Failed to load jump types", variant: "destructive" })
    } finally {
      setCheckingJumps(false)
    }
  }

  // ── Execute delete / merge ────────────────────────────────────────────────
  const handleDelete = async (reassignTo?: string) => {
    setDeleting(true)
    try {
      const url = reassignTo
        ? `/api/user-jump-types/${params.id}?reassignToId=${reassignTo}`
        : `/api/user-jump-types/${params.id}`

      const res = await fetch(url, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Failed to delete jump type",
          description: data.details || data.error || "An error occurred",
          variant: "destructive",
        })
        setDeleting(false)
        return
      }

      toast({
        title: reassignTo ? "Jump type merged" : "Jump type deleted",
        description: data.jumpsReassigned > 0
          ? `${data.jumpsReassigned} jump${data.jumpsReassigned !== 1 ? "s" : ""} reassigned`
          : undefined,
      })

      setShowDelete(false)
      setShowMerge(false)
      router.push("/jump-types")
      router.refresh()
    } catch {
      toast({ title: "Failed to delete jump type", description: "An unexpected error occurred", variant: "destructive" })
      setDeleting(false)
    }
  }

  const handleMergeConfirm = () => {
    if (!mergeIntoId) {
      toast({ title: "Please select a jump type", description: "Choose which jump type to merge into", variant: "destructive" })
      return
    }
    handleDelete(mergeIntoId)
  }

  if (loading) return <PageLoader />
  if (!jumpType) return null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Jump Type</h1>
          <p className="text-muted-foreground">Update jump type settings</p>
        </div>
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

      <UserJumpTypeForm initialData={jumpType} />

      {/* Simple Delete Confirmation (no jumps) */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => handleDelete()}
        title="Delete Jump Type"
        description={`Are you sure you want to delete ${jumpType.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" />
              Merge Jump Type
            </DialogTitle>
            <DialogDescription>
              All {jumpCount > 0 ? `${jumpCount} jump${jumpCount !== 1 ? "s" : ""} from` : "jumps from"}{" "}
              <strong>{jumpType.name}</strong> will be moved to the selected jump type, then{" "}
              <strong>{jumpType.name}</strong> will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mergeInto">Merge into:</Label>
              <Select value={mergeIntoId} onValueChange={setMergeIntoId}>
                <SelectTrigger id="mergeInto">
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
