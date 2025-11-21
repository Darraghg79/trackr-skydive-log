import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/jumps/uninvoiced
 * Fetches work jumps that haven't been invoiced yet for a specific dropzone
 * Query params:
 * - dropzoneId: Required - the dropzone to filter by
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dropzoneId = searchParams.get('dropzoneId')

    if (!dropzoneId) {
      return NextResponse.json({ error: 'dropzoneId is required' }, { status: 400 })
    }

    // Verify dropzone belongs to user
    const dropzone = await prisma.dropzone.findFirst({
      where: { id: dropzoneId, userId: user.id },
    })

    if (!dropzone) {
      return NextResponse.json({ error: 'Dropzone not found' }, { status: 404 })
    }

    // Find all work jumps for this dropzone that are not already invoiced
    // A jump can be invoiced if:
    // 1. It's a work jump (isWorkJump = true)
    // 2. It doesn't have a BASE_JUMP line item in any invoice
    // Exception: Handcam can be invoiced separately even if base jump is already invoiced

    const jumps = await prisma.jump.findMany({
      where: {
        userId: user.id,
        dropzoneId,
        isWorkJump: true,
      },
      include: {
        invoiceLineItems: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
              },
            },
          },
        },
        dropzone: {
          select: {
            id: true,
            name: true,
            rateAFF: true,
            rateTandem: true,
            rateCamera: true,
            rateCoach: true,
            rateHandcam: true,
            taxRate: true,
            currency: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    // Filter jumps that have uninvoiced items
    // A jump can appear if:
    // 1. It has no BASE_JUMP line item (completely uninvoiced)
    // 2. OR it has handcam but no HANDCAM_ADDON line item (handcam needs invoicing)
    const jumpsWithInvoiceInfo = jumps
      .map(jump => {
        const hasBaseJumpInvoice = jump.invoiceLineItems.some(
          item => item.itemType === 'BASE_JUMP'
        )
        const hasHandcamInvoice = jump.invoiceLineItems.some(
          item => item.itemType === 'HANDCAM_ADDON'
        )

        return {
          id: jump.id,
          jumpNumber: jump.jumpNumber,
          date: jump.date,
          workJumpType: jump.workJumpType,
          customerName: jump.customerName,
          hasHandcam: jump.hasHandcam,
          canInvoiceHandcam: jump.hasHandcam && !hasHandcamInvoice,
          canInvoiceBaseJump: !hasBaseJumpInvoice,
          dropzone: jump.dropzone,
        }
      })
      .filter(jump => {
        // Include if base jump can be invoiced OR handcam can be invoiced
        return jump.canInvoiceBaseJump || jump.canInvoiceHandcam
      })

    return NextResponse.json({
      data: jumpsWithInvoiceInfo,
      dropzone,
    })
  } catch (error) {
    console.error('GET /api/jumps/uninvoiced error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
