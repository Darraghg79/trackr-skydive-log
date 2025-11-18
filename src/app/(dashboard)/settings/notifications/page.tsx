"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import { Loader2 } from "lucide-react"


export default function NotificationsPage() {
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    gearServiceReminders: true,
    invoiceReminders: true,
    weeklyDigest: false,
  })
  const { toast } = useToast()

  const handleSave = async () => {
    setSaving(true)
    try {
      // In a full implementation, this would save to the user's preferences
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast({ title: "Notification preferences saved" })
    } catch (error) {
      toast({ title: "Failed to save preferences", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>

      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="gearServiceReminders"
              checked={settings.gearServiceReminders}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  gearServiceReminders: checked as boolean,
                })
              }
            />
            <div>
              <Label htmlFor="gearServiceReminders">
                Gear Service Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Get notified when your gear is due for service
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="invoiceReminders"
              checked={settings.invoiceReminders}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  invoiceReminders: checked as boolean,
                })
              }
            />
            <div>
              <Label htmlFor="invoiceReminders">Invoice Reminders</Label>
              <p className="text-xs text-muted-foreground">
                Remind about unpaid invoices
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="weeklyDigest"
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, weeklyDigest: checked as boolean })
              }
            />
            <div>
              <Label htmlFor="weeklyDigest">Weekly Digest</Label>
              <p className="text-xs text-muted-foreground">
                Receive a weekly summary of your jumping activity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Preferences
      </Button>
    </div>
  )
}
