"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { RigForm } from "@/components/forms/RigForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export default function RigDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [rig, setRig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchRig()
    }
  }, [params.id])

  const fetchRig = async () => {
    try {
      const res = await fetch(`/api/rigs/${params.id}`)
      if (!res.ok) throw new Error("Rig not found")
      const data = await res.json()
      setRig(data)
    } catch (error) {
      console.error("Failed to fetch rig:", error)
      router.push("/rigs")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/rigs/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/rigs")
      router.refresh()
    } catch (error) {
      console.error("Error deleting rig:", error)
      alert("Failed to delete rig")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!rig) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Rig</h1>
          <p className="text-muted-foreground">Update rig configuration</p>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <RigForm initialData={rig} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Rig"
        description="Are you sure you want to delete this rig? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
