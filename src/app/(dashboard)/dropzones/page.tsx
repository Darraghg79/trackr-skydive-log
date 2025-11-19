"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, MapPin, DollarSign, Mail, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


interface Dropzone {
  id: string
  name: string
  city?: string
  address: string
  country: string
  contactName?: string
  contactEmail?: string
  currency: string
  isActive: boolean
}

export default function DropzonesPage() {
  const [dropzones, setDropzones] = useState<Dropzone[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDropzones = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/dropzones?orderBy=name&order=asc&t=" + Date.now(), {
        cache: "no-store"
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${res.status}`)
      }
      const data = await res.json()
      console.log("Fetched dropzones:", data.data?.length || 0, "dropzones")
      setDropzones(data.data || [])
    } catch (error: any) {
      console.error("Failed to fetch dropzones:", error)
      setError(error.message || "Failed to load dropzones")
      // Don't clear dropzones on error - keep showing what we have
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDropzones()

    // Refetch when window regains focus (user navigates back)
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

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dropzones</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDropzones}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

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
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {dz.city ? `${dz.city}, ${dz.country}` : dz.country}
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      {dz.currency}
                    </div>
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
