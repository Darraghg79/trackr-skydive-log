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

    // Brand new user — no Prisma record yet; create it and send to onboarding
    if (!profile) {
      await prisma.user.create({
        data: { id: user.id, email: user.email! },
      })
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
