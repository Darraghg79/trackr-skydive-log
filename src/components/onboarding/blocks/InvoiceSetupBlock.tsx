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
  currency?: string | null
}

export function InvoiceSetupBlock({ defaultDropzoneId, onNext }: InvoiceSetupBlockProps) {
  const [allDropzones, setAllDropzones] = useState<DropzoneInfo[]>([])
  const [selectedDzId, setSelectedDzId] = useState(defaultDropzoneId)
  const [currency, setCurrency] = useState("EUR")
  const [rateAFF, setRateAFF] = useState("")
  const [rateTandem, setRateTandem] = useState("")
  const [rateCamera, setRateCamera] = useState("")
  const [rateCoach, setRateCoach] = useState("")
  const [rateHandcam, setRateHandcam] = useState("")
  const [taxRate, setTaxRate] = useState("")
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loadingDzs, setLoadingDzs] = useState(true)

  // Load all user dropzones on mount so the selector is always populated
  useEffect(() => {
    fetch("/api/dropzones?limit=200&offset=0", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.data) {
          setAllDropzones(data.data)
          // If no DZ was pre-selected, pick the first one as a sensible default
          if (!selectedDzId && data.data.length > 0) {
            setSelectedDzId(data.data[0].id)
            if (data.data[0].currency) setCurrency(data.data[0].currency)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDzs(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When the selected DZ changes, pre-fill currency from that DZ
  useEffect(() => {
    if (!selectedDzId) return
    const match = allDropzones.find((d) => d.id === selectedDzId)
    if (match?.currency) setCurrency(match.currency)
  }, [selectedDzId, allDropzones])

  const selectedDzName = allDropzones.find((d) => d.id === selectedDzId)?.name

  const save = async () => {
    if (!selectedDzId) return
    const body: Record<string, unknown> = { currency }
    if (rateAFF) body.rateAFF = parseFloat(rateAFF)
    if (rateTandem) body.rateTandem = parseFloat(rateTandem)
    if (rateCamera) body.rateCamera = parseFloat(rateCamera)
    if (rateCoach) body.rateCoach = parseFloat(rateCoach)
    if (rateHandcam) body.rateHandcam = parseFloat(rateHandcam)
    if (taxRate) body.taxRate = parseFloat(taxRate)

    const res = await fetch(`/api/dropzones/${selectedDzId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `Save failed (${res.status})`)
    }
  }

  const handleSubmit = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await save()
      onNext()
    } catch (err: any) {
      setSaveError(err.message || "Failed to save rates. You can configure them later in Dropzones → Edit.")
    } finally {
      setSaving(false)
    }
  }

  if (loadingDzs) {
    return (
      <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (allDropzones.length === 0) {
    return (
      <Card className="bg-white dark:bg-card rounded-lg border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Invoice Setup</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">
            You&apos;ll be able to configure invoice rates once you&apos;ve added a dropzone.
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
          Set up invoicing{selectedDzName ? ` for ${selectedDzName}` : ""}
        </CardTitle>
        <CardDescription>
          Enter your rates so TrackR can auto-calculate your invoices. All fields are optional —
          skip and configure later if you prefer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Show DZ selector if there are multiple dropzones or none was pre-selected */}
        {(allDropzones.length > 1 || !defaultDropzoneId) && (
          <div className="space-y-2">
            <Label>Dropzone</Label>
            <Select value={selectedDzId} onValueChange={setSelectedDzId}>
              <SelectTrigger>
                <SelectValue placeholder="Select your home dropzone" />
              </SelectTrigger>
              <SelectContent>
                {allDropzones.map((dz) => (
                  <SelectItem key={dz.id} value={dz.id}>{dz.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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

        {saveError && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {saveError}
            <button
              onClick={onNext}
              className="block mt-1 underline text-xs text-muted-foreground"
            >
              Continue without saving →
            </button>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={saving || !selectedDzId} className="flex-1">
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
