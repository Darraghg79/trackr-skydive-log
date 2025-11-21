import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { JumpCreateSchema } from '@/lib/validations/jump'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'jumpNumber'
    const order = searchParams.get('order') || 'desc'
    const dropzoneId = searchParams.get('dropzoneId')
    const jumpTypeId = searchParams.get('jumpTypeId')
    const isWorkJump = searchParams.get('isWorkJump')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId: user.id }
    if (dropzoneId) where.dropzoneId = dropzoneId
    if (jumpTypeId) where.jumpTypeId = jumpTypeId
    if (isWorkJump !== null) where.isWorkJump = isWorkJump === 'true'
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      prisma.jump.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
        include: {
          dropzone: { select: { id: true, name: true } },
          aircraft: { select: { id: true, name: true } },
          jumpType: { select: { id: true, name: true } },
          rig: { select: { id: true, name: true } },
          signatures: { select: { id: true } },
        },
      }),
      prisma.jump.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error) {
    console.error('GET /api/jumps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = JumpCreateSchema.parse(body)
    const { gearComponentIds, ...jumpData } = validated

    // Verify dropzone belongs to user
    const dropzone = await prisma.dropzone.findFirst({
      where: { id: jumpData.dropzoneId, userId: user.id },
    })
    if (!dropzone) {
      return NextResponse.json({ error: 'Invalid dropzone' }, { status: 400 })
    }

    const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const jump = await tx.jump.create({
        data: { ...jumpData, userId: user.id },
      })

      if (gearComponentIds && gearComponentIds.length > 0) {
        await tx.jumpGearComponent.createMany({
          data: gearComponentIds.map((gearComponentId) => ({
            jumpId: jump.id,
            gearComponentId,
          })),
        })
      }

      // Update user's current jump number to the jump that was just logged
      await tx.user.update({
        where: { id: user.id },
        data: {
          currentJumpNumber: jumpData.jumpNumber,
        },
      })

      return tx.jump.findUnique({
        where: { id: jump.id },
        include: {
          dropzone: { select: { id: true, name: true } },
          aircraft: { select: { id: true, name: true } },
          jumpType: { select: { id: true, name: true } },
          rig: { select: { id: true, name: true } },
          gearComponents: { include: { gearComponent: true } },
        },
      })
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/jumps error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
