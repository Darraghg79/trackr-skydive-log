"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Pen, Eraser } from "lucide-react"

interface BulkSignatureModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (licenseNumber: string, signatureImage: string) => Promise<void>
  loading: boolean
  jumpCount: number
}

export function BulkSignatureModal({
  open,
  onOpenChange,
  onConfirm,
  loading,
  jumpCount,
}: BulkSignatureModalProps) {
  const [licenseNumber, setLicenseNumber] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const isDrawingRef = useRef(false)

  useEffect(() => {
    if (!open) {
      console.log('[Canvas Setup] Modal closed, clearing context')
      contextRef.current = null
      return
    }

    console.log('[Canvas Setup] Modal opened, attempting to setup canvas...')

    // Use a small delay to ensure the canvas is fully mounted in the DOM
    const setupCanvas = () => {
      if (!canvasRef.current) {
        console.log('[Canvas Setup] Canvas ref not ready, retrying...')
        setTimeout(setupCanvas, 50)
        return
      }

      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      console.log('[Canvas Setup]', {
        canvasExists: !!canvas,
        contextExists: !!ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        displayWidth: canvas.getBoundingClientRect().width,
        displayHeight: canvas.getBoundingClientRect().height,
      })

      if (ctx) {
        // Clear any existing content
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        // Set drawing style
        ctx.strokeStyle = "#000"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        contextRef.current = ctx
        setHasSignature(false)
        console.log('[Canvas Setup] Context configured successfully', { contextRefSet: !!contextRef.current })
      } else {
        console.error('[Canvas Setup] Failed to get 2D context')
      }
    }

    setupCanvas()
  }, [open])

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    // Get the client coordinates
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    // Calculate the scale factors between canvas and displayed size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Calculate canvas coordinates
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY

    return { x, y }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    console.log('[Start Drawing] Event triggered', {
      hasContext: !!contextRef.current,
      hasCanvas: !!canvasRef.current,
      eventType: 'touches' in e ? 'touch' : 'mouse',
    })

    if (!contextRef.current || !canvasRef.current) {
      console.log('[Start Drawing] Missing context or canvas, aborting')
      return
    }

    // Only prevent default for touch events to avoid blocking mouse clicks
    if ('touches' in e) {
      e.preventDefault()
    }

    const { x, y } = getCoordinates(e)
    console.log('[Start Drawing] Starting at coordinates', { x, y })

    isDrawingRef.current = true
    setIsDrawing(true)
    setHasSignature(true)

    contextRef.current.beginPath()
    contextRef.current.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !contextRef.current || !canvasRef.current) {
      return
    }

    // Only prevent default for touch events to avoid blocking mouse movement
    if ('touches' in e) {
      e.preventDefault()
    }

    const { x, y } = getCoordinates(e)
    console.log('[Draw] Drawing to', { x, y, isDrawing: isDrawingRef.current })

    contextRef.current.lineTo(x, y)
    contextRef.current.stroke()
  }

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    console.log('[Stop Drawing] Event triggered', { isDrawing: isDrawingRef.current })
    if (!contextRef.current) return
    isDrawingRef.current = false
    setIsDrawing(false)
    contextRef.current.closePath()
  }

  const clearSignature = () => {
    if (!contextRef.current || !canvasRef.current) return
    const canvas = canvasRef.current
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleConfirm = async () => {
    if (!canvasRef.current || !licenseNumber.trim() || !hasSignature) return

    const canvas = canvasRef.current
    const signatureImage = canvas.toDataURL("image/png")
    await onConfirm(licenseNumber.trim(), signatureImage)

    // Reset form
    setLicenseNumber("")
    clearSignature()
  }

  const handleClose = () => {
    if (loading) return
    setLicenseNumber("")
    clearSignature()
    onOpenChange(false)
  }

  const isValid = licenseNumber.trim().length > 0 && hasSignature

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Sign Selected Jumps</DialogTitle>
          <DialogDescription>
            Sign {jumpCount} {jumpCount === 1 ? "jump" : "jumps"} with your
            instructor signature
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="license">Instructor License Number *</Label>
            <Input
              id="license"
              placeholder="e.g., USPA D-12345"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Signature *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSignature}
                className="h-8"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
            <div className="border-2 border-muted rounded-lg bg-white relative overflow-hidden">
              <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="w-full h-[300px] touch-none cursor-crosshair"
                style={{ touchAction: 'none' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-muted-foreground flex items-center gap-2">
                    <Pen className="h-4 w-4" />
                    <span className="text-sm">Draw your signature here</span>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Draw your signature using your mouse or touchscreen
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid || loading}>
            {loading ? "Signing..." : `Sign ${jumpCount} ${jumpCount === 1 ? "Jump" : "Jumps"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
