"use client"

import { PDFViewer } from '@react-pdf/renderer'
import { InvoicePDF } from './InvoicePDF'
import { useEffect, useState } from 'react'

interface InvoicePDFViewerProps {
  invoice: any
}

export function InvoicePDFViewer({ invoice }: InvoicePDFViewerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen">
      <PDFViewer width="100%" height="100%" showToolbar={true}>
        <InvoicePDF invoice={invoice} />
      </PDFViewer>
    </div>
  )
}
