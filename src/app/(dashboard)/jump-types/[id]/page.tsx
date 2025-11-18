"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { UserJumpTypeForm } from "@/components/forms/UserJumpTypeForm"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

export default function JumpTypeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [jumpType, setJumpType] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/user-jump-types/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      router.push("/jump-types")
      router.refresh()
    } catch (error) {
      console.error("Error deleting jump type:", error)
      alert("Failed to delete jump type")
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
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
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <UserJumpTypeForm initialData={jumpType} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Jump Type"
        description="Are you sure you want to delete this jump type? This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}
