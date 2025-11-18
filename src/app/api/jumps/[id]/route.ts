import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { JumpUpdateSchema } from '@/lib/validations/jump'
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

    const item = await prisma.jump.findFirst({
      where: { id, userId: user.id },
      include: {
        dropzone: true,
        aircraft: true,
        jumpType: true,
        rig: { include: { rigComponents: { include: { gearComponent: true } } } },
        gearComponents: { include: { gearComponent: true } },
        signatures: true,
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('GET /api/jumps/[id] error:', error)
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
    const validated = JumpUpdateSchema.parse(body)
    const { gearComponentIds, ...jumpData } = validated

    const existing = await prisma.jump.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const jump = await tx.jump.update({
        where: { id },
        data: jumpData,
      })

      if (gearComponentIds !== undefined) {
        await tx.jumpGearComponent.deleteMany({ where: { jumpId: id } })
        if (gearComponentIds.length > 0) {
          await tx.jumpGearComponent.createMany({
            data: gearComponentIds.map((gearComponentId) => ({
              jumpId: id,
              gearComponentId,
            })),
          })
        }
      }

      return tx.jump.findUnique({
        where: { id },
        include: {
          dropzone: { select: { id: true, name: true } },
          aircraft: { select: { id: true, name: true } },
          jumpType: { select: { id: true, name: true } },
          rig: { select: { id: true, name: true } },
          gearComponents: { include: { gearComponent: true } },
        },
      })
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/jumps/[id] error:', error)
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

    const existing = await prisma.jump.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.jump.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/jumps/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
