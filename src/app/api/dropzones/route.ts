import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { DropzoneCreateSchema } from '@/lib/validations/dropzone'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    // Build where clause for user's dropzones only
    const where: any = {
      userId: user.id,
    }
    if (isActive !== null) where.isActive = isActive === 'true'

    // Add search filter
    if (search && search.trim()) {
      const searchTerm = search.trim()
      const searchConditions = {
        OR: [
          { name: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { country: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
          { city: { contains: searchTerm, mode: Prisma.QueryMode.insensitive } },
        ],
      }
      // Combine with existing where clause
      where.AND = [searchConditions]
    }

    const [items, total] = await Promise.all([
      prisma.dropzone.findMany({
        where,
        orderBy: [
          // Configured dropzones first (those with at least one rate set)
          {
            rateAFF: { sort: 'desc', nulls: 'last' }
          },
          // Then by name alphabetically
          { name: 'asc' },
        ],
        take: limit,
        skip: offset,
      }),
      prisma.dropzone.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error: any) {
    console.error('GET /api/dropzones error:', error)
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
