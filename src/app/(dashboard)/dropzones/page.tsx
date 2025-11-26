"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, MapPin, DollarSign, Mail, AlertCircle, Search, Loader2, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


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
  rateAFF?: number
  rateTandem?: number
  rateCamera?: number
  rateCoach?: number
  rateHandcam?: number
}

export default function DropzonesPage() {
  const [dropzones, setDropzones] = useState<Dropzone[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch data when search changes
  useEffect(() => {
    fetchDropzones(true)
  }, [debouncedSearch])

  const fetchDropzones = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setDropzones([])
      } else {
        setLoadingMore(true)
      }
      setError(null)

      const offset = reset ? 0 : dropzones.length
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''
      const res = await fetch(`/api/dropzones?limit=20&offset=${offset}${searchParam}&t=${Date.now()}`, {
        cache: "no-store"
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `API error: ${res.status}`)
      }

      const data = await res.json()
      console.log("Fetched dropzones:", data.data?.length || 0, "dropzones, total:", data.pagination?.total)

      if (reset) {
        setDropzones(data.data || [])
      } else {
        setDropzones(prev => [...prev, ...(data.data || [])])
      }

      setTotal(data.pagination?.total || 0)
      setHasMore(data.pagination?.hasMore || false)
    } catch (error: any) {
      console.error("Failed to fetch dropzones:", error)
      setError(error.message || "Failed to load dropzones")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchDropzones(false)
    }
  }

  // Check if dropzone has rates configured
  const isConfigured = (dz: Dropzone) => {
    return !!(dz.rateAFF || dz.rateTandem || dz.rateCamera || dz.rateCoach || dz.rateHandcam)
  }

  useEffect(() => {
    // Initial fetch removed - now handled by debouncedSearch useEffect
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
            {debouncedSearch
              ? `Showing ${dropzones.length} of ${total} dropzone${total !== 1 ? 's' : ''}`
              : `Manage your dropzone locations and billing rates`
            }
          </p>
        </div>
        <Button asChild>
          <Link href="/dropzones/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Dropzone
          </Link>
        </Button>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="text"
              placeholder="Search dropzones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading dropzones</AlertTitle>
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDropzones(true)}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {dropzones.length === 0 && !debouncedSearch ? (
        <EmptyState
          title="No dropzones added"
          description="Add your first dropzone to start logging jumps."
          actionLabel="Add Dropzone"
          actionHref="/dropzones/new"
          icon={<MapPin className="h-8 w-8 text-muted-foreground" />}
        />
      ) : dropzones.length === 0 && debouncedSearch ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No dropzones match your search</h3>
            <p className="text-muted-foreground mb-4">
              Try searching for "{debouncedSearch}"
            </p>
            <Button variant="outline" onClick={() => setSearchQuery("")}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {dropzones.map((dz) => {
              const configured = isConfigured(dz)

              return (
                <Link key={dz.id} href={`/dropzones/${dz.id}`}>
                  <Card className={`hover:bg-muted/50 transition-colors cursor-pointer h-full ${configured ? 'border-l-4 border-l-primary' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{dz.name}</h3>
                            {configured && (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Configured
                              </Badge>
                            )}
                          </div>
                          {dz.country && (
                            <p className="text-sm text-muted-foreground">
                              {dz.city ? `${dz.city}, ${dz.country}` : dz.country}
                            </p>
                          )}
                        </div>
                        {!dz.isActive && (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                      </div>

                      {dz.address && (
                        <p className="text-sm text-muted-foreground mb-2">{dz.address}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        {dz.currency && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {dz.currency}
                          </div>
                        )}
                        {dz.contactEmail && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {dz.contactEmail}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${total - dropzones.length} remaining)`
                )}
              </Button>
            </div>
          )}

          {/* All Loaded Indicator */}
          {!hasMore && dropzones.length > 0 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                All {total} dropzone{total !== 1 ? 's' : ''} loaded
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
