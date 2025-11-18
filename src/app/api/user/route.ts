import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { UserProfileUpdateSchema } from '@/lib/validations/user'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let profile = await prisma.user.findUnique({
      where: { id: user.id },
    })

    // Create user profile if it doesn't exist
    if (!profile) {
      profile = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('GET /api/user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = UserProfileUpdateSchema.parse(body)

    // Track jump number changes in audit log
    if (validated.currentJumpNumber !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { currentJumpNumber: true },
      })

      if (currentUser && currentUser.currentJumpNumber !== validated.currentJumpNumber) {
        await prisma.jumpNumberAuditLog.create({
          data: {
            userId: user.id,
            previousNumber: currentUser.currentJumpNumber,
            newNumber: validated.currentJumpNumber,
            reason: 'Manual adjustment via settings',
          },
        })
      }
    }

    const profile = await prisma.user.update({
      where: { id: user.id },
      data: validated,
    })

    return NextResponse.json(profile)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
