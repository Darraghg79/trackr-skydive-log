"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface JumperTypeBlockProps {
  onNext: (isWorkingSkydiver: boolean) => void
}

export function JumperTypeBlock({ onNext }: JumperTypeBlockProps) {
  const [selected, setSelected] = useState<"fun" | "working" | null>(null)

  const handleSubmit = () => {
    onNext(selected === "working")
  }

  const handleSkip = () => {
    // Default to fun jumper path
    onNext(false)
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Are you a working skydiver?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Fun jumper card */}
        <button
          type="button"
          onClick={() => setSelected("fun")}
          className={cn(
            "w-full text-left rounded-lg border-2 p-4 transition-all",
            selected === "fun"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🪂</span>
            <div>
              <p className="font-semibold text-sm">Fun jumper</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                I jump for fun. I want to log my jumps and track my gear.
              </p>
            </div>
          </div>
        </button>

        {/* Working skydiver card */}
        <button
          type="button"
          onClick={() => setSelected("working")}
          className={cn(
            "w-full text-left rounded-lg border-2 p-4 transition-all",
            selected === "working"
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
          )}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <p className="font-semibold text-sm">Working skydiver (TI / Coach / AFFI)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                I do paid work jumps and need to invoice dropzones.
              </p>
            </div>
          </div>
        </button>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!selected}
            className="flex-1"
          >
            Continue
          </Button>
          <Button variant="ghost" onClick={handleSkip} className="text-sm">
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
