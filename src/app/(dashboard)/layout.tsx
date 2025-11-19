import { Header } from "@/components/layouts/Header"
import { BottomNav } from "@/components/layouts/BottomNav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
