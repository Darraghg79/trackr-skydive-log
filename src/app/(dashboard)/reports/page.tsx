"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plane, TrendingUp, Calendar, MapPin, Award, Clock } from "lucide-react"
import { format } from "date-fns"
import { secondsToHHMMSS, secondsToReadable } from "@/lib/utils/timeFormat"

export const dynamic = 'force-dynamic'

interface ReportsData {
  totalJumps: number
  totalFreefallTime: number
  totalCutaways: number
  jumpsByMonth: { month: string; count: number }[]
  topDropzones: { name: string; count: number }[]
  totalDropzonesVisited: number
  jumpTypeBreakdown: { name: string; count: number }[]
  recentActivity: {
    thisMonth: number
    lastMonth: number
    thisYear: number
  }
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReportsData()
  }, [])

  const fetchReportsData = async () => {
    try {
      const [userRes, jumpsRes] = await Promise.all([
        fetch("/api/user"),
        // Request all jumps for accurate reporting (max limit of 10000)
        fetch("/api/jumps?limit=10000"),
      ])

      const [userData, jumpsData] = await Promise.all([
        userRes.json(),
        jumpsRes.json(),
      ])

      const jumps = jumpsData.data || []
      console.log("Reports page: Loaded", jumps.length, "jumps for statistics")
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Calculate stats
      const totalFreefallTime = jumps.reduce(
        (acc: number, jump: any) => acc + (jump.freefallTime || 0),
        0
      ) + (userData.startingFreefallTime || 0)

      const thisMonthJumps = jumps.filter((j: any) => {
        const date = new Date(j.date)
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      })

      const lastMonthJumps = jumps.filter((j: any) => {
        const date = new Date(j.date)
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
        return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear
      })

      const thisYearJumps = jumps.filter((j: any) => {
        const date = new Date(j.date)
        return date.getFullYear() === currentYear
      })

      // Top dropzones
      const dropzoneCounts: { [key: string]: number } = {}
      jumps.forEach((j: any) => {
        const dzName = j.dropzone?.name || "Unknown"
        dropzoneCounts[dzName] = (dropzoneCounts[dzName] || 0) + 1
      })

      // Count total unique dropzones
      const totalDropzonesVisited = Object.keys(dropzoneCounts).length

      // Get top 5 for display
      const topDropzones = Object.entries(dropzoneCounts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)

      // Jump type breakdown
      const jumpTypeCounts: { [key: string]: number } = {}
      jumps.forEach((j: any) => {
        const typeName = j.jumpType?.name || "Unspecified"
        jumpTypeCounts[typeName] = (jumpTypeCounts[typeName] || 0) + 1
      })
      const jumpTypeBreakdown = Object.entries(jumpTypeCounts)
        .map(([name, count]) => ({ name, count: count as number }))
        .sort((a, b) => b.count - a.count)

      setData({
        totalJumps: (userData.currentJumpNumber - 1) || 0,
        totalFreefallTime,
        totalCutaways: userData.startingCutaways || 0,
        jumpsByMonth: [],
        topDropzones,
        totalDropzonesVisited,
        jumpTypeBreakdown,
        recentActivity: {
          thisMonth: thisMonthJumps.length,
          lastMonth: lastMonthJumps.length,
          thisYear: thisYearJumps.length,
        },
      })
    } catch (error) {
      console.error("Failed to fetch reports data:", error)
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
      <div>
        <h1 className="text-3xl font-bold">Reports & Statistics</h1>
        <p className="text-muted-foreground">Your skydiving activity overview</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/reports/jumps/drill-down">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jumps</CardTitle>
              <Plane className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data?.totalJumps || 0}</div>
              <p className="text-xs text-muted-foreground">Click to explore →</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Freefall Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {secondsToReadable(data?.totalFreefallTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {secondsToHHMMSS(data?.totalFreefallTime || 0)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.recentActivity.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.recentActivity.lastMonth || 0} last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.recentActivity.thisYear || 0}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), "yyyy")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Dropzones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Dropzones
            </CardTitle>
            <CardDescription>Your most visited locations</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.topDropzones && data.topDropzones.length > 0 ? (
              <div className="space-y-4">
                {data.topDropzones.map((dz, index) => (
                  <div key={dz.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{dz.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {dz.count} {dz.count === 1 ? "jump" : "jumps"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available yet</p>
            )}
          </CardContent>
        </Card>

        {/* Jump Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Jump Type Breakdown
            </CardTitle>
            <CardDescription>Distribution by jump discipline</CardDescription>
          </CardHeader>
          <CardContent>
            {data?.jumpTypeBreakdown && data.jumpTypeBreakdown.length > 0 ? (
              <div className="space-y-4">
                {data.jumpTypeBreakdown.map((type) => {
                  const percentage = data.totalJumps > 0
                    ? Math.round((type.count / data.totalJumps) * 100)
                    : 0
                  return (
                    <div key={type.name} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{type.name}</span>
                        <span className="text-muted-foreground">
                          {type.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones & Achievements</CardTitle>
          <CardDescription>Track your progress and accomplishments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Award className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{data?.totalJumps || 0}</div>
              <div className="text-sm text-muted-foreground text-center">Total Jumps</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">
                {secondsToReadable(data?.totalFreefallTime || 0)}
              </div>
              <div className="text-sm text-muted-foreground text-center">Freefall Time</div>
            </div>
            <div className="flex flex-col items-center p-4 border rounded-lg">
              <MapPin className="h-8 w-8 text-primary mb-2" />
              <div className="text-2xl font-bold">{data?.totalDropzonesVisited || 0}</div>
              <div className="text-sm text-muted-foreground text-center">Dropzones Visited</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
