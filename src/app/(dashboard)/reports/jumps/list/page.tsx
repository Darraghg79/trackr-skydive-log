"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { EmptyState } from "@/components/shared/EmptyState"
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plane,
  ChevronRight,
  Briefcase,
  CheckCircle2,
} from "lucide-react"
import { format } from "date-fns"
import { secondsToHHMMSS } from "@/lib/utils/timeFormat"

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
  jumpType?: { id: string; name: string }
  aircraft?: { id: string; name: string }
  rig?: { id: string; name: string }
  signatures?: Array<{ id: string }>
}

interface GearMetadata {
  name: string
  type: string
  previousJumps: number
  loggedJumps: number
  totalJumps: number
}

function FilteredJumpsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [jumps, setJumps] = useState<Jump[]>([])
  const [gearMetadata, setGearMetadata] = useState<GearMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [showWorkJumpsOnly, setShowWorkJumpsOnly] = useState(false)

  // Get filter parameters
  const year = searchParams.get("year")
  const type = searchParams.get("type")
  const dropzone = searchParams.get("dropzone")
  const aircraft = searchParams.get("aircraft")
  const gear = searchParams.get("gear")

  useEffect(() => {
    fetchJumps()
  }, [year, type, dropzone, aircraft, gear])

  const fetchJumps = async () => {
    try {
      // Build query string with filters
      const params = new URLSearchParams()
      if (year) params.set("year", year)
      if (type) params.set("type", type)
      if (dropzone) params.set("dropzone", dropzone)
      if (aircraft) params.set("aircraft", aircraft)
      if (gear) params.set("gear", gear)

      const url = params.toString()
        ? `/api/jumps/filtered?${params.toString()}`
        : `/api/jumps/filtered`

      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch jumps")
      const data = await res.json()

      setJumps(data.data || [])
      setGearMetadata(data.gearMetadata || null)
    } catch (error) {
      console.error("Failed to fetch jumps:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  // Get filter title for display
  const getFilterTitle = () => {
    if (year) return `Jumps in ${year}`
    if (type) return `${type} Jumps`
    if (dropzone) return `Jumps at ${dropzone}`
    if (aircraft) return `Jumps in ${aircraft}`
    if (gear) return `Jumps with ${gear}`
    return "All Jumps"
  }

  // Filter by work jumps if toggle is on
  const displayedJumps = showWorkJumpsOnly
    ? jumps.filter((j) => j.isWorkJump)
    : jumps

  return (
    <div className="space-y-6 pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/reports" className="hover:text-foreground">
          Reports
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link
          href="/reports/jumps/drill-down"
          className="hover:text-foreground"
        >
          Total Jumps
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">{getFilterTitle()}</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{getFilterTitle()}</h1>
          <p className="text-muted-foreground">
            {displayedJumps.length} {displayedJumps.length === 1 ? "jump" : "jumps"}
            {showWorkJumpsOnly && " (work jumps only)"}
          </p>
        </div>
      </div>

      {/* Gear Metadata Card (only shown when filtering by gear) */}
      {gearMetadata && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">
                  {gearMetadata.name} ({gearMetadata.type})
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Total: {gearMetadata.totalJumps} jumps
                  <span className="mx-2">•</span>
                  Logged: {gearMetadata.loggedJumps} jumps
                  {gearMetadata.previousJumps > 0 && (
                    <>
                      <span className="mx-2">•</span>
                      Previous: {gearMetadata.previousJumps} jumps
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Jump Toggle */}
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
        <Briefcase className="h-5 w-5 text-muted-foreground" />
        <div className="flex-1">
          <div className="font-medium">Show work jumps only</div>
          <div className="text-sm text-muted-foreground">
            Filter to see only paid work jumps
          </div>
        </div>
        <Button
          variant={showWorkJumpsOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowWorkJumpsOnly(!showWorkJumpsOnly)}
        >
          {showWorkJumpsOnly ? "On" : "Off"}
        </Button>
      </div>

      {/* Jump List */}
      {displayedJumps.length === 0 ? (
        <EmptyState
          title="No jumps found"
          description={
            showWorkJumpsOnly
              ? "No work jumps match the current filters."
              : "No jumps match the current filters."
          }
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-3">
          {displayedJumps.map((jump) => {
            const isSigned = jump.signatures && jump.signatures.length > 0

            return (
              <Link key={jump.id} href={`/jumps/${jump.id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="text-2xl font-bold text-primary">
                          #{jump.jumpNumber}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(jump.date), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {jump.dropzone.name}
                          </div>
                          {jump.jumpType && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Plane className="h-4 w-4" />
                              {jump.jumpType.name}
                            </div>
                          )}
                          {jump.freefallTime && (
                            <div className="text-sm text-muted-foreground">
                              Freefall: {secondsToHHMMSS(jump.freefallTime)}
                            </div>
                          )}
                          {jump.customerName && (
                            <div className="text-sm text-muted-foreground">
                              Customer: {jump.customerName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {isSigned && (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Signed
                          </Badge>
                        )}
                        {jump.isWorkJump && (
                          <Badge variant="secondary">
                            {jump.workJumpType}
                          </Badge>
                        )}
                        {jump.isCutaway && (
                          <Badge variant="destructive">Cutaway</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function FilteredJumpsListPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FilteredJumpsContent />
    </Suspense>
  )
}
