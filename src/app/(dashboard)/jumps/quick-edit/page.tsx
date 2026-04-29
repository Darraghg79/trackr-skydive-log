"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { useToast } from "@/hooks/useToast"
import {
  QuickEditRow,
  type QuickEditJump,
  type QuickEditChange,
  type JumpType,
} from "@/components/jumps/QuickEditRow"
import { ArrowLeft, CalendarDays, Loader2, Plane } from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DateScope = 'today' | 'last7' | 'custom'

interface CustomRange {
  start: string
  end: string
}

type BulkUpdateResult = {
  id: string
  success: boolean
  error?: string
}

export default function QuickEditPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [jumps, setJumps] = useState<QuickEditJump[]>([])
  const [jumpTypes, setJumpTypes] = useState<JumpType[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scope, setScope] = useState<DateScope>('today')
  const [customRange, setCustomRange] = useState<CustomRange>({
    start: format(subDays(new Date(), 6), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  })
  const [showCustomPicker, setShowCustomPicker] = useState(false)

  // Map of jumpId → pending changes (only dirty rows are present)
  const [pendingChanges, setPendingChanges] = useState<Map<string, QuickEditChange>>(new Map())
  // Set of jump IDs that failed the last save attempt
  const [failedIds, setFailedIds] = useState<Set<string>>(new Set())

  // Discard confirmation dialog
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const pendingNavAction = useRef<(() => void) | null>(null)

  const isDirty = pendingChanges.size > 0

  // Intercept browser back button when there are unsaved changes
  useEffect(() => {
    if (!isDirty) return

    // Push a sentinel history entry so we can catch popstate
    history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      if (isDirty) {
        // Re-push to prevent navigation, then show the discard dialog
        history.pushState(null, '', window.location.href)
        pendingNavAction.current = () => router.back()
        setShowDiscardDialog(true)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [isDirty, router])

  // Warn on browser-level close / refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const dateParams = useCallback((): { startDate: string; endDate: string } => {
    const today = new Date()
    if (scope === 'today') {
      const d = format(today, 'yyyy-MM-dd')
      return { startDate: d, endDate: d }
    }
    if (scope === 'last7') {
      return {
        startDate: format(subDays(today, 6), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      }
    }
    return { startDate: customRange.start, endDate: customRange.end }
  }, [scope, customRange])

  const fetchJumps = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = dateParams()
      const url = `/api/jumps?limit=200&orderBy=jumpNumber&order=desc&startDate=${startDate}&endDate=${endDate}&t=${Date.now()}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      const raw = (data.data || []) as Array<{
        id: string
        jumpNumber: number
        customerName: string | null
        jumpTypeId: string | null
        hasHandcam: boolean
        workJumpType: string | null
        isWorkJump: boolean
      }>
      setJumps(raw.map(j => ({
        id: j.id,
        jumpNumber: j.jumpNumber,
        customerName: j.customerName,
        jumpTypeId: j.jumpTypeId,
        hasHandcam: j.hasHandcam,
        workJumpType: j.workJumpType,
        isWorkJump: j.isWorkJump,
      })))
    } catch {
      toast({ title: 'Failed to load jumps', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [dateParams, toast])

  const fetchJumpTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/user-jump-types?t=' + Date.now(), { cache: 'no-store' })
      const data = await res.json()
      setJumpTypes((data.data ?? []).map((jt: { id: string; name: string }) => ({ id: jt.id, name: jt.name })))
    } catch {
      // Non-fatal — dropdown just stays empty
    }
  }, [])

  useEffect(() => {
    fetchJumps()
    fetchJumpTypes()
  }, [fetchJumps, fetchJumpTypes])

  // Refetch when scope changes (but not on initial mount — covered above)
  const isFirstMount = useRef(true)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    // Clear pending changes when scope changes so stale edits don't persist
    setPendingChanges(new Map())
    setFailedIds(new Set())
    fetchJumps()
  }, [scope, customRange, fetchJumps])

  const handleChange = useCallback((jumpId: string, change: QuickEditChange) => {
    setPendingChanges(prev => {
      const next = new Map(prev)
      // Find the original jump to diff against
      const original = jumps.find(j => j.id === jumpId)
      if (!original) return next

      // Merge this change onto whatever is already pending for this jump
      const current = next.get(jumpId) ?? {}
      const merged: QuickEditChange = { ...current, ...change }

      // Remove from pending map if merged state matches original (no actual changes)
      const matchesOriginal =
        (!('customerName' in merged) || merged.customerName === original.customerName) &&
        (!('jumpTypeId' in merged) || merged.jumpTypeId === original.jumpTypeId) &&
        (!('hasHandcam' in merged) || merged.hasHandcam === original.hasHandcam)

      if (matchesOriginal) {
        next.delete(jumpId)
      } else {
        next.set(jumpId, merged)
      }
      return next
    })
    // Clear this jump's failure flag when the user edits it again
    setFailedIds(prev => {
      if (!prev.has(jumpId)) return prev
      const next = new Set(prev)
      next.delete(jumpId)
      return next
    })
  }, [jumps])

  const handleSave = async () => {
    if (pendingChanges.size === 0) return

    setSaving(true)
    try {
      const updates = Array.from(pendingChanges.entries()).map(([id, change]) => ({
        id,
        ...change,
      }))

      const res = await fetch('/api/jumps/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      const data: { results: BulkUpdateResult[]; successCount: number; failureCount: number } = await res.json()

      if (!res.ok) {
        throw new Error(data as unknown as string)
      }

      const newFailedIds = new Set<string>(
        data.results.filter(r => !r.success).map(r => r.id)
      )

      if (newFailedIds.size === 0) {
        // All succeeded — clear state and navigate back
        toast({
          title: `Saved ${data.successCount} jump${data.successCount !== 1 ? 's' : ''}`,
        })
        setPendingChanges(new Map())
        setFailedIds(new Set())
        router.push('/jumps')
      } else {
        // Partial failure — keep the user on the screen, surface failed rows
        setFailedIds(newFailedIds)
        // Remove successfully saved rows from pending
        setPendingChanges(prev => {
          const next = new Map(prev)
          data.results.filter(r => r.success).forEach(r => next.delete(r.id))
          return next
        })
        toast({
          title: `${data.failureCount} jump${data.failureCount !== 1 ? 's' : ''} failed to save`,
          description: 'Retry or discard the highlighted rows.',
          variant: 'destructive',
        })
      }
    } catch {
      toast({ title: 'Failed to save changes', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!isDirty) {
      router.push('/jumps')
      return
    }
    pendingNavAction.current = () => router.push('/jumps')
    setShowDiscardDialog(true)
  }

  const confirmDiscard = () => {
    setShowDiscardDialog(false)
    setPendingChanges(new Map())
    setFailedIds(new Set())
    const action = pendingNavAction.current
    pendingNavAction.current = null
    action?.()
  }

  const scopeLabel: Record<DateScope, string> = {
    today: 'Today',
    last7: 'Last 7 days',
    custom: `${customRange.start} – ${customRange.end}`,
  }

  return (
    <div className="space-y-4 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleCancel} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Quick Edit</h1>
      </div>

      {/* Date scope chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(['today', 'last7'] as DateScope[]).map((s) => (
          <Button
            key={s}
            variant={scope === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScope(s)}
          >
            {s === 'today' ? 'Today' : 'Last 7 days'}
          </Button>
        ))}
        <Button
          variant={scope === 'custom' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setScope('custom')
            setShowCustomPicker(true)
          }}
        >
          <CalendarDays className="h-4 w-4 mr-1" />
          Custom range
        </Button>
      </div>

      {/* Custom range inline picker */}
      {showCustomPicker && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">From</label>
                <input
                  type="date"
                  value={customRange.start}
                  max={customRange.end}
                  onChange={(e) => setCustomRange(r => ({ ...r, start: e.target.value }))}
                  className="border rounded px-2 py-1 text-sm bg-background"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">To</label>
                <input
                  type="date"
                  value={customRange.end}
                  min={customRange.start}
                  max={format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) => setCustomRange(r => ({ ...r, end: e.target.value }))}
                  className="border rounded px-2 py-1 text-sm bg-background"
                />
              </div>
              <Button size="sm" onClick={() => setShowCustomPicker(false)}>Apply</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <PageLoader />
      ) : jumps.length === 0 ? (
        // Empty state
        <Card>
          <CardContent className="py-16 flex flex-col items-center text-center gap-4">
            <Plane className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-semibold text-lg">
                {scope === 'today' ? 'No jumps today' : 'No jumps in this range'}
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {scope === 'today'
                  ? 'Nothing logged today yet.'
                  : 'Try expanding the date range.'}
              </p>
            </div>
            {scope === 'today' && (
              <Button variant="outline" onClick={() => setScope('last7')}>
                Show last 7 days
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Showing {jumps.length} jump{jumps.length !== 1 ? 's' : ''} — {scopeLabel[scope]}
          </p>
          <div className="space-y-3">
            {jumps.map((jump) => (
              <QuickEditRow
                key={jump.id}
                jump={jump}
                jumpTypes={jumpTypes}
                pending={pendingChanges.get(jump.id)}
                failed={failedIds.has(jump.id)}
                onChange={handleChange}
              />
            ))}
          </div>
        </>
      )}

      {/* Sticky save bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 py-3">
        <div className="container max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={pendingChanges.size === 0 || saving}
            className="min-w-[11rem]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : pendingChanges.size > 0 ? (
              `Save changes (${pendingChanges.size})`
            ) : (
              'No changes'
            )}
          </Button>
        </div>
      </div>

      {/* Discard confirmation */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''}. They will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { pendingNavAction.current = null }}>
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
