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
    const { jumps, overwrite = false } = body

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
    let updated = 0
    let maxJumpNumber = userRecord.currentJumpNumber - 1

    for (const jump of jumps) {
      try {
        // Required fields
        const jumpNumber = parseInt(jump.jumpnumber || jump.jumpNumber || jump.number || "0")
        const date = jump.date
        const dropzoneName = jump.dropzone

        if (!jumpNumber || !date || !dropzoneName) {
          console.warn("Skipping jump: missing required fields", jump)
          continue
        }

        // Find or create dropzone
        let dropzoneId = dropzoneMap.get(dropzoneName.toLowerCase())
        if (!dropzoneId) {
          // Auto-create dropzone with minimal required fields
          const newDropzone = await prisma.dropzone.create({
            data: {
              userId: user.id,
              name: dropzoneName,
              address: "Imported - Update required",
              country: "Unknown",
              currency: "USD",
            },
          })
          dropzoneId = newDropzone.id
          dropzoneMap.set(dropzoneName.toLowerCase(), dropzoneId)
          console.log(`Auto-created dropzone: ${dropzoneName}`)
        }

        // Optional fields - find or create aircraft
        const aircraftName = jump.aircraft
        let aircraftId = null
        if (aircraftName) {
          aircraftId = aircraftMap.get(aircraftName.toLowerCase())
          if (!aircraftId) {
            // Auto-create aircraft
            const newAircraft = await prisma.userAircraft.create({
              data: {
                userId: user.id,
                name: aircraftName,
              },
            })
            aircraftId = newAircraft.id
            aircraftMap.set(aircraftName.toLowerCase(), aircraftId)
            console.log(`Auto-created aircraft: ${aircraftName}`)
          }
        }

        // Find or create jump type
        const jumpTypeName = jump.jumptype || jump.jumpType
        let jumpTypeId = null
        if (jumpTypeName) {
          jumpTypeId = jumpTypeMap.get(jumpTypeName.toLowerCase())
          if (!jumpTypeId) {
            // Auto-create jump type
            const newJumpType = await prisma.userJumpType.create({
              data: {
                userId: user.id,
                name: jumpTypeName,
              },
            })
            jumpTypeId = newJumpType.id
            jumpTypeMap.set(jumpTypeName.toLowerCase(), jumpTypeId)
            console.log(`Auto-created jump type: ${jumpTypeName}`)
          }
        }

        // Check if jump with this number already exists
        const existingJump = await prisma.jump.findFirst({
          where: {
            userId: user.id,
            jumpNumber: jumpNumber,
          },
        })

        const jumpData = {
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
        }

        if (existingJump) {
          if (overwrite) {
            // Update existing jump
            await prisma.jump.update({
              where: { id: existingJump.id },
              data: jumpData,
            })
            updated++
          } else {
            console.warn(`Jump #${jumpNumber} already exists - skipping (use overwrite mode to update)`)
            continue
          }
        } else {
          // Create new jump
          await prisma.jump.create({
            data: jumpData,
          })
          imported++
        }

        // Track highest jump number
        if (jumpNumber > maxJumpNumber) {
          maxJumpNumber = jumpNumber
        }
      } catch (error) {
        console.error("Failed to import jump:", jump, error)
      }
    }

    // Update user's current jump number to continue from imported max
    if (imported > 0 || updated > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { currentJumpNumber: maxJumpNumber + 1 },
      })
    }

    return NextResponse.json({
      success: true,
      imported,
      updated,
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
