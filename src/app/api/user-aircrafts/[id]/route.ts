import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserAircraftUpdateSchema } from '@/lib/validations/user-aircraft'
import { ZodError } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const item = await prisma.userAircraft.findFirst({
      where: { id, userId: user.id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('GET /api/user-aircrafts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validated = UserAircraftUpdateSchema.parse(body)

    const existing = await prisma.userAircraft.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const item = await prisma.userAircraft.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/user-aircrafts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const reassignToId = searchParams.get('reassignToId')

    const existing = await prisma.userAircraft.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const jumpCount = await prisma.jump.count({
      where: { aircraftId: id, userId: user.id },
    })

    if (reassignToId) {
      const targetAircraft = await prisma.userAircraft.findFirst({
        where: { id: reassignToId, userId: user.id },
      })

      if (!targetAircraft) {
        return NextResponse.json(
          { error: 'Target aircraft not found' },
          { status: 400 }
        )
      }

      await prisma.jump.updateMany({
        where: { aircraftId: id, userId: user.id },
        data: { aircraftId: reassignToId },
      })
    } else if (jumpCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete aircraft with jumps without reassignment',
          details: `This aircraft is used by ${jumpCount} jump(s). Use merge to reassign them first.`
        },
        { status: 400 }
      )
    }

    await prisma.userAircraft.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      jumpsReassigned: reassignToId ? jumpCount : 0,
    })
  } catch (error) {
    console.error('DELETE /api/user-aircrafts/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
