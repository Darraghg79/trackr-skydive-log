"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { ArrowLeft, Calendar, Plane, ChevronRight, MapPin, Package } from "lucide-react"

interface GroupData {
  id?: string // Optional ID for gear components
  name: string
  count: number
}

interface DrillDownData {
  totalJumps: number
  byYear: GroupData[]
  byType: GroupData[]
  byAircraft: GroupData[]
  byGear: GroupData[]
  byDropzone: GroupData[]
}

export default function JumpsDrillDownPage() {
  const router = useRouter()
  const [data, setData] = useState<DrillDownData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDrillDownData()
  }, [])

  const fetchDrillDownData = async () => {
    try {
      const res = await fetch("/api/jumps/drill-down")
      if (!res.ok) throw new Error("Failed to fetch data")
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error("Failed to fetch drill-down data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Jump Statistics</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Failed to load data. Please try again.
          </CardContent>
        </Card>
      </div>
    )
  }

  const GroupCard = ({
    title,
    icon: Icon,
    items,
    filterType,
  }: {
    title: string
    icon: any
    items: GroupData[]
    filterType: string
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No data available
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => {
              // For gear items, link to stats page; for others, link to filtered list
              const href = filterType === "gear" && item.id
                ? `/reports/jumps/gear/${item.id}`
                : `/reports/jumps/list?${filterType}=${encodeURIComponent(item.name)}`

              return (
                <Link key={item.id || item.name} href={href}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="font-medium">{item.name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {item.count} {item.count === 1 ? "jump" : "jumps"}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/reports" className="hover:text-foreground">
          Reports
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Total Jumps</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Jump Statistics</h1>
          <p className="text-muted-foreground">
            {data.totalJumps} total {data.totalJumps === 1 ? "jump" : "jumps"}
          </p>
        </div>
      </div>

      {/* Quick Link to All Jumps */}
      <Link href="/reports/jumps/list">
        <Card className="hover:bg-muted/50 transition-colors cursor-pointer border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">View All Jumps</div>
                  <div className="text-sm text-muted-foreground">
                    See complete jump list with filters
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </Link>

      {/* Grouped Statistics */}
      <div className="space-y-6">
        <GroupCard
          title="By Year"
          icon={Calendar}
          items={data.byYear}
          filterType="year"
        />

        <GroupCard
          title="By Jump Type"
          icon={Plane}
          items={data.byType}
          filterType="type"
        />

        <GroupCard
          title="By Dropzone"
          icon={MapPin}
          items={data.byDropzone}
          filterType="dropzone"
        />

        <GroupCard
          title="By Aircraft"
          icon={Plane}
          items={data.byAircraft}
          filterType="aircraft"
        />

        <GroupCard
          title="By Gear"
          icon={Package}
          items={data.byGear}
          filterType="gear"
        />
      </div>
    </div>
  )
}
