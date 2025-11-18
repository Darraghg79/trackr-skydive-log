import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { GearComponentCreateSchema } from '@/lib/validations/gear-component'
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
    const type = searchParams.get('type')
    const isActive = searchParams.get('isActive')

    const where: any = { userId: user.id }
    if (type) where.type = type
    if (isActive !== null) where.isActive = isActive === 'true'

    const [items, total] = await Promise.all([
      prisma.gearComponent.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
      }),
      prisma.gearComponent.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error) {
    console.error('GET /api/gear-components error:', error)
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
    const validated = GearComponentCreateSchema.parse(body)

    const item = await prisma.gearComponent.create({
      data: { ...validated, userId: user.id },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/gear-components error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
