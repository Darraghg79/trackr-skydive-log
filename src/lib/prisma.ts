import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In serverless each function invocation can spin up a new Prisma client.
// Without connection_limit=1, Prisma opens a pool per instance and quickly
// exhausts Supabase's Session mode limit ("max clients reached").
// connection_limit=1 + pool_timeout=0 is the standard Prisma+Supabase serverless fix.
function buildDatasourceUrl(url: string | undefined): string | undefined {
  if (!url) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}connection_limit=1&pool_timeout=0`
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: buildDatasourceUrl(process.env.DATABASE_URL),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Handle connection errors gracefully
prisma.$connect().catch((e) => {
  console.error('Failed to connect to database:', e)
})
