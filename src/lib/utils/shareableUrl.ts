import crypto from 'crypto'

/**
 * Generate a unique shareable URL token for an invoice
 */
export function generateShareableToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get expiry date (30 days from now)
 */
export function getShareableUrlExpiry(): Date {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  return expiry
}

/**
 * Check if a shareable URL has expired
 */
export function isShareableUrlExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return true
  return new Date() > expiryDate
}

/**
 * Generate full shareable URL for an invoice
 */
export function getShareableUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/share/invoice/${token}`
}
