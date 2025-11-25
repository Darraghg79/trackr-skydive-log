import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { generateShareableToken, getShareableUrlExpiry, getShareableUrl } from '@/lib/utils/shareableUrl'

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

    // Check if invoice exists and belongs to user
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        shareableUrl: true,
        shareableUrlExpiry: true,
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // If shareable URL exists and hasn't expired, return it
    if (invoice.shareableUrl && invoice.shareableUrlExpiry) {
      const isExpired = new Date() > invoice.shareableUrlExpiry
      if (!isExpired) {
        return NextResponse.json({
          shareableUrl: invoice.shareableUrl,
          expiresAt: invoice.shareableUrlExpiry,
        })
      }
    }

    // Generate new shareable URL
    const token = generateShareableToken()
    const expiry = getShareableUrlExpiry()
    const shareableUrl = getShareableUrl(token, process.env.NEXT_PUBLIC_APP_URL)

    // Update invoice with shareable URL
    await prisma.invoice.update({
      where: { id },
      data: {
        shareableUrl: token, // Store token, not full URL
        shareableUrlExpiry: expiry,
      },
    })

    return NextResponse.json({
      shareableUrl,
      expiresAt: expiry,
    })
  } catch (error) {
    console.error('POST /api/invoices/[id]/share error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
