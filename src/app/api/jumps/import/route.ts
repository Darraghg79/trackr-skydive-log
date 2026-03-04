import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"

// Unit conversion constants
const FEET_TO_METERS = 0.3048
const METERS_TO_FEET = 3.28084

type UnitPreference = "METRIC" | "IMPERIAL"

function convertAltitude(
  value: number,
  fromUnit: UnitPreference,
  toUnit: UnitPreference
): number {
  if (fromUnit === toUnit) return value
  if (fromUnit === "IMPERIAL" && toUnit === "METRIC") {
    return Math.round(value * FEET_TO_METERS)
  } else {
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

    // Ensure user record exists
    let userRecord = await prisma.user.findUnique({ where: { id: user.id } })
    if (!userRecord) {
      userRecord = await prisma.user.upsert({
        where: { id: user.id },
        create: { id: user.id, email: user.email! },
        update: {},
      })
    }

    // ─── BULK PRE-FETCH: collect all jump numbers and gear names from the batch ───
    const allJumpNumbers: number[] = []
    const allGearNameSet = new Set<string>()

    for (const jump of jumps) {
      const num = parseInt(jump.jumpnumber || jump.jumpNumber || jump.number || "0")
      if (num > 0) allJumpNumbers.push(num)

      const rawGear = jump.rig || jump.gear
      if (rawGear) {
        rawGear
          .toString()
          .split(",")
          .map((c: string) => c.trim())
          .filter(Boolean)
          .forEach((n: string) => allGearNameSet.add(n))
      }
    }

    // Fetch everything in parallel — one round trip to the DB instead of N+1
    const [dropzones, aircrafts, jumpTypes, existingJumpsInBatch, existingGearComponents] =
      await Promise.all([
        prisma.dropzone.findMany({ where: { userId: user.id } }),
        prisma.userAircraft.findMany({ where: { userId: user.id } }),
        prisma.userJumpType.findMany({ where: { userId: user.id } }),
        allJumpNumbers.length > 0
          ? prisma.jump.findMany({
              where: { userId: user.id, jumpNumber: { in: allJumpNumbers } },
              select: { id: true, jumpNumber: true },
            })
          : Promise.resolve([]),
        allGearNameSet.size > 0
          ? prisma.gearComponent.findMany({
              where: { userId: user.id, name: { in: Array.from(allGearNameSet) } },
            })
          : Promise.resolve([]),
      ])

    // Build lookup maps
    const dropzoneMap = new Map(dropzones.map((dz) => [dz.name.toLowerCase(), dz.id]))
    const aircraftMap = new Map(aircrafts.map((ac) => [ac.name.toLowerCase(), ac.id]))
    const jumpTypeMap = new Map(jumpTypes.map((jt) => [jt.name.toLowerCase(), jt.id]))
    // Map jump number → existing DB id (covers every number in this batch)
    const existingJumpMap = new Map(existingJumpsInBatch.map((j) => [j.jumpNumber, j.id]))
    // Gear component map — lower-cased name → id
    const gearComponentMap = new Map(
      existingGearComponents.map((gc) => [gc.name.toLowerCase(), gc.id])
    )

    // ─── PROCESS LOOP (no findFirst / findMany per jump) ────────────────────────
    let imported = 0
    let updated = 0
    let skipped = 0
    let maxJumpNumber = userRecord.currentJumpNumber - 1
    const errors: Array<{ jumpNumber: number; reason: string }> = []

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

        // Parse date
        let parsedDate: Date
        try {
          const date = new Date(dateStr)
          if (isNaN(date.getTime())) {
            const parts = dateStr.split(/[-/]/)
            if (parts.length === 3) {
              const d1 = new Date(parts[2], parts[1] - 1, parts[0])
              if (!isNaN(d1.getTime())) {
                parsedDate = d1
              } else {
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
        } catch {
          errors.push({ jumpNumber, reason: `invalid date format: "${dateStr}"` })
          skipped++
          continue
        }

        // Find or create dropzone — map avoids repeated DB calls
        let dropzoneId = dropzoneMap.get(dropzoneName.toLowerCase())
        if (!dropzoneId) {
          const newDz = await prisma.dropzone.create({
            data: {
              userId: user.id,
              name: dropzoneName,
              address: "Imported - Update required",
              country: "Unknown",
              currency: "USD",
            },
          })
          dropzoneId = newDz.id
          dropzoneMap.set(dropzoneName.toLowerCase(), dropzoneId)
        }

        // Find or create aircraft
        const aircraftName = jump.aircraft
        let aircraftId: string | null = null
        if (aircraftName) {
          aircraftId = aircraftMap.get(aircraftName.toLowerCase()) ?? null
          if (!aircraftId) {
            const newAc = await prisma.userAircraft.create({
              data: { userId: user.id, name: aircraftName },
            })
            aircraftId = newAc.id
            aircraftMap.set(aircraftName.toLowerCase(), aircraftId)
          }
        }

        // Find or create jump type
        const jumpTypeName = jump.jumptype || jump.jumpType
        let jumpTypeId: string | null = null
        if (jumpTypeName) {
          jumpTypeId = jumpTypeMap.get(jumpTypeName.toLowerCase()) ?? null
          if (!jumpTypeId) {
            const newJt = await prisma.userJumpType.create({
              data: { userId: user.id, name: jumpTypeName },
            })
            jumpTypeId = newJt.id
            jumpTypeMap.set(jumpTypeName.toLowerCase(), jumpTypeId)
          }
        }

        // Resolve gear component IDs from pre-built map (create new ones only if missing)
        const rawGearValue = jump.rig || jump.gear
        const gearComponentIds: string[] = []

        if (rawGearValue) {
          const componentNames = rawGearValue
            .toString()
            .split(",")
            .map((c: string) => c.trim())
            .filter(Boolean)

          for (const componentName of componentNames) {
            const key = componentName.toLowerCase()
            let gcId = gearComponentMap.get(key)

            if (!gcId) {
              const newGc = await prisma.gearComponent.create({
                data: {
                  userId: user.id,
                  type: "OTHER",
                  name: componentName,
                  manufacturer: "Unknown",
                  isActive: true,
                },
              })
              gcId = newGc.id
              gearComponentMap.set(key, gcId)
            }

            gearComponentIds.push(gcId)
          }
        }

        // Altitude / distance conversion
        const rawExitAlt = jump.exitaltitude || jump.exitAltitude
        const rawDeployAlt = jump.deploymentaltitude || jump.deploymentAltitude
        const rawDist = jump.distancetotarget || jump.distanceToTarget

        const exitAltitude = rawExitAlt
          ? convertAltitude(parseInt(rawExitAlt), csvAltitudeUnit as UnitPreference, userRecord.unitPreference)
          : undefined
        const deploymentAltitude = rawDeployAlt
          ? convertAltitude(parseInt(rawDeployAlt), csvAltitudeUnit as UnitPreference, userRecord.unitPreference)
          : undefined
        const distanceToTarget = rawDist
          ? convertAltitude(parseInt(rawDist), csvAltitudeUnit as UnitPreference, userRecord.unitPreference)
          : undefined

        // Parse booleans
        const parseBoolean = (value: unknown) => {
          const val = (value || "").toString().toLowerCase()
          return ["yes", "true", "1"].includes(val)
        }

        const isWorkJump = parseBoolean(jump.workjump || jump.workJump)
        const isCutaway = parseBoolean(jump.iscutaway || jump.isCutaway)
        const hasHandcam = parseBoolean(jump.hashandcam || jump.hasHandcam)

        // Validate workJumpType enum
        const rawWorkJumpType = jump.workjumptype || jump.workJumpType
        let workJumpType: string | undefined
        if (rawWorkJumpType) {
          const normalized = rawWorkJumpType.toString().toUpperCase()
          if (["AFF", "TANDEM", "CAMERA", "COACH"].includes(normalized)) {
            workJumpType = normalized
          }
        }

        const jumpData = {
          userId: user.id,
          jumpNumber,
          date: parsedDate,
          dropzoneId,
          aircraftId: aircraftId || undefined,
          jumpTypeId: jumpTypeId || undefined,
          rigId: undefined,
          exitAltitude,
          deploymentAltitude,
          freefallTime: (jump.freefalltime || jump.freefallTime)
            ? parseInt(jump.freefalltime || jump.freefallTime)
            : undefined,
          distanceToTarget,
          isCutaway,
          isWorkJump,
          workJumpType: workJumpType as any,
          customerName: (jump.customername || jump.customerName) || undefined,
          hasHandcam,
          isImportedAsPaid: isWorkJump,
          photoUrl: (jump.photourl || jump.photoUrl) || undefined,
          notes: jump.notes || undefined,
        }

        // Check existence using pre-fetched map — no extra DB query
        const existingJumpId = existingJumpMap.get(jumpNumber)

        if (existingJumpId) {
          if (overwrite) {
            await prisma.$transaction(async (tx) => {
              await tx.jump.update({ where: { id: existingJumpId }, data: jumpData })
              await tx.jumpGearComponent.deleteMany({ where: { jumpId: existingJumpId } })
              if (gearComponentIds.length > 0) {
                await tx.jumpGearComponent.createMany({
                  data: gearComponentIds.map((gearComponentId) => ({
                    jumpId: existingJumpId,
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
          await prisma.$transaction(async (tx) => {
            const newJump = await tx.jump.create({ data: jumpData })
            if (gearComponentIds.length > 0) {
              await tx.jumpGearComponent.createMany({
                data: gearComponentIds.map((gearComponentId) => ({
                  jumpId: newJump.id,
                  gearComponentId,
                })),
              })
            }
            // Cache the new jump in case a later row in this batch references the same number
            existingJumpMap.set(jumpNumber, newJump.id)
          })
          imported++
        }

        if (jumpNumber > maxJumpNumber) {
          maxJumpNumber = jumpNumber
        }
      } catch (error: any) {
        errors.push({
          jumpNumber: parseInt(jump.jumpnumber || jump.jumpNumber || "0"),
          reason: error.message || "Unknown error",
        })
        skipped++
      }
    }

    // Update user's next jump number
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
      skipped,
      total: jumps.length,
      nextJumpNumber: maxJumpNumber + 1,
      errors: errors.slice(0, 50),
      hasMoreErrors: errors.length > 50,
    })
  } catch (error) {
    console.error("Import error:", error)
    return NextResponse.json(
      { error: "Import failed", details: (error as Error).message },
      { status: 500 }
    )
  }
}
