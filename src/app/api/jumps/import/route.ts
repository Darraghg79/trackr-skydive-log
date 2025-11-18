import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { jumps } = body

    if (!Array.isArray(jumps) || jumps.length === 0) {
      return NextResponse.json(
        { error: "Invalid data: jumps array required" },
        { status: 400 }
      )
    }

    // Get user's dropzones, aircraft, and jump types for matching
    const [dropzones, aircrafts, jumpTypes, userRecord] = await Promise.all([
      prisma.dropzone.findMany({ where: { userId: user.id } }),
      prisma.userAircraft.findMany({ where: { userId: user.id } }),
      prisma.userJumpType.findMany({ where: { userId: user.id } }),
      prisma.user.findUnique({ where: { id: user.id } }),
    ])

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Create dropzone/aircraft/jumptype lookup maps
    const dropzoneMap = new Map(dropzones.map((dz) => [dz.name.toLowerCase(), dz.id]))
    const aircraftMap = new Map(aircrafts.map((ac) => [ac.name.toLowerCase(), ac.id]))
    const jumpTypeMap = new Map(jumpTypes.map((jt) => [jt.name.toLowerCase(), jt.id]))

    let imported = 0
    let maxJumpNumber = userRecord.currentJumpNumber - 1

    for (const jump of jumps) {
      try {
        // Required fields
        const jumpNumber = parseInt(jump.jumpnumber || jump.jumpNumber || jump.number || "0")
        const date = jump.date
        const dropzoneName = jump.dropzone?.toLowerCase()

        if (!jumpNumber || !date || !dropzoneName) {
          console.warn("Skipping jump: missing required fields", jump)
          continue
        }

        // Find dropzone ID
        const dropzoneId = dropzoneMap.get(dropzoneName)
        if (!dropzoneId) {
          console.warn(`Dropzone not found: ${dropzoneName}`)
          continue
        }

        // Optional fields
        const aircraftName = jump.aircraft?.toLowerCase()
        const jumpTypeName = jump.jumptype?.toLowerCase() || jump.jumpType?.toLowerCase()

        const aircraftId = aircraftName ? aircraftMap.get(aircraftName) : null
        const jumpTypeId = jumpTypeName ? jumpTypeMap.get(jumpTypeName) : null

        // Create jump
        await prisma.jump.create({
          data: {
            userId: user.id,
            jumpNumber,
            date: new Date(date),
            dropzoneId,
            aircraftId: aircraftId || undefined,
            jumpTypeId: jumpTypeId || undefined,
            exitAltitude: jump.exitaltitude || jump.exitAltitude
              ? parseInt(jump.exitaltitude || jump.exitAltitude)
              : undefined,
            deploymentAltitude: jump.deploymentaltitude || jump.deploymentAltitude
              ? parseInt(jump.deploymentaltitude || jump.deploymentAltitude)
              : undefined,
            freefallTime: jump.freefalltime || jump.freefallTime
              ? parseInt(jump.freefalltime || jump.freefallTime)
              : undefined,
            notes: jump.notes || undefined,
          },
        })

        imported++

        // Track highest jump number
        if (jumpNumber > maxJumpNumber) {
          maxJumpNumber = jumpNumber
        }
      } catch (error) {
        console.error("Failed to import jump:", jump, error)
      }
    }

    // Update user's current jump number to continue from imported max
    if (imported > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentJumpNumber: maxJumpNumber + 1 },
      })
    }

    return NextResponse.json({
      success: true,
      imported,
      nextJumpNumber: maxJumpNumber + 1,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    )
  }
}
