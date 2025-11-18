import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserAircraftCreateSchema } from '@/lib/validations/user-aircraft'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')

    const where: any = { userId: user.id }
    if (isActive !== null) where.isActive = isActive === 'true'

    const items = await prisma.userAircraft.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('GET /api/user-aircrafts error:', error)
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
    const validated = UserAircraftCreateSchema.parse(body)

    const item = await prisma.userAircraft.create({
      data: { ...validated, userId: user.id },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/user-aircrafts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
