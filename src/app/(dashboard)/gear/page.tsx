"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { Plus, Package, Calendar, Hash, Box } from "lucide-react"
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

const typeLabels: Record<string, string> = {
  MAIN: "Main Canopy",
  RESERVE: "Reserve Canopy",
  AAD: "AAD",
  CONTAINER: "Container",
  OTHER: "Other",
}

function GearPageContent() {
  const searchParams = useSearchParams()
  const [gear, setGear] = useState<GearComponent[]>([])
  const [rigs, setRigs] = useState<Rig[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "components")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [gearRes, rigsRes] = await Promise.all([
        fetch("/api/gear-components?orderBy=type&order=asc"),
        fetch("/api/rigs?orderBy=name&order=asc"),
      ])

      const [gearData, rigsData] = await Promise.all([
        gearRes.json(),
        rigsRes.json(),
      ])

      setGear(gearData.data || [])
      setRigs(rigsData.data || [])
    } catch (error) {
      console.error("Failed to fetch gear data:", error)
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
          <h1 className="text-2xl font-bold">Gear & Rigs</h1>
          <p className="text-muted-foreground">
            Manage your parachute equipment, service dates, and complete rig setups
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="components">
            <Package className="h-4 w-4 mr-2" />
            Components
          </TabsTrigger>
          <TabsTrigger value="rigs">
            <Box className="h-4 w-4 mr-2" />
            Rigs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button asChild>
              <Link href="/gear/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Component
              </Link>
            </Button>
          </div>

          {gear.length === 0 ? (
            <EmptyState
              title="No gear components added"
              description="Add your parachute equipment to track service dates and jump counts."
              actionLabel="Add Component"
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
        </TabsContent>

        <TabsContent value="rigs" className="space-y-4">
          <div className="flex items-center justify-end">
            <Button asChild>
              <Link href="/rigs/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Rig
              </Link>
            </Button>
          </div>

          {rigs.length === 0 ? (
            <EmptyState
              title="No rigs configured"
              description="Create rig setups by combining your gear components."
              actionLabel="Create Rig"
              actionHref="/rigs/new"
              icon={<Box className="h-8 w-8 text-muted-foreground" />}
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
                              {rc.gearComponent.name} ({typeLabels[rc.gearComponent.type] || rc.gearComponent.type})
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
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function GearPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GearPageContent />
    </Suspense>
  )
}
