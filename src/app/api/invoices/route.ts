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
      // BUSINESS RULE 1: Prevent creating a new OPEN invoice if one already exists for this dropzone
      if (invoiceData.status === 'OPEN') {
        const existingOpenInvoice = await tx.invoice.findFirst({
          where: {
            userId: user.id,
            dropzoneId: invoiceData.dropzoneId,
            status: 'OPEN',
          },
        })

        if (existingOpenInvoice) {
          throw new Error('An open invoice already exists for this dropzone. Please send or delete it before creating a new one.')
        }
      }

      let invoice: any

      // BUSINESS RULE 2: Verify jumps haven't been invoiced already
      // Extract unique jump IDs (a jump can have both BASE_JUMP and HANDCAM_ADDON line items)
      const jumpIds = Array.from(new Set(lineItems.map(li => li.jumpId)))

      // Check for BASE_JUMP conflicts
      const baseJumpLineItems = lineItems.filter(li => li.itemType === 'BASE_JUMP')
      if (baseJumpLineItems.length > 0) {
        const baseJumpIds = baseJumpLineItems.map(li => li.jumpId)
        const existingBaseJumpInvoices = await tx.invoiceLineItem.findMany({
          where: {
            jumpId: { in: baseJumpIds },
            itemType: 'BASE_JUMP',
          },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                status: true,
              },
            },
            jump: {
              select: {
                jumpNumber: true,
              },
            },
          },
        })

        if (existingBaseJumpInvoices.length > 0) {
          const conflicts = existingBaseJumpInvoices.map(
            item => `Jump #${item.jump.jumpNumber} (Invoice #${item.invoice.invoiceNumber})`
          ).join(', ')
          throw new Error(`The following jumps have already been invoiced: ${conflicts}`)
        }
      }

      // Check for HANDCAM_ADDON conflicts
      const handcamLineItems = lineItems.filter(li => li.itemType === 'HANDCAM_ADDON')
      if (handcamLineItems.length > 0) {
        const handcamJumpIds = handcamLineItems.map(li => li.jumpId)
        const existingHandcamInvoices = await tx.invoiceLineItem.findMany({
          where: {
            jumpId: { in: handcamJumpIds },
            itemType: 'HANDCAM_ADDON',
          },
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
              },
            },
            jump: {
              select: {
                jumpNumber: true,
              },
            },
          },
        })

        if (existingHandcamInvoices.length > 0) {
          const conflicts = existingHandcamInvoices.map(
            item => `Jump #${item.jump.jumpNumber} handcam (Invoice #${item.invoice.invoiceNumber})`
          ).join(', ')
          throw new Error(`The following handcam services have already been invoiced: ${conflicts}`)
        }
      }

      // Verify all jumps belong to user and are work jumps
      const jumps = await tx.jump.findMany({
        where: {
          id: { in: jumpIds },
          userId: user.id,
          dropzoneId: invoiceData.dropzoneId,
          isWorkJump: true,
        },
      })

      if (jumps.length !== jumpIds.length) {
        const foundIds = jumps.map(j => j.id)
        const missingCount = jumpIds.filter(id => !foundIds.includes(id)).length
        throw new Error(`Failed to validate ${missingCount} jump(s) — jumps may not be work jumps or belong to this dropzone.`)
      }

      // Create new invoice
      invoice = await tx.invoice.create({
        data: { ...invoiceData, userId: user.id },
      })

      // Update user's invoice starting number
      await tx.user.update({
        where: { id: user.id },
        data: {
          invoiceStartingNumber: {
            increment: 1,
          },
        },
      })

      // For OPEN invoices, don't create line items yet - they'll be generated dynamically
      // For SENT/PAID invoices, create line items now
      if (invoiceData.status !== 'OPEN' && lineItems.length > 0) {
        await tx.invoiceLineItem.createMany({
          data: lineItems.map((li) => ({
            ...li,
            invoiceId: invoice.id,
          })),
        })

        // Recalculate invoice totals
        const newSubtotal = lineItems.reduce(
          (sum, item) => sum + Number(item.lineTotal),
          0
        )
        const newTaxAmount = (newSubtotal * Number(invoiceData.taxRate || 0)) / 100
        const newTotal = newSubtotal + newTaxAmount

        await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            subtotal: newSubtotal,
            taxAmount: newTaxAmount,
            total: newTotal,
          },
        })
      }

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
    if (error instanceof Error) {
      // Business rule violations return clear error messages
      console.error('POST /api/invoices error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('POST /api/invoices error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
