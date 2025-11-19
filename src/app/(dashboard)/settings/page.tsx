"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
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
  Settings as SettingsIcon
} from "lucide-react"

const settingsCategories = [
  {
    title: "Account Settings",
    description: "Manage your personal information and preferences",
    items: [
      {
        icon: User,
        title: "Profile",
        description: "Update your name, email, and profile information",
        href: "/settings/profile"
      },
      {
        icon: Lock,
        title: "Security",
        description: "Change password and security settings",
        href: "/settings/security"
      },
      {
        icon: Bell,
        title: "Notifications",
        description: "Manage email and notification preferences",
        href: "/settings/notifications"
      },
      {
        icon: CreditCard,
        title: "Account & Billing",
        description: "Manage subscription and billing information",
        href: "/settings/account"
      }
    ]
  },
  {
    title: "Jump Settings",
    description: "Configure your logbook preferences and data",
    items: [
      {
        icon: Plane,
        title: "Aircraft",
        description: "Manage aircraft types for your jumps",
        href: "/aircraft"
      },
      {
        icon: MapPin,
        title: "Dropzones",
        description: "Manage dropzone locations and rates",
        href: "/dropzones"
      },
      {
        icon: ListChecks,
        title: "Jump Types",
        description: "Customize jump type categories",
        href: "/jump-types"
      },
      {
        icon: Package,
        title: "Gear & Rigs",
        description: "Manage your skydiving equipment",
        href: "/gear"
      },
      {
        icon: SettingsIcon,
        title: "Jump Number & Stats",
        description: "Adjust starting jump number, freefall time, and cutaways",
        href: "/settings/jump-stats"
      }
    ]
  },
  {
    title: "Data Management",
    description: "Import and export your logbook data",
    items: [
      {
        icon: Upload,
        title: "Import Jumps",
        description: "Upload CSV file to import existing jump logs",
        href: "/settings/import"
      },
      {
        icon: Download,
        title: "Export Data",
        description: "Download your logbook data",
        href: "/settings/export"
      }
    ]
  }
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and logbook preferences
        </p>
      </div>

      {settingsCategories.map((category, categoryIndex) => (
        <div key={categoryIndex} className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">{category.title}</h2>
            <p className="text-sm text-muted-foreground">{category.description}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {category.items.map((item, itemIndex) => {
              const Icon = item.icon
              return (
                <Link key={itemIndex} href={item.href}>
                  <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-base">{item.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
