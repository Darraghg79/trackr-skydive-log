"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserAircraftForm } from "@/components/forms/UserAircraftForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export default function AircraftDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [aircraft, setAircraft] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/user-aircrafts/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/aircraft")
      router.refresh()
    } catch (error) {
      console.error("Error deleting aircraft:", error)
      alert("Failed to delete aircraft")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!aircraft) {
    return null
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Aircraft</h1>
          <p className="text-muted-foreground">Update aircraft settings</p>
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

      <UserAircraftForm initialData={aircraft} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Aircraft"
        description="Are you sure you want to delete this aircraft? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
