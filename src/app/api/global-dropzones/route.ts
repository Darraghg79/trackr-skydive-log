import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// Public — no auth required (used to search dropzones before user has any personal ones)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 200)

    const where: Prisma.GlobalDropzoneWhereInput = { isActive: true }

    if (search && search.trim()) {
      const term = search.trim()
      where.OR = [
        { name: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { city: { contains: term, mode: Prisma.QueryMode.insensitive } },
        { country: { contains: term, mode: Prisma.QueryMode.insensitive } },
      ]
    }

    const items = await prisma.globalDropzone.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
      select: { id: true, name: true, city: true, state: true, country: true, address: true },
    })

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('GET /api/global-dropzones error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
