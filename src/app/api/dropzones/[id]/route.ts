import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { DropzoneUpdateSchema } from '@/lib/validations/dropzone'
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

    const item = await prisma.dropzone.findFirst({
      where: { id, userId: user.id },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('GET /api/dropzones/[id] error:', error)
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
    const validated = DropzoneUpdateSchema.parse(body)

    const existing = await prisma.dropzone.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Filter out undefined values to avoid setting NULL on NOT NULL fields
    const updateData = Object.fromEntries(
      Object.entries(validated).filter(([_, value]) => value !== undefined)
    )

    const item = await prisma.dropzone.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/dropzones/[id] error:', error)
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

    const existing = await prisma.dropzone.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Count jumps and invoices using this dropzone
    const [jumpCount, invoiceCount] = await Promise.all([
      prisma.jump.count({ where: { dropzoneId: id, userId: user.id } }),
      prisma.invoice.count({ where: { dropzoneId: id, userId: user.id } }),
    ])

    // Check if there are invoices - we can't delete if there are
    if (invoiceCount > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete dropzone with invoices',
          details: `This dropzone has ${invoiceCount} invoice(s). Delete or reassign those invoices first.`
        },
        { status: 400 }
      )
    }

    // If reassignToId is provided, reassign jumps before deleting
    if (reassignToId) {
      // Verify the target dropzone exists and belongs to the user
      const targetDropzone = await prisma.dropzone.findFirst({
        where: { id: reassignToId, userId: user.id },
      })

      if (!targetDropzone) {
        return NextResponse.json(
          { error: 'Target dropzone not found' },
          { status: 400 }
        )
      }

      // Reassign all jumps to the new dropzone
      await prisma.jump.updateMany({
        where: { dropzoneId: id, userId: user.id },
        data: { dropzoneId: reassignToId },
      })
    } else if (jumpCount > 0) {
      // If there are jumps but no reassignToId, we can't delete
      return NextResponse.json(
        { error: 'Cannot delete dropzone with jumps without reassignment' },
        { status: 400 }
      )
    }

    // Delete the dropzone (should be safe now)
    await prisma.dropzone.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      jumpsReassigned: reassignToId ? jumpCount : 0,
    })
  } catch (error) {
    console.error('DELETE /api/dropzones/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
