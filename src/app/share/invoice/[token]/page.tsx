import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { isShareableUrlExpired } from '@/lib/utils/shareableUrl'
import { InvoicePDFViewer } from '@/components/invoices/InvoicePDFViewer'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function SharedInvoicePage({ params }: PageProps) {
  const { token } = await params

  // Fetch invoice by shareable token
  const invoice = await prisma.invoice.findUnique({
    where: { shareableUrl: token },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          brandingCompanyName: true,
          brandingLogoUrl: true,
          remittanceDetails: true,
        },
      },
      dropzone: {
        select: {
          name: true,
          contactName: true,
          contactEmail: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
        },
      },
      lineItems: {
        include: {
          jump: {
            select: {
              id: true,
              jumpNumber: true,
              date: true,
              customerName: true,
              hasHandcam: true,
            },
          },
        },
        orderBy: {
          jump: {
            jumpNumber: 'asc',
          },
        },
      },
    },
  })

  // Handle not found or expired
  if (!invoice) {
    notFound()
  }

  // Check if link has expired
  if (isShareableUrlExpired(invoice.shareableUrlExpiry)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h1>
          <p className="text-gray-600 mb-4">
            This shareable invoice link has expired. Please contact the sender to request a new link.
          </p>
        </div>
      </div>
    )
  }

  return <InvoicePDFViewer invoice={invoice} />
}
