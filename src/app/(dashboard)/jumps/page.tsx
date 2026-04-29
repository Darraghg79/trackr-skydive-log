"use client"

import { useEffect, useState, useCallback, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/shared/EmptyState"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { useToast } from "@/hooks/useToast"
import {
  Plus, Plane, Calendar, MapPin, Loader2, PenTool, CheckCircle2,
  X, Copy, ListChecks, Video,
} from "lucide-react"
import { format } from "date-fns"
import { BulkSignatureModal } from "@/components/jumps/BulkSignatureModal"

interface Jump {
  id: string
  jumpNumber: number
  date: string
  isWorkJump: boolean
  workJumpType?: string
  customerName?: string
  isCutaway: boolean
  hasHandcam: boolean
  exitAltitude?: number
  deploymentAltitude?: number
  freefallTime?: number
  notes?: string
  dropzone: { id: string; name: string }
  aircraft?: { id: string; name: string } | null
  jumpType?: { id: string; name: string } | null
  signatures?: Array<{ id: string }>
}

// Reads the ?showSearch URL param and syncs it to parent state.
// Must be wrapped in <Suspense> since it calls useSearchParams().
function SearchParamSyncer({ onShow }: { onShow: (v: boolean) => void }) {
  const searchParams = useSearchParams()
  const show = searchParams.get('showSearch') === '1'
  const onShowRef = useRef(onShow)
  onShowRef.current = onShow
  useEffect(() => {
    onShowRef.current(show)
  }, [show])
  return null
}

export default function JumpsPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [jumps, setJumps] = useState<Jump[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [signatureMode, setSignatureMode] = useState(false)
  const [selectedJumps, setSelectedJumps] = useState<Set<string>>(new Set())
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signing, setSigning] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch data when search changes
  useEffect(() => {
    if (debouncedSearch.trim()) {
      fetchData(debouncedSearch)
    } else if (searchQuery === "" && debouncedSearch === "") {
      fetchData()
    }
  }, [debouncedSearch])

  const fetchData = async (searchTerm?: string) => {
    try {
      const timestamp = Date.now()
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ''
      const [jumpsRes] = await Promise.all([
        fetch(`/api/jumps?limit=50&orderBy=jumpNumber&order=desc${searchParam}&t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/user?t=${timestamp}`, { cache: 'no-store' })
      ])

      const jumpsData = await jumpsRes.json()

      setJumps(jumpsData.data || [])
      setTotal(jumpsData.pagination?.total || 0)
      setHasMore(jumpsData.pagination?.hasMore || false)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = async () => {
    if (loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const timestamp = Date.now()
      const offset = jumps.length
      const response = await fetch(
        `/api/jumps?limit=50&offset=${offset}&orderBy=jumpNumber&order=desc&t=${timestamp}`,
        { cache: 'no-store' }
      )
      const data = await response.json()

      setJumps([...jumps, ...(data.data || [])])
      setHasMore(data.pagination?.hasMore || false)
    } catch (error) {
      console.error("Failed to load more jumps:", error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Auto-focus search input when shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [showSearch])

  // Close search bar and clear query when user dismisses
  const closeSearch = useCallback(() => {
    setShowSearch(false)
    setSearchQuery("")
    setDebouncedSearch("")
    // Clear the URL param so the header icon reflects closed state
    router.replace('/jumps')
  }, [router])

  const clearSearch = useCallback(() => {
    setSearchQuery("")
    setDebouncedSearch("")
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleCopyJump = async (jumpId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const response = await fetch(`/api/jumps/${jumpId}`)
      if (!response.ok) throw new Error("Failed to fetch jump")
      const jump = await response.json()

      const jumpDataToCopy = {
        ...jump,
        customerName: jump.isWorkJump ? undefined : jump.customerName,
      }

      sessionStorage.setItem("copyJumpData", JSON.stringify(jumpDataToCopy))

      toast({
        title: "Jump copied",
        description: "Redirecting to new jump form with copied data",
      })

      router.push("/jumps/new")
    } catch {
      toast({
        title: "Failed to copy jump",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <PageLoader />
  }

  const toggleSignatureMode = () => {
    setSignatureMode(!signatureMode)
    setSelectedJumps(new Set())
  }

  const toggleJumpSelection = (jumpId: string) => {
    const newSelection = new Set(selectedJumps)
    if (newSelection.has(jumpId)) {
      newSelection.delete(jumpId)
    } else {
      newSelection.add(jumpId)
    }
    setSelectedJumps(newSelection)
  }

  const handleBulkSign = async (licenseNumber: string, signatureData: string) => {
    setSigning(true)
    try {
      const response = await fetch("/api/jumps/bulk-sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jumpIds: Array.from(selectedJumps),
          licenseNumber,
          signatureData,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sign jumps")
      }

      toast({
        title: "Jumps signed successfully",
        description: `${selectedJumps.size} jump${selectedJumps.size !== 1 ? "s" : ""} signed`,
      })

      setShowSignatureModal(false)
      setSelectedJumps(new Set())
      setSignatureMode(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Failed to sign jumps",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sync ?showSearch URL param → local state (header search icon controls this) */}
      <Suspense fallback={null}>
        <SearchParamSyncer onShow={setShowSearch} />
      </Suspense>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jumps</h1>
          <p className="text-muted-foreground">
            {debouncedSearch
              ? `Found ${total} jump${total !== 1 ? "s" : ""}`
              : `${total} total jump${total !== 1 ? "s" : ""} logged`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {jumps.length > 0 && (
            <>
              <Button
                variant={signatureMode ? "default" : "outline"}
                size="icon"
                onClick={toggleSignatureMode}
                title="Sign jumps"
              >
                <PenTool className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                asChild
                title="Quick Edit"
              >
                <Link href="/jumps/quick-edit">
                  <ListChecks className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
          <Button asChild>
            <Link href="/jumps/new">
              <Plus className="h-4 w-4 mr-2" />
              Log Jump
            </Link>
          </Button>
        </div>
      </div>

      {/* Search Bar — shown when header Search icon is active */}
      {showSearch && (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search jumps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={closeSearch}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {jumps.length === 0 && !debouncedSearch ? (
        <EmptyState
          title="No jumps logged yet"
          description="Start tracking your skydiving journey by logging your first jump."
          actionLabel="Log First Jump"
          actionHref="/jumps/new"
          icon={<Plane className="h-8 w-8 text-muted-foreground" />}
        />
      ) : jumps.length === 0 && debouncedSearch ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No jumps match your search</h3>
            <p className="text-muted-foreground mb-4">
              Try searching for jump numbers, dropzones, aircraft, customer names, or notes
            </p>
            <Button variant="outline" onClick={clearSearch}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {jumps.map((jump) => {
              const isSigned = jump.signatures && jump.signatures.length > 0
              const isTandemWithHandcam = jump.workJumpType === 'TANDEM' && jump.hasHandcam

              return (
                <div key={jump.id} className="relative">
                  {signatureMode ? (
                    <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <Checkbox
                            checked={selectedJumps.has(jump.id)}
                            onCheckedChange={() => toggleJumpSelection(jump.id)}
                          />
                          <div className="flex-1">
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                {isTandemWithHandcam && (
                                  <Badge variant="outline" className="gap-1">
                                    <Video className="h-3 w-3" />
                                    Handcam
                                  </Badge>
                                )}
                                {jump.isCutaway && (
                                  <Badge variant="destructive">Cutaway</Badge>
                                )}
                              </div>
                            </div>
                            {jump.customerName && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                Customer: {jump.customerName}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="relative group">
                      <Link href={`/jumps/${jump.id}`}>
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
                              <div className="flex items-center gap-2 flex-wrap">
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
                                {isTandemWithHandcam && (
                                  <Badge variant="outline" className="gap-1">
                                    <Video className="h-3 w-3" />
                                    Handcam
                                  </Badge>
                                )}
                                {jump.isCutaway && (
                                  <Badge variant="destructive">Cutaway</Badge>
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
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleCopyJump(jump.id, e)}
                        title="Copy jump"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Load More Section - Hidden when searching */}
          {!debouncedSearch && hasMore && (
            <div className="flex flex-col items-center gap-2 pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {jumps.length} of {total} jumps
              </p>
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                size="lg"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>Load More Jumps</>
                )}
              </Button>
            </div>
          )}

          {!debouncedSearch && !hasMore && jumps.length > 0 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                All {total} jumps loaded
              </p>
            </div>
          )}

          {debouncedSearch && jumps.length > 0 && (
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {jumps.length} of {total} matching jump{total !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Floating Sign Selected Button */}
          {signatureMode && selectedJumps.size > 0 && (
            <div className="fixed bottom-20 left-0 right-0 flex justify-center z-40 px-4">
              <Button
                size="lg"
                className="shadow-lg"
                onClick={() => setShowSignatureModal(true)}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Sign Selected ({selectedJumps.size})
              </Button>
            </div>
          )}

          <BulkSignatureModal
            open={showSignatureModal}
            onOpenChange={setShowSignatureModal}
            onConfirm={handleBulkSign}
            loading={signing}
            jumpCount={selectedJumps.size}
          />
        </>
      )}
    </div>
  )
}
