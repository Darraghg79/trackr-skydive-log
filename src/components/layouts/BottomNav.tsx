"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plane, MapPin, Package, FileText, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/jumps", label: "Jumps", icon: Plane },
  { href: "/dropzones", label: "Dropzones", icon: MapPin },
  { href: "/gear", label: "Gear", icon: Package },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/settings/profile", label: "Settings", icon: Settings },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 text-xs",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
