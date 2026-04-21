"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/useToast"

const CURRENCIES = ["EUR", "USD", "GBP", "AUD", "CAD", "NZD", "CHF", "ZAR", "AED", "SGD", "JPY"]

const RATE_LABELS: Record<string, string> = {
  rateAFF: "AFF Rate",
  rateTandem: "Tandem Rate",
  rateCamera: "Camera Rate",
  rateCoach: "Coach Rate",
  rateHandcam: "Handcam Rate",
}

interface MissingFields {
  user: { name?: boolean; address?: boolean; taxRegistrationNumber?: boolean; remittanceDetails?: boolean }
  dropzone: {
    contactName?: boolean
    contactEmail?: boolean
    address?: boolean
    currency?: boolean
  }
  rates: Record<string, boolean>
}

interface PreflightModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
  missingFields: MissingFields
  currentUser: { name?: string; address?: string; taxRegistrationNumber?: string; remittanceDetails?: string }
  currentDropzone: {
    id: string
    contactName?: string | null
    contactEmail?: string | null
    address?: string | null
    currency?: string | null
  }
}

export function InvoicePreflightModal({
  open,
  onClose,
  onComplete,
  missingFields,
  currentUser,
  currentDropzone,
}: PreflightModalProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [userName, setUserName] = useState(currentUser.name || "")
  const [userAddress, setUserAddress] = useState(currentUser.address || "")
  const [taxRegNumber, setTaxRegNumber] = useState(currentUser.taxRegistrationNumber || "")
  const [remittanceDetails, setRemittanceDetails] = useState(currentUser.remittanceDetails || "")

  const [dzContactName, setDzContactName] = useState(currentDropzone.contactName || "")
  const [dzContactEmail, setDzContactEmail] = useState(currentDropzone.contactEmail || "")
  const [dzAddress, setDzAddress] = useState(currentDropzone.address || "")
  const [dzCurrency, setDzCurrency] = useState(currentDropzone.currency || "")

  const [rates, setRates] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    Object.keys(missingFields.rates).forEach((key) => {
      initial[key] = ""
    })
    return initial
  })

  const showUserSection = missingFields.user.name || missingFields.user.address || missingFields.user.taxRegistrationNumber || missingFields.user.remittanceDetails
  const showDzSection =
    missingFields.dropzone.contactName ||
    missingFields.dropzone.contactEmail ||
    missingFields.dropzone.address ||
    missingFields.dropzone.currency
  const showRatesSection = Object.keys(missingFields.rates).length > 0

  const validate = () => {
    if (missingFields.user.name && !userName.trim()) return "Your name is required"
    if (missingFields.user.address && !userAddress.trim()) return "Your address is required"
    if (missingFields.dropzone.contactName && !dzContactName.trim()) return "Contact name is required"
    if (missingFields.dropzone.contactEmail && !dzContactEmail.trim()) return "Contact email is required"
    if (missingFields.dropzone.address && !dzAddress.trim()) return "Dropzone address is required"
    if (missingFields.dropzone.currency && !dzCurrency) return "Currency is required"
    for (const key of Object.keys(missingFields.rates)) {
      if (!rates[key] || Number(rates[key]) <= 0) return `${RATE_LABELS[key] || key} is required`
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validate()
    if (validationError) {
      toast({ title: validationError, variant: "destructive" })
      return
    }

    setSaving(true)
    try {
      if (showUserSection) {
        const userPayload: Record<string, string> = {}
        if (missingFields.user.name) userPayload.name = userName.trim()
        if (missingFields.user.address) userPayload.address = userAddress.trim()
        if (missingFields.user.taxRegistrationNumber && taxRegNumber.trim()) userPayload.taxRegistrationNumber = taxRegNumber.trim()
        if (missingFields.user.remittanceDetails && remittanceDetails.trim()) userPayload.remittanceDetails = remittanceDetails.trim()

        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userPayload),
        })
        if (!res.ok) throw new Error("Failed to save your details")
      }

      if (showDzSection || showRatesSection) {
        const dzPayload: Record<string, string | number> = {}
        if (missingFields.dropzone.contactName) dzPayload.contactName = dzContactName.trim()
        if (missingFields.dropzone.contactEmail) dzPayload.contactEmail = dzContactEmail.trim()
        if (missingFields.dropzone.address) dzPayload.address = dzAddress.trim()
        if (missingFields.dropzone.currency) dzPayload.currency = dzCurrency

        Object.keys(missingFields.rates).forEach((key) => {
          dzPayload[key] = Number(rates[key])
        })

        const res = await fetch(`/api/dropzones/${currentDropzone.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dzPayload),
        })
        if (!res.ok) throw new Error("Failed to save dropzone details")
      }

      onComplete()
    } catch (error) {
      toast({
        title: error instanceof Error ? error.message : "Failed to save details",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Invoice Details</DialogTitle>
          <DialogDescription>
            Before creating your invoice, please fill in the following details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {showUserSection && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Your Details
              </h3>
              {missingFields.user.name && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-name">Your Name</Label>
                  <Input
                    id="preflight-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Full name"
                  />
                </div>
              )}
              {missingFields.user.address && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-address">Your Address</Label>
                  <Input
                    id="preflight-address"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    placeholder="Your billing address"
                  />
                </div>
              )}
              {missingFields.user.taxRegistrationNumber && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-tax-reg">Tax Registration Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="preflight-tax-reg"
                    value={taxRegNumber}
                    onChange={(e) => setTaxRegNumber(e.target.value)}
                    placeholder="e.g. IE1234567T"
                  />
                </div>
              )}
              {missingFields.user.remittanceDetails && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-remittance">Remittance Details <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="preflight-remittance"
                    value={remittanceDetails}
                    onChange={(e) => setRemittanceDetails(e.target.value)}
                    placeholder="Bank details or payment instructions"
                  />
                </div>
              )}
            </div>
          )}

          {showDzSection && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Dropzone Billing
              </h3>
              {missingFields.dropzone.contactName && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-dz-contact-name">Contact Name</Label>
                  <Input
                    id="preflight-dz-contact-name"
                    value={dzContactName}
                    onChange={(e) => setDzContactName(e.target.value)}
                    placeholder="Billing contact name"
                  />
                </div>
              )}
              {missingFields.dropzone.contactEmail && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-dz-contact-email">Contact Email</Label>
                  <Input
                    id="preflight-dz-contact-email"
                    type="email"
                    value={dzContactEmail}
                    onChange={(e) => setDzContactEmail(e.target.value)}
                    placeholder="billing@dropzone.com"
                  />
                </div>
              )}
              {missingFields.dropzone.address && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-dz-address">Dropzone Address</Label>
                  <Input
                    id="preflight-dz-address"
                    value={dzAddress}
                    onChange={(e) => setDzAddress(e.target.value)}
                    placeholder="Dropzone billing address"
                  />
                </div>
              )}
              {missingFields.dropzone.currency && (
                <div className="space-y-1">
                  <Label htmlFor="preflight-currency">Currency</Label>
                  <Select value={dzCurrency} onValueChange={setDzCurrency}>
                    <SelectTrigger id="preflight-currency">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {showRatesSection && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Rates
              </h3>
              {Object.keys(missingFields.rates).map((key) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`preflight-rate-${key}`}>{RATE_LABELS[key] || key}</Label>
                  <Input
                    id={`preflight-rate-${key}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={rates[key] || ""}
                    onChange={(e) => setRates((prev) => ({ ...prev, [key]: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? "Saving..." : "Save & Create Invoice"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
