import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { AdhocLineItemSchema } from '@/lib/validations/invoice'
import { ZodError } from 'zod'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, lineItemId } = await params
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
        { error: 'Ad-hoc lines can only be edited while an invoice is open.' },
        { status: 409 }
      )
    }

    const existingLine = await prisma.invoiceLineItem.findFirst({
      where: { id: lineItemId, invoiceId: id },
    })

    if (!existingLine || existingLine.itemType !== 'ADHOC') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const lineTotal = validated.quantity * validated.unitPrice

    const updated = await prisma.invoiceLineItem.update({
      where: { id: lineItemId },
      data: {
        description: validated.description,
        quantity: validated.quantity,
        unitPrice: validated.unitPrice,
        lineTotal,
      },
    })

    return NextResponse.json({
      ...updated,
      unitPrice: Number(updated.unitPrice),
      lineTotal: Number(updated.lineTotal),
      jump: null,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/invoices/[id]/line-items/[lineItemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, lineItemId } = await params

    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (invoice.status !== 'OPEN') {
      return NextResponse.json(
        { error: 'Ad-hoc lines can only be removed while an invoice is open.' },
        { status: 409 }
      )
    }

    const existingLine = await prisma.invoiceLineItem.findFirst({
      where: { id: lineItemId, invoiceId: id },
    })

    if (!existingLine || existingLine.itemType !== 'ADHOC') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.invoiceLineItem.delete({ where: { id: lineItemId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id]/line-items/[lineItemId] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
