"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Plane, Calendar, MapPin, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { secondsToHHMMSS } from "@/lib/utils/timeFormat"
import { calculateFreefallDistance, formatDistanceWithUnits } from "@/lib/utils/distanceFormat"
import { UnitPreference } from "@prisma/client"


interface Jump {
  id: string
  jumpNumber: number
  date: string
  isWorkJump: boolean
  workJumpType?: string
  customerName?: string
  isCutaway: boolean
  exitAltitude?: number
  deploymentAltitude?: number
  freefallTime?: number
  dropzone: { id: string; name: string }
}

export default function JumpsPage() {
  const [jumps, setJumps] = useState<Jump[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [unitPreference, setUnitPreference] = useState<UnitPreference>("IMPERIAL")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const timestamp = Date.now()
      const [jumpsRes, userRes] = await Promise.all([
        fetch(`/api/jumps?limit=50&orderBy=jumpNumber&order=desc&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/user?t=${timestamp}`, { cache: 'no-store' })
      ])

      const [jumpsData, userData] = await Promise.all([
        jumpsRes.json(),
        userRes.json()
      ])

      console.log("Fetched jumps:", jumpsData.data?.length || 0, "total:", jumpsData.pagination?.total || 0)
      setJumps(jumpsData.data || [])
      setTotal(jumpsData.pagination?.total || 0)
      setHasMore(jumpsData.pagination?.hasMore || false)
      setUnitPreference(userData.unitPreference || "IMPERIAL")
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const timestamp = Date.now()
      const offset = jumps.length
      const response = await fetch(
        `/api/jumps?limit=50&offset=${offset}&orderBy=jumpNumber&order=desc&t=${timestamp}`,
        { cache: 'no-store' }
      )
      const data = await response.json()

      console.log("Loaded more jumps:", data.data?.length || 0)
      setJumps([...jumps, ...(data.data || [])])
      setHasMore(data.pagination?.hasMore || false)
    } catch (error) {
      console.error("Failed to load more jumps:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jumps</h1>
          <p className="text-muted-foreground">
            {total} total jump{total !== 1 ? "s" : ""} logged
          </p>
        </div>
        <Button asChild>
          <Link href="/jumps/new">
            <Plus className="h-4 w-4 mr-2" />
            Log Jump
          </Link>
        </Button>
      </div>

      {jumps.length === 0 ? (
        <EmptyState
          title="No jumps logged yet"
          description="Start tracking your skydiving journey by logging your first jump."
          actionLabel="Log First Jump"
          actionHref="/jumps/new"
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <>
          <div className="space-y-3">
            {jumps.map((jump) => (
              <Link key={jump.id} href={`/jumps/${jump.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-primary">
                          #{jump.jumpNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(jump.date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {jump.dropzone.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {jump.isWorkJump && (
                          <Badge variant="secondary">
                            {jump.workJumpType}
                          </Badge>
                        )}
                        {jump.isCutaway && (
                          <Badge variant="destructive">Cutaway</Badge>
                        )}
                        {jump.freefallTime && (
                          <span className="text-sm text-muted-foreground">
                            {secondsToHHMMSS(jump.freefallTime)} freefall
                          </span>
                        )}
                        {jump.exitAltitude && jump.deploymentAltitude && jump.freefallTime && (
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceWithUnits(
                              calculateFreefallDistance(
                                jump.exitAltitude,
                                jump.deploymentAltitude,
                                jump.freefallTime,
                                unitPreference
                              ),
                              unitPreference
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {jump.customerName && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Customer: {jump.customerName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Load More Section */}
          {hasMore && (
            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {jumps.length} of {total} jumps
              </p>
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More Jumps
                  </>
                )}
              </Button>
            </div>
          )}

          {/* End of List Indicator */}
          {!hasMore && jumps.length > 0 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                All {total} jumps loaded
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
