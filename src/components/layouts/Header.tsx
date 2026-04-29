"use client"

import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import {
  LogOut,
  Settings,
  BarChart3,
  Plane,
  FileText,
  Search,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname.startsWith("/jumps") && "bg-muted"
              )}
            >
              <Link href="/jumps" className="inline-flex items-center gap-2">
                <Plane className="h-4 w-4" />
                <span>Jumps</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname.startsWith("/invoices") && "bg-muted"
              )}
            >
              <Link href="/invoices" className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Invoices</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                pathname.startsWith("/reports") && "bg-muted"
              )}
            >
              <Link href="/reports" className="inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            </Button>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Search icon — only visible on the /jumps list page */}
          {pathname === '/jumps' && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Search jumps"
              onClick={() => {
                const sp = new URLSearchParams(window.location.search)
                if (sp.get('showSearch') === '1') {
                  sp.delete('showSearch')
                } else {
                  sp.set('showSearch', '1')
                }
                const qs = sp.toString()
                router.replace(`/jumps${qs ? `?${qs}` : ''}`)
              }}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          <ThemeToggle />

          {/* Settings - Direct link to settings page */}
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
