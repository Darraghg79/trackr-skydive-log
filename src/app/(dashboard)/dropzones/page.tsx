"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, MapPin, DollarSign, Mail } from "lucide-react"


interface Dropzone {
  id: string
  name: string
  city?: string
  address?: string
  country?: string
  contactName?: string
  contactEmail?: string
  currency?: string
  isActive: boolean
}

export default function DropzonesPage() {
  const [dropzones, setDropzones] = useState<Dropzone[]>([])
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  const fetchDropzones = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/dropzones?orderBy=name&order=asc", {
        cache: "no-store"
      })
      const data = await res.json()
      setDropzones(data.data || [])
    } catch (error) {
      console.error("Failed to fetch dropzones:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDropzones()
  }, [pathname])

  useEffect(() => {
    // Refetch when window regains focus
    const handleFocus = () => {
      fetchDropzones()
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
          <h1 className="text-2xl font-bold">Dropzones</h1>
          <p className="text-muted-foreground">
            Manage your dropzone locations and billing rates
          </p>
        </div>
        <Button asChild>
          <Link href="/dropzones/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Dropzone
          </Link>
        </Button>
      </div>

      {dropzones.length === 0 ? (
        <EmptyState
          title="No dropzones added"
          description="Add your first dropzone to start logging jumps."
          actionLabel="Add Dropzone"
          actionHref="/dropzones/new"
          icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {dropzones.map((dz) => (
            <Link key={dz.id} href={`/dropzones/${dz.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{dz.name}</h3>
                    {!dz.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {(dz.city || dz.country) && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {[dz.city, dz.country].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {dz.currency && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        {dz.currency}
                      </div>
                    )}
                    {dz.contactEmail && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        {dz.contactEmail}
                      </div>
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
