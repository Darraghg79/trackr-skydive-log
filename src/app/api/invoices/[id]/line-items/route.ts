import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { AdhocLineItemSchema } from '@/lib/validations/invoice'
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
    const validated = AdhocLineItemSchema.parse(body)

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (invoice.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Ad-hoc lines can only be added while an invoice is open.' },
        { status: 409 }
      )
    }

    const lineTotal = validated.quantity * validated.unitPrice

    const lineItem = await prisma.invoiceLineItem.create({
      data: {
        invoiceId: id,
        itemType: 'ADHOC',
        jumpId: null,
        workJumpType: null,
        description: validated.description,
        quantity: validated.quantity,
        unitPrice: validated.unitPrice,
        lineTotal,
      },
    })

    return NextResponse.json({
      ...lineItem,
      unitPrice: Number(lineItem.unitPrice),
      lineTotal: Number(lineItem.lineTotal),
      jump: null,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/invoices/[id]/line-items error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
