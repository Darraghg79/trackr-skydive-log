"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { OnboardingBanner } from "@/components/shared/OnboardingBanner"
import { Plane, MapPin, TrendingUp, Calendar, Plus } from "lucide-react"
import { format } from "date-fns"
import { secondsToHHMMSS, secondsToReadable } from "@/lib/utils/timeFormat"
import { calculateFreefallDistance, formatDistanceWithUnits } from "@/lib/utils/distanceFormat"
import { UnitPreference } from "@prisma/client"

export const dynamic = 'force-dynamic'

interface DashboardStats {
  totalJumps: number
  nextJumpNumber: number
  totalFreefallTime: number
  totalCutaways: number
  recentJumps: any[]
  hasDropzones: boolean
  hasAircraft: boolean
  unitPreference: UnitPreference
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [userRes, jumpsRes, dropzonesRes, aircraftRes] = await Promise.all([
        fetch("/api/user"),
        fetch("/api/jumps?limit=5"),
        fetch("/api/dropzones"),
        fetch("/api/user-aircrafts"),
      ])

      const [userData, jumpsData, dropzonesData, aircraftData] = await Promise.all([
        userRes.json(),
        jumpsRes.json(),
        dropzonesRes.json(),
        aircraftRes.json(),
      ])

      // Calculate total freefall time from recent jumps (simplified)
      const totalFreefallTime = jumpsData.data?.reduce(
        (acc: number, jump: any) => acc + (jump.freefallTime || 0),
        0
      ) || 0

      setStats({
        totalJumps: userData.currentJumpNumber - 1 || 0,
        nextJumpNumber: userData.currentJumpNumber || 1,
        totalFreefallTime: userData.startingFreefallTime + totalFreefallTime,
        totalCutaways: userData.startingCutaways || 0,
        recentJumps: jumpsData.data || [],
        hasDropzones: (dropzonesData.data || []).length > 0,
        hasAircraft: (aircraftData.data || []).length > 0,
        unitPreference: userData.unitPreference || "IMPERIAL",
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to TrackR</p>
        </div>
        <Button asChild size="lg">
          <Link href="/jumps/new">
            <Plus className="h-5 w-5 mr-2" />
            Log Jump
          </Link>
        </Button>
      </div>

      {/* Onboarding Banner */}
      {stats && (
        <OnboardingBanner
          hasJumps={stats.totalJumps > 0}
          hasDropzones={stats.hasDropzones}
          hasAircraft={stats.hasAircraft}
        />
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jumps</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalJumps || 0}</div>
            <p className="text-xs text-muted-foreground">
              Next: #{stats?.nextJumpNumber || 1}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freefall Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {secondsToReadable(stats?.totalFreefallTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {secondsToHHMMSS(stats?.totalFreefallTime || 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cutaways</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCutaways || 0}</div>
            <p className="text-xs text-muted-foreground">Total incidents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recentJumps?.filter((j) => {
                const jumpDate = new Date(j.date)
                const now = new Date()
                return (
                  jumpDate.getMonth() === now.getMonth() &&
                  jumpDate.getFullYear() === now.getFullYear()
                )
              }).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Jumps this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Jumps</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.recentJumps && stats.recentJumps.length > 0 ? (
            <div className="space-y-3">
              {stats.recentJumps.map((jump: any) => (
                <Link
                  key={jump.id}
                  href={`/jumps/${jump.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-bold text-primary">
                        #{jump.jumpNumber}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium">{jump.dropzone?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(jump.date), "MMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-muted-foreground">
                      {jump.jumpType?.name || "N/A"}
                    </div>
                    {jump.exitAltitude && jump.deploymentAltitude && jump.freefallTime && (
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceWithUnits(
                          calculateFreefallDistance(
                            jump.exitAltitude,
                            jump.deploymentAltitude,
                            jump.freefallTime,
                            stats.unitPreference
                          ),
                          stats.unitPreference
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No jumps logged yet</p>
              <Button asChild className="mt-4" variant="outline">
                <Link href="/jumps/new">Log Your First Jump</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/jumps">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plane className="h-5 w-5" />
                View All Jumps
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/dropzones">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Manage Dropzones
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:bg-muted/50 transition-colors">
          <Link href="/settings/profile">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                View Reports
              </CardTitle>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  )
}