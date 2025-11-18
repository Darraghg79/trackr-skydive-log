import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
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

    const [items, total] = await Promise.all([
      prisma.jumpNumberAuditLog.findMany({
        where: { userId: user.id },
        orderBy: { changedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.jumpNumberAuditLog.count({ where: { userId: user.id } }),
    ])

    return NextResponse.json({
      data: items,
      pagination: { total, limit, offset, hasMore: offset + items.length < total },
    })
  } catch (error) {
    console.error('GET /api/audit-logs error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
