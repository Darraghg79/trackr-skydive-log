import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch all jumps for the user using Prisma
    const jumps = await prisma.jump.findMany({
      where: { userId: user.id },
      include: {
        dropzone: { select: { id: true, name: true } },
        aircraft: { select: { id: true, name: true } },
        jumpType: { select: { id: true, name: true } },
        gearComponents: {
          include: {
            gearComponent: {
              select: {
                id: true,
                name: true,
                type: true,
                manufacturer: true,
                model: true,
                previousJumpCount: true,
              },
            },
          },
        },
      },
      orderBy: { date: "desc" },
    })

    // Fetch all gear components for the user to include previousJumpCount
    const allGearComponents = await prisma.gearComponent.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        manufacturer: true,
        model: true,
        previousJumpCount: true,
      },
    })

    // Aggregate data by different dimensions
    const byYear: { [key: string]: number } = {}
    const byType: { [key: string]: number } = {}
    const byAircraft: { [key: string]: number } = {}
    const byDropzone: { [key: string]: number } = {}

    // Track gear component usage
    const gearComponentJumps: {
      [key: string]: {
        id: string
        name: string
        type: string
        actualJumps: number
        previousJumps: number
      }
    } = {}

    // Initialize gear components with previousJumpCount
    allGearComponents.forEach((gc) => {
      const displayName = `${gc.name} (${gc.type})`
      gearComponentJumps[gc.id] = {
        id: gc.id,
        name: displayName,
        type: gc.type,
        actualJumps: 0,
        previousJumps: gc.previousJumpCount,
      }
    })

    jumps.forEach((jump) => {
      // By Year
      const year = new Date(jump.date).getFullYear().toString()
      byYear[year] = (byYear[year] || 0) + 1

      // By Type
      const typeName = jump.jumpType?.name || "Unspecified"
      byType[typeName] = (byType[typeName] || 0) + 1

      // By Aircraft
      const aircraftName = jump.aircraft?.name || "Not specified"
      byAircraft[aircraftName] = (byAircraft[aircraftName] || 0) + 1

      // By Dropzone
      const dropzoneName = jump.dropzone?.name || "Unknown"
      byDropzone[dropzoneName] = (byDropzone[dropzoneName] || 0) + 1

      // By Gear Components
      jump.gearComponents.forEach((jgc) => {
        const gcId = jgc.gearComponent.id
        if (gearComponentJumps[gcId]) {
          gearComponentJumps[gcId].actualJumps += 1
        }
      })
    })

    // Convert to sorted arrays
    const yearData = Object.entries(byYear)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.name.localeCompare(a.name)) // Most recent year first

    const typeData = Object.entries(byType)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const aircraftData = Object.entries(byAircraft)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    const dropzoneData = Object.entries(byDropzone)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)

    // Convert gear components to array with total jumps
    const gearData = Object.values(gearComponentJumps)
      .filter((gc) => gc.actualJumps > 0 || gc.previousJumps > 0) // Only show components with jumps
      .map((gc) => ({
        id: gc.id, // Include ID for linking
        name: gc.name,
        count: gc.actualJumps + gc.previousJumps, // Total jumps including previous
        actualJumps: gc.actualJumps,
        previousJumps: gc.previousJumps,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json({
      totalJumps: jumps.length,
      byYear: yearData,
      byType: typeData,
      byAircraft: aircraftData,
      byGear: gearData,
      byDropzone: dropzoneData,
    })
  } catch (error) {
    console.error("Error in drill-down route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
