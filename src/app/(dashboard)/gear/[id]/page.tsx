"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { GearForm } from "@/components/forms/GearForm"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Trash2 } from "lucide-react"

export default function GearDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [gear, setGear] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchGear()
  }, [params.id])

  const fetchGear = async () => {
    try {
      const res = await fetch(`/api/gear-components/${params.id}`)
      if (!res.ok) throw new Error("Gear not found")
      const data = await res.json()
      setGear(data)
    } catch (error) {
      toast({ title: "Failed to load gear", variant: "destructive" })
      router.push("/gear")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/gear-components/${params.id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast({ title: "Gear deleted" })
      router.push("/gear")
    } catch (error) {
      toast({ title: "Failed to delete gear", variant: "destructive" })
    } finally {
      setDeleting(false)
      setShowDelete(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!gear) {
    return null
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit {gear.name}</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>

      <GearForm initialData={gear} gearId={params.id as string} />

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete}
        title="Delete Gear"
        description={`Are you sure you want to delete ${gear.name}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  )
}
