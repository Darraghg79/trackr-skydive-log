"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function RigsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/gear?tab=rigs")
  }, [router])

  return null
}
