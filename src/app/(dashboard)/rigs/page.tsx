"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Package } from "lucide-react"


interface Rig {
  id: string
  name: string
  isActive: boolean
  rigComponents: Array<{
    gearComponent: {
      id: string
      name: string
      type: string
    }
  }>
}

export default function RigsPage() {
  const [rigs, setRigs] = useState<Rig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRigs()
  }, [])

  const fetchRigs = async () => {
    try {
      const res = await fetch("/api/rigs?orderBy=name&order=asc")
      const data = await res.json()
      setRigs(data.data || [])
    } catch (error) {
      console.error("Failed to fetch rigs:", error)
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
          <h1 className="text-2xl font-bold">Rigs</h1>
          <p className="text-muted-foreground">
            Manage your complete rig setups
          </p>
        </div>
        <Button asChild>
          <Link href="/rigs/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Rig
          </Link>
        </Button>
      </div>

      {rigs.length === 0 ? (
        <EmptyState
          title="No rigs configured"
          description="Create rig setups by combining your gear components."
          actionLabel="Add Rig"
          actionHref="/rigs/new"
          icon={<Package className="h-8 w-8 text-muted-foreground" />}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {rigs.map((rig) => (
            <Link key={rig.id} href={`/rigs/${rig.id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg">{rig.name}</h3>
                    {!rig.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {rig.rigComponents.length > 0 ? (
                    <div className="space-y-1">
                      {rig.rigComponents.map((rc) => (
                        <div
                          key={rc.gearComponent.id}
                          className="text-sm text-muted-foreground flex items-center gap-2"
                        >
                          <Package className="h-3 w-3" />
                          {rc.gearComponent.name} ({rc.gearComponent.type})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No components assigned
                    </p>
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
