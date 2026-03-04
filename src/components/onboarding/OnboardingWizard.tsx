"use client"

import { useState } from "react"
import { ProfileBlock } from "./blocks/ProfileBlock"
import { DropzoneBlock } from "./blocks/DropzoneBlock"
import { JumpHistoryBlock } from "./blocks/JumpHistoryBlock"
import { JumperTypeBlock } from "./blocks/JumperTypeBlock"
import { InvoiceSetupBlock } from "./blocks/InvoiceSetupBlock"
import { DoneBlock } from "./blocks/DoneBlock"

export type WizardBlock =
  | "profile"
  | "dropzone"
  | "jump-history"
  | "jumper-type"
  | "invoice-setup"
  | "done"

export interface WizardState {
  unitPreference: "IMPERIAL" | "METRIC"
  defaultDropzoneId: string
  isWorkingSkydiver: boolean
}

const CONTENT_BLOCKS: WizardBlock[] = [
  "profile",
  "dropzone",
  "jump-history",
  "jumper-type",
]

function getProgressInfo(
  currentBlock: WizardBlock,
  isWorkingSkydiver: boolean
): { current: number; total: number } {
  const total = isWorkingSkydiver ? 5 : 4
  const map: Record<WizardBlock, number> = {
    profile: 1,
    dropzone: 2,
    "jump-history": 3,
    "jumper-type": 4,
    "invoice-setup": 5,
    done: total,
  }
  return { current: map[currentBlock] ?? total, total }
}

export function OnboardingWizard() {
  const [currentBlock, setCurrentBlock] = useState<WizardBlock>("profile")
  const [wizardState, setWizardState] = useState<WizardState>({
    unitPreference: "IMPERIAL",
    defaultDropzoneId: "",
    isWorkingSkydiver: false,
  })

  const updateState = (partial: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...partial }))
  }

  const advance = (next: WizardBlock) => setCurrentBlock(next)

  const { current, total } = getProgressInfo(currentBlock, wizardState.isWorkingSkydiver)
  const progressPct = currentBlock === "done" ? 100 : Math.round((current / total) * 100)

  return (
    <div className="w-full max-w-[480px]">
      {/* Progress bar */}
      {currentBlock !== "done" && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Step {current} of {total}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {currentBlock === "profile" && (
        <ProfileBlock
          onNext={(data) => {
            updateState({ unitPreference: data.unitPreference })
            advance("dropzone")
          }}
        />
      )}

      {currentBlock === "dropzone" && (
        <DropzoneBlock
          unitPreference={wizardState.unitPreference}
          onNext={(dzId) => {
            if (dzId) updateState({ defaultDropzoneId: dzId })
            advance("jump-history")
          }}
        />
      )}

      {currentBlock === "jump-history" && (
        <JumpHistoryBlock
          onNext={() => {
            advance("jumper-type")
          }}
        />
      )}

      {currentBlock === "jumper-type" && (
        <JumperTypeBlock
          onNext={(isWorking) => {
            updateState({ isWorkingSkydiver: isWorking })
            if (isWorking) {
              advance("invoice-setup")
            } else {
              advance("done")
            }
          }}
        />
      )}

      {currentBlock === "invoice-setup" && (
        <InvoiceSetupBlock
          defaultDropzoneId={wizardState.defaultDropzoneId}
          onNext={() => advance("done")}
        />
      )}

      {currentBlock === "done" && (
        <DoneBlock
          isWorkingSkydiver={wizardState.isWorkingSkydiver}
          defaultDropzoneId={wizardState.defaultDropzoneId}
        />
      )}
    </div>
  )
}
