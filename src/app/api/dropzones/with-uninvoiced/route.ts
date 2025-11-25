import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/dropzones/with-uninvoiced
 * Fetches dropzones that have uninvoiced work jumps
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all dropzones for the user with count of uninvoiced work jumps
    const dropzones = await prisma.dropzone.findMany({
      where: {
        userId: user.id,
        isActive: true,
        jumps: {
          some: {
            isWorkJump: true,
            invoiceLineItems: {
              none: {} // No line items means not invoiced
            }
          }
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            jumps: {
              where: {
                isWorkJump: true,
                invoiceLineItems: {
                  none: {}
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get OPEN invoices for these dropzones
    const openInvoices = await prisma.invoice.findMany({
      where: {
        userId: user.id,
        status: 'OPEN',
        dropzoneId: {
          in: dropzones.map(dz => dz.id)
        }
      },
      select: {
        id: true,
        dropzoneId: true,
      }
    })

    // Create a map of dropzoneId to OPEN invoice ID
    const openInvoiceMap = new Map(openInvoices.map(inv => [inv.dropzoneId, inv.id]))

    // Transform to include count as uninvoicedCount and openInvoiceId
    const dropzonesWithCount = dropzones.map(dz => ({
      id: dz.id,
      name: dz.name,
      uninvoicedCount: dz._count.jumps,
      openInvoiceId: openInvoiceMap.get(dz.id) || null,
    }))

    return NextResponse.json({
      data: dropzonesWithCount,
    })
  } catch (error) {
    console.error('GET /api/dropzones/with-uninvoiced error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
