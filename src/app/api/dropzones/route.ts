import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { DropzoneCreateSchema } from '@/lib/validations/dropzone'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('GET /api/dropzones auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'name'
    const order = searchParams.get('order') || 'asc'
    const isActive = searchParams.get('isActive')

    console.log('GET /api/dropzones params:', { userId: user.id, limit, offset, orderBy, order, isActive })

    const where: any = { userId: user.id }
    if (isActive !== null) where.isActive = isActive === 'true'

    console.log('GET /api/dropzones where clause:', where)

    const [items, total] = await Promise.all([
      prisma.dropzone.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
      }),
      prisma.dropzone.count({ where }),
    ])

    console.log('GET /api/dropzones success:', { itemCount: items.length, total })

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error: any) {
    console.error('GET /api/dropzones error:', error)
    console.error('GET /api/dropzones error stack:', error.stack)
    console.error('GET /api/dropzones error message:', error.message)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
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
    const validated = DropzoneCreateSchema.parse(body)

    const item = await prisma.dropzone.create({
      data: { ...validated, userId: user.id },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/dropzones error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
