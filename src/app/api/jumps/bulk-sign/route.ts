import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/jumps/bulk-sign
 * Creates signatures for multiple jumps at once
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { jumpIds, licenseNumber, signatureData } = body

    // Validate input
    if (!jumpIds || !Array.isArray(jumpIds) || jumpIds.length === 0) {
      return NextResponse.json({ error: 'Jump IDs are required' }, { status: 400 })
    }

    if (!licenseNumber || typeof licenseNumber !== 'string') {
      return NextResponse.json({ error: 'License number is required' }, { status: 400 })
    }

    if (!signatureData || typeof signatureData !== 'string') {
      return NextResponse.json({ error: 'Signature data is required' }, { status: 400 })
    }

    // Use transaction to ensure all signatures are created atomically
    const result = await prisma.$transaction(async (tx) => {
      // Verify all jumps belong to the user
      const jumps = await tx.jump.findMany({
        where: {
          id: { in: jumpIds },
          userId: user.id,
        },
        select: {
          id: true,
          jumpNumber: true,
        },
      })

      if (jumps.length !== jumpIds.length) {
        const foundIds = jumps.map(j => j.id)
        const missingIds = jumpIds.filter(id => !foundIds.includes(id))
        throw new Error(`${missingIds.length} jump(s) not found or unauthorized`)
      }

      // Create signatures for all jumps
      const signatures = await Promise.all(
        jumpIds.map(jumpId =>
          tx.jumpSignature.create({
            data: {
              jumpId,
              signerLicenseNumber: licenseNumber,
              signatureImage: signatureData,
            },
            select: {
              id: true,
              jumpId: true,
              createdAt: true,
            },
          })
        )
      )

      return {
        signatures,
        jumps,
      }
    })

    return NextResponse.json({
      success: true,
      count: result.signatures.length,
      signatures: result.signatures,
    })
  } catch (error) {
    console.error('POST /api/jumps/bulk-sign error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
