"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, List } from "lucide-react"


interface JumpType {
  id: string
  name: string
  isDefault: boolean
  isActive: boolean
}

export default function JumpTypesPage() {
  const [jumpTypes, setJumpTypes] = useState<JumpType[]>([])
  const [loading, setLoading] = useState(true)

  const fetchJumpTypes = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/user-jump-types?t=" + Date.now(), {
        cache: "no-store"
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      setJumpTypes(data.data || [])
    } catch (error) {
      console.error("Failed to fetch jump types:", error)
      setJumpTypes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJumpTypes()

    // Refetch when window regains focus (user navigates back)
    const handleFocus = () => {
      fetchJumpTypes()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jump Types</h1>
          <p className="text-muted-foreground">
            Manage your custom jump type categories
          </p>
        </div>
        <Button asChild>
          <Link href="/jump-types/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Jump Type
          </Link>
        </Button>
      </div>

      {jumpTypes.length === 0 ? (
        <EmptyState
          title="No jump types configured"
          description="Add custom jump type categories like Formation, Freefly, Wingsuit, etc."
          actionLabel="Add Jump Type"
          actionHref="/jump-types/new"
          icon={<List className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-3">
          {jumpTypes.map((type) => (
            <Link key={type.id} href={`/jump-types/${type.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{type.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {type.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                    {!type.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
