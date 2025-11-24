import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Fetch the gear component
    const gearComponent = await prisma.gearComponent.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        name: true,
        type: true,
        manufacturer: true,
        model: true,
        serialNumber: true,
        previousJumpCount: true,
        serviceDate: true,
        isActive: true,
      },
    })

    if (!gearComponent) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Count jumps where this component was used
    const loggedJumps = await prisma.jumpGearComponent.count({
      where: {
        gearComponentId: id,
        jump: {
          userId: user.id,
        },
      },
    })

    const totalJumps = loggedJumps + gearComponent.previousJumpCount

    return NextResponse.json({
      ...gearComponent,
      loggedJumps,
      totalJumps,
    })
  } catch (error) {
    console.error("GET /api/gear-components/[id]/stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
