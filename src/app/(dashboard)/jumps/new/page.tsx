"use client"

import { useEffect, useState } from "react"
import { JumpForm } from "@/components/forms/JumpForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function NewJumpPage() {
  const [copiedData, setCopiedData] = useState<any>(null)
  const [isCopy, setIsCopy] = useState(false)
  const [isCheckingStorage, setIsCheckingStorage] = useState(true)

  useEffect(() => {
    // Check if there's copied jump data in sessionStorage
    const storedData = sessionStorage.getItem("copyJumpData")
    console.log("[NewJumpPage] Checking sessionStorage, found:", storedData ? "data" : "nothing")

    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData)
        console.log("[NewJumpPage] Loaded copied data from sessionStorage:", parsedData)
        console.log("[NewJumpPage] Key fields:", {
          dropzoneId: parsedData.dropzoneId,
          exitAltitude: parsedData.exitAltitude,
          deploymentAltitude: parsedData.deploymentAltitude,
          aircraftId: parsedData.aircraftId,
          jumpTypeId: parsedData.jumpTypeId,
        })
        setCopiedData(parsedData)
        setIsCopy(true)
        // Clear the sessionStorage after reading
        sessionStorage.removeItem("copyJumpData")
      } catch (error) {
        console.error("Failed to parse copied jump data:", error)
      }
    } else {
      console.log("[NewJumpPage] No copied data - this is a new jump")
    }
    // Mark that we've finished checking storage
    setIsCheckingStorage(false)
  }, [])

  // Don't render JumpForm until we've checked sessionStorage
  // This ensures initialData has the correct value on first render
  if (isCheckingStorage) {
    return null
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isCopy ? "Copy Jump" : "Log New Jump"}
          </CardTitle>
          <CardDescription>
            {isCopy
              ? "Pre-filled with data from the copied jump. Review and submit to log."
              : "Record your jump details and update your logbook"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JumpForm key={copiedData ? "copy" : "new"} initialData={copiedData} />
        </CardContent>
      </Card>
    </div>
  )
}
