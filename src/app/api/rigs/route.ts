import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { RigCreateSchema } from '@/lib/validations/rig'
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
    const orderBy = searchParams.get('orderBy') || 'createdAt'
    const order = searchParams.get('order') || 'desc'
    const isActive = searchParams.get('isActive')

    const where: any = { userId: user.id }
    if (isActive !== null) where.isActive = isActive === 'true'

    const [items, total] = await Promise.all([
      prisma.rig.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
        include: {
          rigComponents: { include: { gearComponent: true } },
        },
      }),
      prisma.rig.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error) {
    console.error('GET /api/rigs error:', error)
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
    const validated = RigCreateSchema.parse(body)
    const { componentIds, ...rigData } = validated

    const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rig = await tx.rig.create({
        data: { ...rigData, userId: user.id },
      })

      if (componentIds && componentIds.length > 0) {
        await tx.rigComponent.createMany({
          data: componentIds.map((gearComponentId) => ({
            rigId: rig.id,
            gearComponentId,
          })),
        })
      }

      return tx.rig.findUnique({
        where: { id: rig.id },
        include: { rigComponents: { include: { gearComponent: true } } },
      })
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/rigs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
