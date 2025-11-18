import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { createClient } from '@/lib/supabase/server'
import { InvoiceCreateSchema } from '@/lib/validations/invoice'
import { ZodError } from 'zod'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const orderBy = searchParams.get('orderBy') || 'invoiceDate'
    const order = searchParams.get('order') || 'desc'
    const dropzoneId = searchParams.get('dropzoneId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { userId: user.id }
    if (dropzoneId) where.dropzoneId = dropzoneId
    if (status) where.status = status
    if (startDate || endDate) {
      where.invoiceDate = {}
      if (startDate) where.invoiceDate.gte = new Date(startDate)
      if (endDate) where.invoiceDate.lte = new Date(endDate)
    }

    const [items, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { [orderBy]: order },
        take: limit,
        skip: offset,
        include: {
          dropzone: { select: { id: true, name: true } },
          _count: { select: { lineItems: true } },
        },
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error) {
    console.error('GET /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = InvoiceCreateSchema.parse(body)
    const { lineItems, ...invoiceData } = validated

    // Verify dropzone belongs to user
    const dropzone = await prisma.dropzone.findFirst({
      where: { id: invoiceData.dropzoneId, userId: user.id },
    })
    if (!dropzone) {
      return NextResponse.json({ error: 'Invalid dropzone' }, { status: 400 })
    }

    const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const invoice = await tx.invoice.create({
        data: { ...invoiceData, userId: user.id },
      })

      if (lineItems.length > 0) {
        await tx.invoiceLineItem.createMany({
          data: lineItems.map((li) => ({
            ...li,
            invoiceId: invoice.id,
          })),
        })
      }

      // Update user's invoice starting number
      await tx.user.update({
        where: { id: user.id },
        data: {
          invoiceStartingNumber: {
            increment: 1,
          },
        },
      })

      return tx.invoice.findUnique({
        where: { id: invoice.id },
        include: {
          dropzone: { select: { id: true, name: true } },
          lineItems: { include: { jump: { select: { id: true, jumpNumber: true, date: true } } } },
        },
      })
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
