"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserAircraftForm } from "@/components/forms/UserAircraftForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2, GitMerge, AlertTriangle, Loader2 } from "lucide-react"
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

export default function AircraftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [aircraft, setAircraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [showMerge, setShowMerge] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkingJumps, setCheckingJumps] = useState(false)
  const [jumpCount, setJumpCount] = useState(0)
  const [otherAircrafts, setOtherAircrafts] = useState<any[]>([])
  const [mergeIntoId, setMergeIntoId] = useState<string>("")

  useEffect(() => {
    if (params.id) {
      fetchAircraft()
    }
  }, [params.id])

  const fetchAircraft = async () => {
    try {
      const res = await fetch(`/api/user-aircrafts/${params.id}`)
      if (!res.ok) throw new Error("Aircraft not found")
      const data = await res.json()
      setAircraft(data)
    } catch (error) {
      console.error("Failed to fetch aircraft:", error)
      router.push("/aircraft")
    } finally {
      setLoading(false)
    }
  }

  const fetchOtherAircrafts = async () => {
    const res = await fetch("/api/user-aircrafts")
    const data = await res.json()
    return (data.data || []).filter((a: any) => a.id !== params.id)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteClick = async () => {
    setCheckingJumps(true)
    try {
      const [jumpsRes, others] = await Promise.all([
        fetch(`/api/jumps?aircraftId=${params.id}&limit=1`),
        fetchOtherAircrafts(),
      ])
      const jumpsData = await jumpsRes.json()
      const count = jumpsData.pagination?.total || 0
      setJumpCount(count)
      setOtherAircrafts(others)

      if (count > 0) {
        if (others.length === 0) {
          toast({
            title: "Cannot delete",
            description: "This aircraft is used by jumps and you have no other aircraft to reassign to. Create another aircraft first.",
            variant: "destructive",
          })
          return
        }
        // Reuse the merge dialog but in "delete" context
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
        fetch(`/api/jumps?aircraftId=${params.id}&limit=1`),
        fetchOtherAircrafts(),
      ])
      const jumpsData = await jumpsRes.json()
      setJumpCount(jumpsData.pagination?.total || 0)
      setOtherAircrafts(others)

      if (others.length === 0) {
        toast({
          title: "No other aircraft",
          description: "You need at least one other aircraft to merge into.",
          variant: "destructive",
        })
        return
      }
      setMergeIntoId("")
      setShowMerge(true)
    } catch {
      toast({ title: "Error", description: "Failed to load aircraft", variant: "destructive" })
    } finally {
      setCheckingJumps(false)
    }
  }

  // ── Execute delete/merge ──────────────────────────────────────────────────
  const handleDelete = async (reassignTo?: string) => {
    setDeleting(true)
    try {
      const url = reassignTo
        ? `/api/user-aircrafts/${params.id}?reassignToId=${reassignTo}`
        : `/api/user-aircrafts/${params.id}`

      const res = await fetch(url, { method: "DELETE" })
      const data = await res.json()

      if (!res.ok) {
        toast({
          title: "Failed to delete aircraft",
          description: data.details || data.error || "An error occurred",
          variant: "destructive",
        })
        return
      }

      toast({
        title: reassignTo ? "Aircraft merged" : "Aircraft deleted",
        description: data.jumpsReassigned > 0
          ? `${data.jumpsReassigned} jump${data.jumpsReassigned !== 1 ? "s" : ""} reassigned`
          : undefined,
      })

      setShowDelete(false)
      setShowMerge(false)
      router.push("/aircraft")
      router.refresh()
    } catch {
      toast({ title: "Failed to delete aircraft", description: "An unexpected error occurred", variant: "destructive" })
    } finally {
      setDeleting(false)
    }
  }

  const handleMergeConfirm = () => {
    if (!mergeIntoId) {
      toast({ title: "Please select an aircraft", description: "Choose which aircraft to merge into", variant: "destructive" })
      return
    }
    handleDelete(mergeIntoId)
  }

  if (loading) return <PageLoader />
  if (!aircraft) return null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Aircraft</h1>
          <p className="text-muted-foreground">Update aircraft settings</p>
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

      <UserAircraftForm initialData={aircraft} />

      {/* Simple Delete Confirmation (no jumps using this aircraft) */}
      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={() => handleDelete()}
        title="Delete Aircraft"
        description={`Are you sure you want to delete ${aircraft.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />

      {/* Merge Dialog (also used when deleting aircraft that has jumps) */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitMerge className="h-5 w-5 text-primary" />
              Merge Aircraft
            </DialogTitle>
            <DialogDescription>
              All {jumpCount > 0 ? `${jumpCount} jump${jumpCount !== 1 ? "s" : ""} from` : "jumps from"}{" "}
              <strong>{aircraft.name}</strong> will be moved to the selected aircraft, then{" "}
              <strong>{aircraft.name}</strong> will be deleted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mergeInto">Merge into:</Label>
              <Select value={mergeIntoId} onValueChange={setMergeIntoId}>
                <SelectTrigger id="mergeInto">
                  <SelectValue placeholder="Select an aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {otherAircrafts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
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
