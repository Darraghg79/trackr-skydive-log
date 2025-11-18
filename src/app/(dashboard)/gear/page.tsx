"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Package, Calendar, Hash } from "lucide-react"
import { format } from "date-fns"


interface GearComponent {
  id: string
  type: string
  name: string
  manufacturer: string
  model?: string
  serialNumber?: string
  previousJumpCount: number
  serviceDate?: string
  isActive: boolean
}

const typeLabels: Record<string, string> = {
  MAIN: "Main Canopy",
  RESERVE: "Reserve Canopy",
  AAD: "AAD",
  CONTAINER: "Container",
  OTHER: "Other",
}

export default function GearPage() {
  const [gear, setGear] = useState<GearComponent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGear()
  }, [])

  const fetchGear = async () => {
    try {
      const res = await fetch("/api/gear-components?orderBy=type&order=asc")
      const data = await res.json()
      setGear(data.data || [])
    } catch (error) {
      console.error("Failed to fetch gear:", error)
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
          <h1 className="text-2xl font-bold">Gear</h1>
          <p className="text-muted-foreground">
            Manage your parachute equipment and service dates
          </p>
        </div>
        <Button asChild>
          <Link href="/gear/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Gear
          </Link>
        </Button>
      </div>

      {gear.length === 0 ? (
        <EmptyState
          title="No gear added"
          description="Add your parachute equipment to track service dates and jump counts."
          actionLabel="Add Gear"
          actionHref="/gear/new"
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {gear.map((item) => (
            <Link key={item.id} href={`/gear/${item.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {typeLabels[item.type] || item.type}
                      </Badge>
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.manufacturer} {item.model && `- ${item.model}`}
                      </p>
                    </div>
                    {!item.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground mt-3">
                    {item.serialNumber && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        SN: {item.serialNumber}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      {item.previousJumpCount} jumps
                    </div>
                    {item.serviceDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Service:{" "}
                        {format(new Date(item.serviceDate), "MMM d, yyyy")}
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
