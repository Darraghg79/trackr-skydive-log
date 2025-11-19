"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Plane } from "lucide-react"


interface Aircraft {
  id: string
  name: string
  isDefault: boolean
  isActive: boolean
}

export default function AircraftPage() {
  const [aircraft, setAircraft] = useState<Aircraft[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAircraft = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/user-aircrafts?t=" + Date.now(), {
        cache: "no-store"
      })
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`)
      }
      const data = await res.json()
      setAircraft(data.data || [])
    } catch (error) {
      console.error("Failed to fetch aircraft:", error)
      setAircraft([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAircraft()

    // Refetch when window regains focus (user navigates back)
    const handleFocus = () => {
      fetchAircraft()
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
          <h1 className="text-2xl font-bold">Aircraft</h1>
          <p className="text-muted-foreground">
            Manage aircraft used for jumps
          </p>
        </div>
        <Button asChild>
          <Link href="/aircraft/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Aircraft
          </Link>
        </Button>
      </div>

      {aircraft.length === 0 ? (
        <EmptyState
          title="No aircraft configured"
          description="Add aircraft types like Caravan, Twin Otter, King Air, etc."
          actionLabel="Add Aircraft"
          actionHref="/aircraft/new"
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-3">
          {aircraft.map((item) => (
            <Link key={item.id} href={`/aircraft/${item.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold">{item.name}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.isDefault && (
                      <Badge variant="default">Default</Badge>
                    )}
                    {!item.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
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
