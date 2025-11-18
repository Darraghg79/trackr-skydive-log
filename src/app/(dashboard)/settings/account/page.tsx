"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { useToast } from "@/hooks/useToast"
import { Download, Trash2 } from "lucide-react"


export default function AccountPage() {
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleExportData = async () => {
    setExporting(true)
    try {
      const [userRes, jumpsRes, dropzonesRes, gearRes, invoicesRes] =
        await Promise.all([
          fetch("/api/user"),
          fetch("/api/jumps?limit=10000"),
          fetch("/api/dropzones?limit=1000"),
          fetch("/api/gear-components?limit=1000"),
          fetch("/api/invoices?limit=1000"),
        ])

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: await userRes.json(),
        jumps: (await jumpsRes.json()).data,
        dropzones: (await dropzonesRes.json()).data,
        gear: (await gearRes.json()).data,
        invoices: (await invoicesRes.json()).data,
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `trackr-export-${new Date().toISOString().split("T")[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast({ title: "Data exported successfully" })
    } catch (error) {
      toast({ title: "Failed to export data", variant: "destructive" })
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setLoading(true)
    try {
      toast({
        title: "Account deletion",
        description:
          "Contact support to delete your account. This feature will be fully implemented in the next update.",
      })
    } finally {
      setLoading(false)
      setShowDelete(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Account</h1>

      <Card>
        <CardHeader>
          <CardTitle>Export Your Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Download all your data in JSON format. This includes your profile,
            jumps, dropzones, gear, and invoices.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? "Exporting..." : "Export Data"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-red-600 dark:text-red-400">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Permanently delete your account and all associated data. This action
            cannot be undone. We recommend exporting your data first.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowDelete(true)}
            disabled={loading}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="This will permanently delete your account and all associated data including jumps, gear, dropzones, and invoices. This action cannot be undone."
        confirmLabel="Delete My Account"
        loading={loading}
      />
    </div>
  )
}
