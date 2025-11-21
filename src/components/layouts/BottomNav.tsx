"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Plane,
  Plus,
  BarChart3,
  Settings,
  User,
  Lock,
  Bell,
  CreditCard,
  MapPin,
  Package,
  ListChecks,
  Upload,
  Download,
  Settings as SettingsIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { href: "/jumps", label: "Jumps", icon: Plane },
  { href: "/jumps/new", label: "Log", icon: Plus, isAction: true },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { label: "More", icon: Settings, isSettings: true },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const isActive =
            item.href && (pathname === item.href || pathname.startsWith(item.href))
          const Icon = item.icon

          // Center action button (Log Jump)
          if (item.isAction) {
            return (
              <Link key={item.href} href={item.href!} className="flex-1 flex justify-center">
                <Button
                  size="lg"
                  className="h-12 w-12 rounded-full shadow-lg"
                >
                  <Icon className="h-6 w-6" />
                </Button>
              </Link>
            )
          }

          // Settings dropdown
          if (item.isSettings) {
            return (
              <DropdownMenu key={index}>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                      pathname.startsWith("/settings")
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", pathname.startsWith("/settings") && "scale-110")} />
                    <span className="text-[10px]">{item.label}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2" align="end" side="top">
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
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
