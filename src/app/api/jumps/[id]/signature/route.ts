import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { JumpSignatureSchema } from '@/lib/validations/jump'
import { ZodError } from 'zod'

export async function POST(
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
    const validated = JumpSignatureSchema.parse(body)

    // Verify jump belongs to user
    const jump = await prisma.jump.findFirst({
      where: { id, userId: user.id },
    })

    if (!jump) {
      return NextResponse.json({ error: 'Jump not found' }, { status: 404 })
    }

    const signature = await prisma.jumpSignature.create({
      data: {
        jumpId: id,
        ...validated,
      },
    })

    return NextResponse.json(signature, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/jumps/[id]/signature error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
