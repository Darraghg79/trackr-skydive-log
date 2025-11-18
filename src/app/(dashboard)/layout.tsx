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
      <main className="container py-6 pb-20 md:pb-6">{children}</main>
      <BottomNav />
    </div>
  )
}
