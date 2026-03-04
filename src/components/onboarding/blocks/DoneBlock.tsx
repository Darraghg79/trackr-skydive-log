"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DoneBlockProps {
  isWorkingSkydiver: boolean
  defaultDropzoneId: string
}

export function DoneBlock({
  isWorkingSkydiver,
  defaultDropzoneId,
}: DoneBlockProps) {
  const [completing, setCompleting] = useState(true)
  const [dzName, setDzName] = useState("")

  useEffect(() => {
    // Fetch DZ name for the working skydiver copy
    if (isWorkingSkydiver && defaultDropzoneId) {
      fetch(`/api/dropzones/${defaultDropzoneId}`, { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data?.name) setDzName(data.name) })
        .catch(() => {})
    }

    // Mark onboarding as complete, then hard-navigate to /jumps.
    // Using window.location.href instead of router.push ensures the server
    // layout re-runs a fresh DB check and sees hasCompletedOnboarding: true.
    const complete = async () => {
      try {
        await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hasCompletedOnboarding: true,
            ...(isWorkingSkydiver ? { isWorkingSkydiver: true } : {}),
          }),
        })
      } catch {
        // Non-critical — redirect regardless
      } finally {
        setCompleting(false)
        setTimeout(() => {
          window.location.href = "/jumps"
        }, 2500)
      }
    }
    complete()
  }, [isWorkingSkydiver, defaultDropzoneId])

  if (completing) {
    return (
      <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">You&apos;re all set! 🎉</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {isWorkingSkydiver ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            {dzName && (
              <p>
                Your invoice settings are saved for <strong className="text-foreground">{dzName}</strong>. When you&apos;ve done work jumps, head to{" "}
                <strong className="text-foreground">Invoices</strong> to generate them.
              </p>
            )}
            <p>
              You can manage rates for multiple dropzones at any time from{" "}
              <strong className="text-foreground">Dropzones → Edit</strong>.
            </p>
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground text-center">
          That&apos;s it, you&apos;re ready to log jumps. You can import previous history from Settings whenever you like.
        </p>

        <p className="text-xs text-muted-foreground text-center">
          Taking you to your logbook…
        </p>
      </CardContent>
    </Card>
  )
}
