"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"

const CURRENCIES = [
  "USD", "EUR", "GBP", "CAD", "AUD", "NZD", "CHF",
  "JPY", "SEK", "NOK", "DKK", "PLN", "CZK",
  "BRL", "MXN", "COP", "ARS", "CLP",
  "ZAR", "AED", "SAR", "INR", "CNY", "THB", "SGD",
  "MYR", "IDR", "PHP", "TRY", "RUB", "ILS",
  "MAD", "KES", "NGN", "EGP", "LKR",
]

interface InvoiceSetupBlockProps {
  defaultDropzoneId: string
  onNext: () => void
}

interface DropzoneInfo {
  id: string
  name: string
}

export function InvoiceSetupBlock({ defaultDropzoneId, onNext }: InvoiceSetupBlockProps) {
  const [dz, setDz] = useState<DropzoneInfo | null>(null)
  const [currency, setCurrency] = useState("USD")
  const [rateAFF, setRateAFF] = useState("")
  const [rateTandem, setRateTandem] = useState("")
  const [rateCamera, setRateCamera] = useState("")
  const [rateCoach, setRateCoach] = useState("")
  const [rateHandcam, setRateHandcam] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!defaultDropzoneId) return
    fetch(`/api/dropzones/${defaultDropzoneId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setDz({ id: data.id, name: data.name })
          if (data.currency) setCurrency(data.currency)
        }
      })
      .catch(() => {})
  }, [defaultDropzoneId])

  const save = async () => {
    if (!defaultDropzoneId) return
    const body: Record<string, unknown> = { currency }
    if (rateAFF) body.rateAFF = parseFloat(rateAFF)
    if (rateTandem) body.rateTandem = parseFloat(rateTandem)
    if (rateCamera) body.rateCamera = parseFloat(rateCamera)
    if (rateCoach) body.rateCoach = parseFloat(rateCoach)
    if (rateHandcam) body.rateHandcam = parseFloat(rateHandcam)
    if (taxRate) body.taxRate = parseFloat(taxRate)

    await fetch(`/api/dropzones/${defaultDropzoneId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  }

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await save()
    } catch {
      // Non-critical — continue regardless
    } finally {
      setSaving(false)
    }
    onNext()
  }

  if (!defaultDropzoneId) {
    return (
      <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Invoice Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            You&apos;ll be able to configure invoice rates once you&apos;ve set up a dropzone.
            You can do this in <strong>Dropzones → Edit</strong>.
          </p>
          <Button onClick={onNext} className="w-full">Continue</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">
          Set up invoicing{dz ? ` for ${dz.name}` : ""}
        </CardTitle>
        <CardDescription>
          Enter your rates so TrackR can auto-calculate your invoices. All fields are optional —
          skip and configure later if you prefer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">AFF rate / jump</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rateAFF}
              onChange={(e) => setRateAFF(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tandem rate / jump</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rateTandem}
              onChange={(e) => setRateTandem(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Camera rate / jump</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rateCamera}
              onChange={(e) => setRateCamera(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Coach rate / jump</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rateCoach}
              onChange={(e) => setRateCoach(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Handcam add-on rate</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={rateHandcam}
              onChange={(e) => setRateHandcam(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tax rate %</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="0.00"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={saving} className="flex-1">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save &amp; Continue
          </Button>
          <Button variant="ghost" onClick={onNext} disabled={saving} className="text-sm">
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
