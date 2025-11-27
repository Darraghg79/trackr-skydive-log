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
        isImportedAsPaid: false, // Exclude imported work jumps that were already paid
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
          // Convert Decimal fields to numbers in the embedded dropzone object
          dropzone: {
            ...jump.dropzone,
            rateAFF: jump.dropzone.rateAFF ? Number(jump.dropzone.rateAFF) : null,
            rateTandem: jump.dropzone.rateTandem ? Number(jump.dropzone.rateTandem) : null,
            rateCamera: jump.dropzone.rateCamera ? Number(jump.dropzone.rateCamera) : null,
            rateCoach: jump.dropzone.rateCoach ? Number(jump.dropzone.rateCoach) : null,
            rateHandcam: jump.dropzone.rateHandcam ? Number(jump.dropzone.rateHandcam) : null,
            taxRate: jump.dropzone.taxRate ? Number(jump.dropzone.taxRate) : null,
          },
        }
      })
      .filter(jump => {
        // Include if base jump can be invoiced OR handcam can be invoiced
        return jump.canInvoiceBaseJump || jump.canInvoiceHandcam
      })

    // Convert Decimal fields to numbers for JSON serialization
    const dropzoneWithNumbers = {
      ...dropzone,
      rateAFF: dropzone.rateAFF ? Number(dropzone.rateAFF) : null,
      rateTandem: dropzone.rateTandem ? Number(dropzone.rateTandem) : null,
      rateCamera: dropzone.rateCamera ? Number(dropzone.rateCamera) : null,
      rateCoach: dropzone.rateCoach ? Number(dropzone.rateCoach) : null,
      rateHandcam: dropzone.rateHandcam ? Number(dropzone.rateHandcam) : null,
      taxRate: dropzone.taxRate ? Number(dropzone.taxRate) : null,
    }

    return NextResponse.json({
      data: jumpsWithInvoiceInfo,
      dropzone: dropzoneWithNumbers,
    })
  } catch (error) {
    console.error('GET /api/jumps/uninvoiced error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
