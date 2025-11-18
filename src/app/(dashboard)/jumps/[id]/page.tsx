"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { JumpForm } from "@/components/forms/JumpForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"

export default function JumpDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [jump, setJump] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchJump()
  }, [params.id])

  const fetchJump = async () => {
    try {
      const res = await fetch(`/api/jumps/${params.id}`)
      if (!res.ok) throw new Error("Jump not found")
      const data = await res.json()
      setJump(data)
    } catch (error) {
      toast({ title: "Failed to load jump", variant: "destructive" })
      router.push("/jumps")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/jumps/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Jump deleted" })
      router.push("/jumps")
    } catch (error) {
      toast({ title: "Failed to delete jump", variant: "destructive" })
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!jump) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Jump #{jump.jumpNumber}</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <JumpForm initialData={jump} jumpId={params.id as string} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Jump"
        description={`Are you sure you want to delete jump #${jump.jumpNumber}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
