import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { Header } from "@/components/layouts/Header"
import { BottomNav } from "@/components/layouts/BottomNav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    let profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: { hasCompletedOnboarding: true },
    })

    // Brand new user — no Prisma record yet; create it and seed their default data
    if (!profile) {
      try {
        // Use upsert to safely handle concurrent renders (Next.js can call this twice)
        await prisma.user.upsert({
          where: { id: user.id },
          create: { id: user.id, email: user.email ?? '' },
          update: {},
        })

        // Seed the user's personal lists from global tables so they have a full
        // set of dropzones, aircraft, and jump types available from day one.
        // This runs once per user and is silently skipped if global tables are empty.
        const [globalDzs, globalAircrafts, globalJumpTypes] = await Promise.all([
          prisma.globalDropzone.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
          prisma.globalAircraft.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
          prisma.globalJumpType.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
        ])

        await Promise.all([
          prisma.dropzone.createMany({
            data: globalDzs.map(dz => ({
              userId: user.id,
              name: dz.name,
              city: dz.city ?? undefined,
              country: dz.country ?? undefined,
              address: dz.address ?? undefined,
            })),
            skipDuplicates: true,
          }),
          prisma.userAircraft.createMany({
            data: globalAircrafts.map(ac => ({ userId: user.id, name: ac.name })),
            skipDuplicates: true,
          }),
          prisma.userJumpType.createMany({
            data: globalJumpTypes.map(jt => ({ userId: user.id, name: jt.name })),
            skipDuplicates: true,
          }),
        ])
      } catch {
        // Non-critical — user proceeds to onboarding regardless.
        // If user creation failed, the redirect below keeps them in the
        // onboarding loop and the upsert will be retried on next load.
      }
    }

    // New user or user who has not yet completed onboarding wizard
    if (!profile || !profile.hasCompletedOnboarding) {
      redirect('/onboarding')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
