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

    const { searchParams } = new URL(request.url)
    const year = searchParams.get("year")
    const type = searchParams.get("type")
    const dropzone = searchParams.get("dropzone")
    const aircraft = searchParams.get("aircraft")
    const gear = searchParams.get("gear")

    console.log("Filtered jumps request:", { year, type, dropzone, aircraft, gear })

    // Build where clause for Prisma
    const where: any = { userId: user.id }

    // Add filters
    if (year) {
      const yearInt = parseInt(year)
      where.date = {
        gte: new Date(`${yearInt}-01-01`),
        lte: new Date(`${yearInt}-12-31`),
      }
    }

    if (type) {
      where.jumpType = {
        name: type,
      }
    }

    if (dropzone) {
      where.dropzone = {
        name: dropzone,
      }
    }

    if (aircraft) {
      where.aircraft = {
        name: aircraft,
      }
    }

    if (gear) {
      // Filter by gear component name (format: "Name (TYPE)")
      // Extract the component name from the display format
      const componentName = gear.replace(/\s*\([^)]*\)\s*$/, "").trim()
      console.log("Filtering by gear component:", componentName)
      where.gearComponents = {
        some: {
          gearComponent: {
            name: componentName,
          },
        },
      }
    }

    // Fetch ALL matching jumps (no limit)
    const jumps = await prisma.jump.findMany({
      where,
      include: {
        dropzone: { select: { id: true, name: true } },
        aircraft: { select: { id: true, name: true } },
        jumpType: { select: { id: true, name: true } },
        rig: { select: { id: true, name: true } },
        signatures: { select: { id: true } },
        gearComponents: {
          include: {
            gearComponent: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { jumpNumber: "desc" },
    })

    console.log("Found jumps:", jumps.length)

    // If filtering by gear, fetch the component's previousJumpCount
    let gearMetadata = null
    if (gear) {
      const componentName = gear.replace(/\s*\([^)]*\)\s*$/, "").trim()
      const gearComponent = await prisma.gearComponent.findFirst({
        where: {
          userId: user.id,
          name: componentName,
        },
        select: {
          id: true,
          name: true,
          type: true,
          previousJumpCount: true,
        },
      })

      if (gearComponent) {
        gearMetadata = {
          name: gearComponent.name,
          type: gearComponent.type,
          previousJumps: gearComponent.previousJumpCount,
          loggedJumps: jumps.length,
          totalJumps: jumps.length + gearComponent.previousJumpCount,
        }
        console.log("Gear metadata:", gearMetadata)
      }
    }

    return NextResponse.json({
      data: jumps,
      total: jumps.length,
      gearMetadata,
    })
  } catch (error) {
    console.error("Error in filtered jumps route:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
