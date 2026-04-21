"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLoader } from "@/components/shared/LoadingSpinner"
import { useToast } from "@/hooks/useToast"
import { ArrowLeft, Calendar, Check } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/utils/currencyFormat"
import { InvoicePreflightModal } from "@/components/invoices/InvoicePreflightModal"

interface UninvoicedJump {
  id: string
  jumpNumber: number
  date: string
  workJumpType: "AFF" | "TANDEM" | "CAMERA" | "COACH"
  customerName: string | null
  hasHandcam: boolean
  canInvoiceHandcam: boolean
  canInvoiceBaseJump: boolean
}

interface Dropzone {
  id: string
  name: string
  contactName: string | null
  contactEmail: string | null
  address: string | null
  rateAFF: number | null
  rateTandem: number | null
  rateCamera: number | null
  rateCoach: number | null
  rateHandcam: number | null
  taxRate: number | null
  currency: string | null
}

interface UserProfile {
  name: string | null
  address: string | null
  invoiceStartingNumber: number | null
  taxRegistrationNumber: string | null
  remittanceDetails: string | null
}

const WORK_TYPE_RATE_KEY: Record<string, keyof Dropzone> = {
  AFF: "rateAFF",
  TANDEM: "rateTandem",
  CAMERA: "rateCamera",
  COACH: "rateCoach",
}

export default function DropzoneInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [jumps, setJumps] = useState<UninvoicedJump[]>([])
  const [dropzone, setDropzone] = useState<Dropzone | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [showPreflightModal, setShowPreflightModal] = useState(false)
  const [missingFields, setMissingFields] = useState<any>(null)

  useEffect(() => {
    fetchUninvoicedJumps()
    fetchUserProfile()
  }, [params.id])

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/user")
      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
      }
    } catch {
      // non-fatal — preflight check will treat profile fields as missing
    }
  }

  const fetchUninvoicedJumps = async () => {
    try {
      const res = await fetch(
        `/api/jumps/uninvoiced?dropzoneId=${params.id}`
      )
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch jumps")
      }
      setJumps(data.data || [])
      setDropzone(data.dropzone)
    } catch (error) {
      toast({
        title: "Failed to load uninvoiced jumps",
        variant: "destructive",
      })
      router.push("/invoices")
    } finally {
      setLoading(false)
    }
  }

  const getRateForJumpType = (
    jumpType: "AFF" | "TANDEM" | "CAMERA" | "COACH"
  ): number => {
    if (!dropzone) return 0
    const key = WORK_TYPE_RATE_KEY[jumpType]
    return Number(dropzone[key] || 0)
  }

  const calculateTotals = () => {
    if (!dropzone) return { subtotal: 0, tax: 0, total: 0, itemCount: 0 }

    let subtotal = 0
    let itemCount = 0

    jumps.forEach((jump) => {
      if (jump.canInvoiceBaseJump) {
        subtotal += getRateForJumpType(jump.workJumpType)
        itemCount++
      }
      if (jump.canInvoiceHandcam) {
        subtotal += Number(dropzone.rateHandcam || 0)
        itemCount++
      }
    })

    const taxRate = Number(dropzone.taxRate || 0)
    const tax = (subtotal * taxRate) / 100
    const total = subtotal + tax

    return { subtotal, tax, total, taxRate, itemCount }
  }

  const checkPreflight = () => {
    const missing = {
      user: {
        name: !userProfile?.name,
        address: !userProfile?.address,
        taxRegistrationNumber: !userProfile?.taxRegistrationNumber,
        remittanceDetails: !userProfile?.remittanceDetails,
      },
      dropzone: {
        contactName: !dropzone?.contactName,
        contactEmail: !dropzone?.contactEmail,
        address: !dropzone?.address,
        currency: !dropzone?.currency,
      },
      rates: {} as Record<string, boolean>,
    }

    const neededTypes = new Set(
      jumps.filter((j) => j.canInvoiceBaseJump).map((j) => j.workJumpType)
    )
    const needsHandcam = jumps.some((j) => j.canInvoiceHandcam)

    neededTypes.forEach((type) => {
      const rateKey = WORK_TYPE_RATE_KEY[type] as string
      if (rateKey && !Number(dropzone?.[rateKey as keyof Dropzone] || 0)) {
        missing.rates[rateKey] = true
      }
    })

    if (needsHandcam && !Number(dropzone?.rateHandcam || 0)) {
      missing.rates.rateHandcam = true
    }

    const hasMissing =
      Object.values(missing.user).some(Boolean) ||
      Object.values(missing.dropzone).some(Boolean) ||
      Object.keys(missing.rates).length > 0

    return { missing, hasMissing }
  }

  const handleCreateInvoiceClick = () => {
    const { missing, hasMissing } = checkPreflight()
    if (hasMissing) {
      setMissingFields(missing)
      setShowPreflightModal(true)
    } else {
      handleCreateInvoice()
    }
  }

  const handlePreflightComplete = async () => {
    await fetchUninvoicedJumps()
    const userRes = await fetch("/api/user")
    if (userRes.ok) {
      const userData = await userRes.json()
      setUserProfile(userData)
    }
    setShowPreflightModal(false)
    handleCreateInvoice()
  }

  const handleCreateInvoice = async () => {
    if (!dropzone) return

    setSubmitting(true)

    try {
      const invoiceNumber = String(
        userProfile?.invoiceStartingNumber || 1
      ).padStart(4, "0")

      const lineItems: any[] = []

      jumps.forEach((jump) => {
        if (jump.canInvoiceBaseJump) {
          const baseRate = getRateForJumpType(jump.workJumpType)
          lineItems.push({
            jumpId: jump.id,
            itemType: "BASE_JUMP",
            workJumpType: jump.workJumpType,
            quantity: 1,
            unitPrice: baseRate,
            lineTotal: baseRate,
          })
        }

        if (jump.canInvoiceHandcam) {
          const handcamRate = Number(dropzone.rateHandcam || 0)
          lineItems.push({
            jumpId: jump.id,
            itemType: "HANDCAM_ADDON",
            workJumpType: jump.workJumpType,
            quantity: 1,
            unitPrice: handcamRate,
            lineTotal: handcamRate,
          })
        }
      })

      const { subtotal, tax, total, taxRate } = calculateTotals()

      const invoiceData = {
        dropzoneId: params.id,
        invoiceNumber,
        invoiceDate: new Date().toISOString(),
        subtotal,
        taxRate: taxRate || 0,
        taxAmount: tax,
        total,
        currency: dropzone.currency || "EUR",
        status: "OPEN",
        lineItems,
      }

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create invoice")
      }

      toast({
        title: "Invoice created successfully",
        description: `Invoice #${invoiceNumber} has been created with ${lineItems.length} items`,
      })

      router.push(`/invoices/${data.id}`)
    } catch (error) {
      toast({
        title: "Failed to create invoice",
        description:
          error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <PageLoader />
  }

  if (!dropzone || jumps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {dropzone?.name || "Dropzone"}
            </h1>
            <p className="text-muted-foreground">No uninvoiced work jumps</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            All work jumps for this dropzone have been invoiced.
          </CardContent>
        </Card>
      </div>
    )
  }

  const { subtotal, tax, total, taxRate, itemCount } = calculateTotals()

  return (
    <div className="space-y-6 pb-80 md:pb-32">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{dropzone.name}</h1>
          <p className="text-muted-foreground">
            {jumps.length} uninvoiced work {jumps.length === 1 ? "jump" : "jumps"}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {jumps.map((jump) => {
          const baseRate = getRateForJumpType(jump.workJumpType)
          const handcamRate = Number(dropzone.rateHandcam || 0)

          return (
            <Card key={jump.id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">
                        Jump #{jump.jumpNumber}
                        {jump.customerName && ` - ${jump.customerName}`}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(jump.date), "MMM d, yyyy")}
                      </div>
                    </div>
                    <Badge variant="secondary">{jump.workJumpType}</Badge>
                  </div>

                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    {jump.canInvoiceBaseJump ? (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>{jump.workJumpType}</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(baseRate, dropzone.currency)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">(Already invoiced)</span>
                        </div>
                      </div>
                    )}

                    {jump.canInvoiceHandcam && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span>Handcam</span>
                        </div>
                        <span className="font-medium">
                          {formatCurrency(handcamRate, dropzone.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Sticky invoice summary at bottom */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4 md:hidden z-40">
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Selected Items:</span>
              <span className="font-medium">{itemCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">
                {formatCurrency(subtotal, dropzone.currency)}
              </span>
            </div>
            {taxRate !== undefined && taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Tax ({taxRate.toFixed(1)}%):
                </span>
                <span className="font-medium">
                  {formatCurrency(tax, dropzone.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>
                {formatCurrency(total, dropzone.currency)}
              </span>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleCreateInvoiceClick}
              disabled={submitting}
            >
              {submitting ? "Creating Invoice..." : "Create Invoice"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Desktop summary */}
      <Card className="hidden md:block">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold text-lg mb-4">Invoice Summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Selected Items:</span>
            <span className="font-medium">{itemCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal:</span>
            <span className="font-medium">
              {formatCurrency(subtotal, dropzone.currency)}
            </span>
          </div>
          {taxRate !== undefined && taxRate > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax ({taxRate.toFixed(1)}%):
              </span>
              <span className="font-medium">
                {formatCurrency(tax, dropzone.currency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total:</span>
            <span>
              {formatCurrency(total, dropzone.currency)}
            </span>
          </div>

          <Button
            className="w-full mt-4"
            size="lg"
            onClick={handleCreateInvoiceClick}
            disabled={submitting}
          >
            {submitting ? "Creating Invoice..." : "Create Invoice"}
          </Button>
        </CardContent>
      </Card>

      {missingFields && (
        <InvoicePreflightModal
          open={showPreflightModal}
          onClose={() => setShowPreflightModal(false)}
          onComplete={handlePreflightComplete}
          missingFields={missingFields}
          currentUser={{
            name: userProfile?.name || undefined,
            address: userProfile?.address || undefined,
            taxRegistrationNumber: userProfile?.taxRegistrationNumber || undefined,
            remittanceDetails: userProfile?.remittanceDetails || undefined,
          }}
          currentDropzone={{
            id: dropzone.id,
            contactName: dropzone.contactName,
            contactEmail: dropzone.contactEmail,
            address: dropzone.address,
            currency: dropzone.currency,
          }}
        />
      )}
    </div>
  )
}
