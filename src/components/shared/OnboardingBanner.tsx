"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, MapPin, Plane, FileText, Upload, X } from "lucide-react"

interface OnboardingBannerProps {
  hasJumps: boolean
  hasDropzones: boolean
  hasAircraft: boolean
}

export function OnboardingBanner({ hasJumps, hasDropzones, hasAircraft }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  // Show if user is new and hasn't completed setup
  const showOnboarding = !hasJumps || !hasDropzones || !hasAircraft

  if (dismissed || !showOnboarding) {
    return null
  }

  const steps = [
    {
      title: "Add Dropzones",
      description: "Set up your favorite dropzone locations",
      completed: hasDropzones,
      icon: MapPin,
      href: "/dropzones/new",
    },
    {
      title: "Add Aircraft",
      description: "Configure aircraft types you jump from",
      completed: hasAircraft,
      icon: Plane,
      href: "/aircraft/new",
    },
    {
      title: "Log Your First Jump",
      description: "Start tracking your skydiving adventures",
      completed: hasJumps,
      icon: FileText,
      href: "/jumps/new",
    },
  ]

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">Welcome to TrackR! 🪂</CardTitle>
            <CardDescription className="mt-2">
              Let's get your logbook set up in just a few steps
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Steps */}
        <div className="grid gap-3 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <Card
                key={step.title}
                className={step.completed ? "bg-muted/50" : "border-primary/30"}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        step.completed
                          ? "bg-primary/20 text-primary"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      {!step.completed && (
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <Link href={step.href}>
                            {index === 0 ? "Get Started" : "Continue"}
                          </Link>
                        </Button>
                      )}
                      {step.completed && (
                        <p className="text-xs text-primary font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completed
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Import Option */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-3">
            Already have a logbook? Import your existing jumps:
          </p>
          <Button asChild variant="outline">
            <Link href="/settings/import">
              <Upload className="h-4 w-4 mr-2" />
              Import Jumps from CSV
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
