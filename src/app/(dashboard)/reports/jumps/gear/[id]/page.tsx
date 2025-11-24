"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Calendar,
  Activity,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"

interface GearStats {
  id: string
  name: string
  type: string
  manufacturer: string
  model: string | null
  serialNumber: string | null
  previousJumpCount: number
  serviceDate: Date | null
  isActive: boolean
  loggedJumps: number
  totalJumps: number
}

function GearStatsContent() {
  const params = useParams()
  const router = useRouter()
  const [stats, setStats] = useState<GearStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [params.id])

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/gear-components/${params.id}/stats`)
      if (!res.ok) throw new Error("Failed to fetch gear stats")
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error("Failed to fetch gear stats:", error)
      setError("Failed to load gear statistics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Gear Statistics</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {error || "Gear component not found"}
          </CardContent>
        </Card>
      </div>
    )
  }

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
        <span className="text-foreground font-medium">
          {stats.name} ({stats.type})
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {stats.name} ({stats.type})
            </h1>
          </div>
          {!stats.isActive && (
            <div className="flex items-center gap-2 mt-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              This gear component is marked as inactive
            </div>
          )}
        </div>
      </div>

      {/* Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Jump Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Total Jumps - Prominent Display */}
            <div className="p-6 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="text-sm text-muted-foreground mb-2">
                Total Jumps on Gear
              </div>
              <div className="text-4xl font-bold text-primary">
                {stats.totalJumps}
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  Jumps Logged in App
                </div>
                <div className="text-2xl font-semibold">{stats.loggedJumps}</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-sm text-muted-foreground mb-1">
                  Previous Jumps (Before Tracking)
                </div>
                <div className="text-2xl font-semibold">
                  {stats.previousJumpCount}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Service Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Service Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.serviceDate && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Next Service Due</span>
                <span className="font-medium">
                  {format(new Date(stats.serviceDate), "MMM d, yyyy")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-muted-foreground">Manufacturer</span>
              <span className="font-medium">{stats.manufacturer}</span>
            </div>
            {stats.model && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium">{stats.model}</span>
              </div>
            )}
            {stats.serialNumber && (
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Serial Number</span>
                <span className="font-medium font-mono text-sm">
                  {stats.serialNumber}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{stats.type}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Link href={`/gear/${stats.id}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Edit Gear Component
          </Button>
        </Link>
        <Link href="/gear" className="flex-1">
          <Button variant="outline" className="w-full">
            View All Gear
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default function GearStatsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GearStatsContent />
    </Suspense>
  )
}
