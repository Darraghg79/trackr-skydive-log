import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const BulkUpdateItemSchema = z.object({
  id: z.string().uuid(),
  customerName: z.string().max(100).nullable().optional(),
  jumpTypeId: z.string().uuid().nullable().optional(),
  hasHandcam: z.boolean().optional(),
})

const BulkUpdateSchema = z.object({
  updates: z.array(BulkUpdateItemSchema).min(1).max(100),
})

/**
 * PATCH /api/jumps/bulk
 * Updates multiple jump fields in one request.
 * Returns per-jump results so the client can surface partial failures.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { updates } = BulkUpdateSchema.parse(body)

    const ids = updates.map(u => u.id)

    // Verify all requested jumps belong to the authenticated user
    const existingJumps = await prisma.jump.findMany({
      where: { id: { in: ids }, userId: user.id },
      select: { id: true },
    })
    const ownedIds = new Set(existingJumps.map(j => j.id))

    // Process each update independently — partial failures are reported, not thrown
    const results = await Promise.all(
      updates.map(async ({ id, ...data }) => {
        if (!ownedIds.has(id)) {
          return { id, success: false, error: 'Not found' }
        }
        try {
          const updateData: Record<string, unknown> = {}
          // Only include fields that were explicitly provided in the update
          if ('customerName' in data) updateData.customerName = data.customerName
          if ('jumpTypeId' in data) updateData.jumpTypeId = data.jumpTypeId
          if ('hasHandcam' in data) updateData.hasHandcam = data.hasHandcam

          await prisma.jump.update({ where: { id }, data: updateData })
          return { id, success: true }
        } catch {
          return { id, success: false, error: 'Update failed' }
        }
      })
    )

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({ results, successCount, failureCount })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
    }
    console.error('PATCH /api/jumps/bulk error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
