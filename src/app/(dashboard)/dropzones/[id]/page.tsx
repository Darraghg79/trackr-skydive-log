"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { DropzoneForm } from "@/components/forms/DropzoneForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"

export default function DropzoneDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [dropzone, setDropzone] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/dropzones/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Dropzone deleted" })
      router.push("/dropzones")
    } catch (error) {
      toast({ title: "Failed to delete dropzone", variant: "destructive" })
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
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
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <DropzoneForm initialData={dropzone} dropzoneId={params.id as string} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Dropzone"
        description={`Are you sure you want to delete ${dropzone.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
