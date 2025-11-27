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
    let skipped = 0
    let maxJumpNumber = userRecord.currentJumpNumber - 1
    const errors: Array<{ jumpNumber: number; reason: string }> = []

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
        const dateStr = jump.date
        const dropzoneName = jump.dropzone

        if (!jumpNumber || !dateStr || !dropzoneName) {
          const reason = !jumpNumber ? "missing jump number" : !dateStr ? "missing date" : "missing dropzone"
          errors.push({ jumpNumber: jumpNumber || 0, reason })
          skipped++
          continue
        }

        // Parse date with multiple format support
        let parsedDate: Date
        try {
          // Try parsing various date formats
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            // Try parsing DD/MM/YYYY or MM/DD/YYYY
            const parts = dateStr.split(/[-/]/)
            if (parts.length === 3) {
              // Try DD/MM/YYYY first (common in Europe)
              const d1 = new Date(parts[2], parts[1] - 1, parts[0])
              if (!isNaN(d1.getTime())) {
                parsedDate = d1
              } else {
                // Try MM/DD/YYYY (common in US)
                const d2 = new Date(parts[2], parts[0] - 1, parts[1])
                if (!isNaN(d2.getTime())) {
                  parsedDate = d2
                } else {
                  throw new Error("Invalid date format")
                }
              }
            } else {
              throw new Error("Invalid date format")
            }
          } else {
            parsedDate = date
          }
        } catch (dateError) {
          errors.push({ jumpNumber, reason: `invalid date format: "${dateStr}"` })
          skipped++
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

        // Parse and validate workJumpType
        const rawWorkJumpType = jump.workjumptype || jump.workJumpType
        let workJumpType: string | undefined = undefined
        if (rawWorkJumpType) {
          const normalized = rawWorkJumpType.toString().toUpperCase()
          // Validate against enum values
          if (["AFF", "TANDEM", "CAMERA", "COACH"].includes(normalized)) {
            workJumpType = normalized
          }
        }

        // Parse gear components from rig/gear column
        // Every item in the column is treated as a separate gear component
        // Example: "Mirage G4, Crossfire 2 149" creates two components
        const rawGearValue = jump.rig || jump.gear
        const gearComponentIds: string[] = []

        if (rawGearValue) {
          // Split by comma - each item is a separate component
          const componentNames = rawGearValue
            .toString()
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean)

          // Create a lookup map for existing gear components
          const existingGearComponents = await prisma.gearComponent.findMany({
            where: {
              userId: user.id,
              name: { in: componentNames },
            },
          })

          const existingGearMap = new Map(
            existingGearComponents.map((gc) => [gc.name.toLowerCase(), gc.id])
          )

          // For each component name, find or create the gear component
          for (const componentName of componentNames) {
            const normalizedName = componentName.toLowerCase()
            let gearComponentId = existingGearMap.get(normalizedName)

            if (!gearComponentId) {
              // Create new gear component
              const newGearComponent = await prisma.gearComponent.create({
                data: {
                  userId: user.id,
                  type: "OTHER",
                  name: componentName,
                  manufacturer: "Unknown",
                  isActive: true,
                },
              })
              gearComponentId = newGearComponent.id
              existingGearMap.set(normalizedName, gearComponentId)
              console.log(`Auto-created gear component: ${componentName}`)
            }

            gearComponentIds.push(gearComponentId)
          }
        }

        // Parse distance to target with unit conversion
        const rawDistanceToTarget = jump.distancetotarget || jump.distanceToTarget
        const distanceToTarget = rawDistanceToTarget
          ? convertAltitude(
              parseInt(rawDistanceToTarget),
              csvAltitudeUnit as UnitPreference,
              userRecord.unitPreference
            )
          : undefined

        // IMPORTANT: Work jumps imported are marked as "already paid"
        // This prevents them from appearing in uninvoiced jumps list
        // while still maintaining accurate work jump records for reporting
        const jumpData = {
          userId: user.id,
          jumpNumber,
          date: parsedDate,
          dropzoneId,
          aircraftId: aircraftId || undefined,
          jumpTypeId: jumpTypeId || undefined,
          rigId: undefined, // Don't link to rig on import
          exitAltitude,
          deploymentAltitude,
          freefallTime: jump.freefalltime || jump.freefallTime
            ? parseInt(jump.freefalltime || jump.freefallTime)
            : undefined,
          distanceToTarget,
          isCutaway,
          isWorkJump,
          workJumpType: workJumpType as any,
          customerName: (jump.customername || jump.customerName) || undefined,
          hasHandcam,
          isImportedAsPaid: isWorkJump, // Mark work jumps as already paid on import
          photoUrl: (jump.photourl || jump.photoUrl) || undefined,
          notes: jump.notes || undefined,
        }

        if (existingJump) {
          if (overwrite) {
            // Update existing jump and gear components
            await prisma.$transaction(async (tx) => {
              await tx.jump.update({
                where: { id: existingJump.id },
                data: jumpData,
              })

              // Delete existing gear component links
              await tx.jumpGearComponent.deleteMany({
                where: { jumpId: existingJump.id },
              })

              // Create new gear component links
              if (gearComponentIds.length > 0) {
                await tx.jumpGearComponent.createMany({
                  data: gearComponentIds.map((gearComponentId) => ({
                    jumpId: existingJump.id,
                    gearComponentId,
                  })),
                })
              }
            })
            updated++
          } else {
            errors.push({ jumpNumber, reason: "already exists (enable overwrite to update)" })
            skipped++
            continue
          }
        } else {
          // Create new jump with gear components
          await prisma.$transaction(async (tx) => {
            const newJump = await tx.jump.create({
              data: jumpData,
            })

            // Link gear components to the jump
            if (gearComponentIds.length > 0) {
              await tx.jumpGearComponent.createMany({
                data: gearComponentIds.map((gearComponentId) => ({
                  jumpId: newJump.id,
                  gearComponentId,
                })),
              })
            }
          })
          imported++
        }

        // Track highest jump number
        if (jumpNumber > maxJumpNumber) {
          maxJumpNumber = jumpNumber
        }
      } catch (error: any) {
        const errorMessage = error.message || "Unknown error"
        errors.push({ jumpNumber: parseInt(jump.jumpnumber || jump.jumpNumber || "0"), reason: errorMessage })
        skipped++
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

    // Prepare summary
    const summary = {
      success: true,
      imported,
      updated,
      skipped,
      total: jumps.length,
      nextJumpNumber: maxJumpNumber + 1,
      errors: errors.slice(0, 50), // Limit to first 50 errors to avoid huge responses
      hasMoreErrors: errors.length > 50,
    }

    console.log("Import complete:", summary)

    return NextResponse.json(summary)
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Import failed", details: (error as Error).message },
      { status: 500 }
    )
  }
}
