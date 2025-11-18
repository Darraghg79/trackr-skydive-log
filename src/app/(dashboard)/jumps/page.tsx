"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Plane, Calendar, MapPin } from "lucide-react"
import { format } from "date-fns"


interface Jump {
  id: string
  jumpNumber: number
  date: string
  isWorkJump: boolean
  workJumpType?: string
  customerName?: string
  isCutaway: boolean
  exitAltitude?: number
  freefallTime?: number
  dropzone: { id: string; name: string }
}

export default function JumpsPage() {
  const [jumps, setJumps] = useState<Jump[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchJumps()
  }, [])

  const fetchJumps = async () => {
    try {
      const res = await fetch("/api/jumps?limit=50&orderBy=jumpNumber&order=desc")
      const data = await res.json()
      setJumps(data.data || [])
      setTotal(data.pagination?.total || 0)
    } catch (error) {
      console.error("Failed to fetch jumps:", error)
    } finally {
      setLoading(false)
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
                    <div className="flex items-center gap-2">
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
                          {jump.freefallTime}s freefall
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
      )}
    </div>
  )
}
