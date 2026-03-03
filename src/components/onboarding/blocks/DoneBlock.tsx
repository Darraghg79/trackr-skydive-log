"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface DoneBlockProps {
  isWorkingSkydiver: boolean
  defaultDropzoneId: string
  redirectToImportAfterOnboarding: boolean
}

export function DoneBlock({
  isWorkingSkydiver,
  defaultDropzoneId,
  redirectToImportAfterOnboarding,
}: DoneBlockProps) {
  const router = useRouter()
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

    // Mark onboarding as complete
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
        // Non-critical — user can still navigate
      } finally {
        setCompleting(false)
      }
    }
    complete()
  }, [isWorkingSkydiver, defaultDropzoneId])

  const handleGoTo = (path: string) => {
    if (redirectToImportAfterOnboarding) {
      router.push("/settings/import")
    } else {
      router.push(path)
    }
    router.refresh()
  }

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
            <p>
              All your profile settings can be updated from the{" "}
              <strong className="text-foreground">Settings</strong> menu.
            </p>
          </div>
        ) : (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your profile is configured. Start logging jumps, track your gear, and explore your stats.
            </p>
            <p>
              You can update any of your settings at any time from the{" "}
              <strong className="text-foreground">Settings</strong> menu.
            </p>
          </div>
        )}

        {redirectToImportAfterOnboarding && (
          <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
            You&apos;ll be taken to the import page to bring in your existing logbook.
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={() => handleGoTo("/jumps/new")} className="w-full">
            Log a Jump
          </Button>
          <Button variant="outline" onClick={() => handleGoTo("/home")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
