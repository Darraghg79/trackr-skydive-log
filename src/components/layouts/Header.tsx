"use client"

import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/shared/Logo"
import { ThemeToggle } from "@/components/shared/ThemeToggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LogOut,
  Settings,
  Home,
  BarChart3,
  User,
  Lock,
  Bell,
  CreditCard,
  Plane,
  MapPin,
  Package,
  ListChecks,
  Upload,
  Download,
  Settings as SettingsIcon,
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
                pathname === "/" && "bg-muted"
              )}
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Dashboard</span>
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
          <ThemeToggle />

          {/* Settings Dropdown - Available on all screen sizes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Account Settings</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/settings/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/security" className="cursor-pointer">
                    <Lock className="mr-2 h-4 w-4" />
                    <span>Security</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/notifications" className="cursor-pointer">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/account" className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Account & Billing</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Jump Settings</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/aircraft" className="cursor-pointer">
                    <Plane className="mr-2 h-4 w-4" />
                    <span>Aircraft</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dropzones" className="cursor-pointer">
                    <MapPin className="mr-2 h-4 w-4" />
                    <span>Dropzones</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/jump-types" className="cursor-pointer">
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span>Jump Types</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/gear" className="cursor-pointer">
                    <Package className="mr-2 h-4 w-4" />
                    <span>Gear & Rigs</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/jump-stats" className="cursor-pointer">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Jump Stats</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuLabel>Data Management</DropdownMenuLabel>
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href="/settings/import" className="cursor-pointer">
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Import Jumps</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings/export" className="cursor-pointer">
                    <Download className="mr-2 h-4 w-4" />
                    <span>Export Data</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
