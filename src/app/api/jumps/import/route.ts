import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

// Unit conversion constants
const FEET_TO_METERS = 0.3048
const METERS_TO_FEET = 3.28084

type UnitPreference = "METRIC" | "IMPERIAL"

// Convert altitude based on source and target units
function convertAltitude(
  value: number,
  fromUnit: UnitPreference,
  toUnit: UnitPreference
): number {
  if (fromUnit === toUnit) return value

  if (fromUnit === "IMPERIAL" && toUnit === "METRIC") {
    // Feet to meters
    return Math.round(value * FEET_TO_METERS)
  } else {
    // Meters to feet
    return Math.round(value * METERS_TO_FEET)
  }
}

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
    const { jumps, overwrite = false, csvAltitudeUnit = "IMPERIAL" } = body

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

    // Log unit conversion info
    if (csvAltitudeUnit !== userRecord.unitPreference) {
      console.log(
        `Converting altitudes from ${csvAltitudeUnit} to ${userRecord.unitPreference}`
      )
    } else {
      console.log(`No altitude conversion needed - both use ${csvAltitudeUnit}`)
    }

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

        // Parse altitude values and convert if needed
        const rawExitAltitude = jump.exitaltitude || jump.exitAltitude
        const rawDeploymentAltitude = jump.deploymentaltitude || jump.deploymentAltitude

        const exitAltitude = rawExitAltitude
          ? convertAltitude(
              parseInt(rawExitAltitude),
              csvAltitudeUnit as UnitPreference,
              userRecord.unitPreference
            )
          : undefined

        const deploymentAltitude = rawDeploymentAltitude
          ? convertAltitude(
              parseInt(rawDeploymentAltitude),
              csvAltitudeUnit as UnitPreference,
              userRecord.unitPreference
            )
          : undefined

        // Parse boolean fields (yes/no, true/false, 1/0)
        const parseBoolean = (value: any) => {
          const val = (value || "").toString().toLowerCase()
          return ["yes", "true", "1"].includes(val)
        }

        const isWorkJump = parseBoolean(jump.workjump || jump.workJump)
        const isCutaway = parseBoolean(jump.iscutaway || jump.isCutaway)
        const hasHandcam = parseBoolean(jump.hashandcam || jump.hasHandcam)

        // Find or create rig if specified
        const rigName = jump.rig
        let rigId = null
        if (rigName) {
          const existingRig = await prisma.rig.findFirst({
            where: {
              userId: user.id,
              name: rigName,
            },
          })
          if (existingRig) {
            rigId = existingRig.id
          }
          // Note: We don't auto-create rigs since they require component setup
        }

        const jumpData = {
          userId: user.id,
          jumpNumber,
          date: new Date(date),
          dropzoneId,
          aircraftId: aircraftId || undefined,
          jumpTypeId: jumpTypeId || undefined,
          rigId: rigId || undefined,
          exitAltitude,
          deploymentAltitude,
          freefallTime: jump.freefalltime || jump.freefallTime
            ? parseInt(jump.freefalltime || jump.freefallTime)
            : undefined,
          isCutaway,
          isWorkJump,
          workJumpType: (jump.workjumptype || jump.workJumpType) || undefined,
          customerName: (jump.customername || jump.customerName) || undefined,
          hasHandcam,
          photoUrl: (jump.photourl || jump.photoUrl) || undefined,
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
