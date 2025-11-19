import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserJumpTypeUpdateSchema } from '@/lib/validations/user-jump-type'
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

    const item = await prisma.userJumpType.findFirst({
      where: { id, userId: user.id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('GET /api/user-jump-types/[id] error:', error)
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
    const validated = UserJumpTypeUpdateSchema.parse(body)

    const existing = await prisma.userJumpType.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const item = await prisma.userJumpType.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/user-jump-types/[id] error:', error)
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

    const existing = await prisma.userJumpType.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Count jumps using this jump type
    const jumpCount = await prisma.jump.count({
      where: { jumpTypeId: id, userId: user.id },
    })

    // If reassignToId is provided, reassign jumps before deleting
    if (reassignToId) {
      // Verify the target jump type exists and belongs to the user
      const targetJumpType = await prisma.userJumpType.findFirst({
        where: { id: reassignToId, userId: user.id },
      })

      if (!targetJumpType) {
        return NextResponse.json(
          { error: 'Target jump type not found' },
          { status: 400 }
        )
      }

      // Reassign all jumps to the new jump type
      await prisma.jump.updateMany({
        where: { jumpTypeId: id, userId: user.id },
        data: { jumpTypeId: reassignToId },
      })
    }

    // Delete the jump type
    await prisma.userJumpType.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      jumpsReassigned: reassignToId ? jumpCount : 0,
    })
  } catch (error) {
    console.error('DELETE /api/user-jump-types/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
