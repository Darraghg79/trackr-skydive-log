import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { InvoiceUpdateSchema } from '@/lib/validations/invoice'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

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

    const item = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: {
        dropzone: true,
        user: {
          select: {
            name: true,
            address: true,
            phone: true,
            taxRegistrationNumber: true,
            remittanceDetails: true,
            brandingCompanyName: true,
            brandingInvoiceFooter: true,
          },
        },
        lineItems: {
          include: {
            jump: {
              select: {
                id: true,
                jumpNumber: true,
                date: true,
                customerName: true,
                workJumpType: true,
                hasHandcam: true,
              },
            },
          },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // For OPEN invoices, dynamically fetch ALL uninvoiced jumps for this dropzone
    if (item.status === 'OPEN') {
      // Find all work jumps for this dropzone
      const uninvoicedJumps = await prisma.jump.findMany({
        where: {
          userId: user.id,
          dropzoneId: item.dropzoneId,
          isWorkJump: true,
        },
        include: {
          invoiceLineItems: {
            include: {
              invoice: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { date: 'asc' },
      })

      // Create dynamic line items for all jumps not in SENT/PAID invoices
      const dynamicLineItems = []
      for (const jump of uninvoicedJumps) {
        // Check if base jump is in a SENT/PAID invoice
        const hasBaseJumpInSentOrPaid = jump.invoiceLineItems.some(
          li => li.itemType === 'BASE_JUMP' && (li.invoice.status === 'SENT' || li.invoice.status === 'PAID')
        )

        // Check if handcam is in a SENT/PAID invoice
        const hasHandcamInSentOrPaid = jump.invoiceLineItems.some(
          li => li.itemType === 'HANDCAM_ADDON' && (li.invoice.status === 'SENT' || li.invoice.status === 'PAID')
        )

        // Add base jump line item if not already invoiced
        if (!hasBaseJumpInSentOrPaid && jump.workJumpType) {
          const rateKey = `rate${jump.workJumpType.charAt(0)}${jump.workJumpType.slice(1).toLowerCase()}` as keyof typeof item.dropzone
          const unitPrice = Number(item.dropzone[rateKey] || 0)

          dynamicLineItems.push({
            id: `dynamic-base-${jump.id}`,
            invoiceId: item.id,
            jumpId: jump.id,
            itemType: 'BASE_JUMP',
            workJumpType: jump.workJumpType,
            quantity: 1,
            unitPrice,
            lineTotal: unitPrice,
            createdAt: new Date(),
            jump: {
              id: jump.id,
              jumpNumber: jump.jumpNumber,
              date: jump.date,
              customerName: jump.customerName,
              workJumpType: jump.workJumpType,
              hasHandcam: jump.hasHandcam,
            },
          })
        }

        // Add handcam addon if applicable and not already invoiced
        if (jump.hasHandcam && !hasHandcamInSentOrPaid) {
          const handcamRate = Number(item.dropzone.rateHandcam || 0)
          dynamicLineItems.push({
            id: `dynamic-handcam-${jump.id}`,
            invoiceId: item.id,
            jumpId: jump.id,
            itemType: 'HANDCAM_ADDON',
            workJumpType: jump.workJumpType,
            quantity: 1,
            unitPrice: handcamRate,
            lineTotal: handcamRate,
            createdAt: new Date(),
            jump: {
              id: jump.id,
              jumpNumber: jump.jumpNumber,
              date: jump.date,
              customerName: jump.customerName,
              workJumpType: jump.workJumpType,
              hasHandcam: jump.hasHandcam,
            },
          })
        }
      }

      // Recalculate totals
      const subtotal = dynamicLineItems.reduce((sum, li) => sum + Number(li.lineTotal), 0)
      const taxAmount = (subtotal * Number(item.taxRate || 0)) / 100
      const total = subtotal + taxAmount

      return NextResponse.json({
        ...item,
        lineItems: dynamicLineItems,
        subtotal,
        taxAmount,
        total,
        isDynamic: true, // Flag to indicate this is dynamically generated
      })
    }

    // For SENT/PAID invoices, return stored line items
    return NextResponse.json(item)
  } catch (error) {
    console.error('GET /api/invoices/[id] error:', error)
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
    const validated = InvoiceUpdateSchema.parse(body)

    const existing = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: {
        dropzone: true,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // If status is changing from OPEN to SENT, create permanent snapshot of line items
    if (existing.status === 'OPEN' && validated.status === 'SENT') {
      const item = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Delete any existing line items (cleanup for OPEN invoices)
        await tx.invoiceLineItem.deleteMany({
          where: { invoiceId: id },
        })

        // Find all uninvoiced work jumps for this dropzone
        const uninvoicedJumps = await tx.jump.findMany({
          where: {
            userId: user.id,
            dropzoneId: existing.dropzoneId,
            isWorkJump: true,
          },
          include: {
            invoiceLineItems: {
              include: {
                invoice: {
                  select: {
                    status: true,
                  },
                },
              },
            },
          },
          orderBy: { date: 'asc' },
        })

        // Create permanent line items for all uninvoiced jumps
        const lineItemsToCreate = []
        for (const jump of uninvoicedJumps) {
          // Check if base jump is in a SENT/PAID invoice
          const hasBaseJumpInSentOrPaid = jump.invoiceLineItems.some(
            li => li.itemType === 'BASE_JUMP' && (li.invoice.status === 'SENT' || li.invoice.status === 'PAID')
          )

          // Check if handcam is in a SENT/PAID invoice
          const hasHandcamInSentOrPaid = jump.invoiceLineItems.some(
            li => li.itemType === 'HANDCAM_ADDON' && (li.invoice.status === 'SENT' || li.invoice.status === 'PAID')
          )

          // Add base jump line item if not already invoiced
          if (!hasBaseJumpInSentOrPaid && jump.workJumpType) {
            const rateKey = `rate${jump.workJumpType.charAt(0)}${jump.workJumpType.slice(1).toLowerCase()}` as keyof typeof existing.dropzone
            const unitPrice = Number(existing.dropzone[rateKey] || 0)

            lineItemsToCreate.push({
              invoiceId: id,
              jumpId: jump.id,
              itemType: 'BASE_JUMP' as const,
              workJumpType: jump.workJumpType!,
              quantity: 1,
              unitPrice,
              lineTotal: unitPrice,
            })
          }

          // Add handcam addon if applicable and not already invoiced
          if (jump.hasHandcam && !hasHandcamInSentOrPaid) {
            const handcamRate = Number(existing.dropzone.rateHandcam || 0)
            lineItemsToCreate.push({
              invoiceId: id,
              jumpId: jump.id,
              itemType: 'HANDCAM_ADDON' as const,
              workJumpType: jump.workJumpType!,
              quantity: 1,
              unitPrice: handcamRate,
              lineTotal: handcamRate,
            })
          }
        }

        // Create all line items
        if (lineItemsToCreate.length > 0) {
          await tx.invoiceLineItem.createMany({
            data: lineItemsToCreate,
          })
        }

        // Recalculate totals
        const subtotal = lineItemsToCreate.reduce((sum, li) => sum + Number(li.lineTotal), 0)
        const taxAmount = (subtotal * Number(existing.taxRate || 0)) / 100
        const total = subtotal + taxAmount

        // Update invoice with new status and totals
        return tx.invoice.update({
          where: { id },
          data: {
            ...validated,
            subtotal,
            taxAmount,
            total,
            sentDate: new Date(),
          },
          include: {
            dropzone: { select: { id: true, name: true } },
            lineItems: { include: { jump: { select: { id: true, jumpNumber: true, date: true } } } },
          },
        })
      })

      return NextResponse.json(item)
    }

    // For other updates, just update the invoice fields
    // If status is being set to SENT (from any other status), set sentDate
    const updateData: any = { ...validated }
    if (validated.status === 'SENT' && existing.status !== 'SENT') {
      updateData.sentDate = new Date()
    }

    const item = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        dropzone: { select: { id: true, name: true } },
        lineItems: { include: { jump: { select: { id: true, jumpNumber: true, date: true } } } },
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/invoices/[id] error:', error)
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

    const existing = await prisma.invoice.findFirst({
      where: { id, userId: user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.invoice.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/invoices/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
