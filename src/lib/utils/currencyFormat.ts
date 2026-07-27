/**
 * Utility functions for formatting currency amounts with proper symbols and locales
 */

/**
 * Currency configuration with symbol and locale information
 */
const currencyConfig: Record<string, { symbol: string; locale: string; symbolAfter?: boolean }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  AUD: { symbol: 'A$', locale: 'en-AU' },
  CAD: { symbol: 'C$', locale: 'en-CA' },
  NZD: { symbol: 'NZ$', locale: 'en-NZ' },
  CHF: { symbol: 'CHF', locale: 'de-CH', symbolAfter: true },
  JPY: { symbol: '¥', locale: 'ja-JP' },
  CNY: { symbol: '¥', locale: 'zh-CN' },
  INR: { symbol: '₹', locale: 'en-IN' },
  SEK: { symbol: 'kr', locale: 'sv-SE', symbolAfter: true },
  NOK: { symbol: 'kr', locale: 'nb-NO', symbolAfter: true },
  DKK: { symbol: 'kr', locale: 'da-DK', symbolAfter: true },
  PLN: { symbol: 'zł', locale: 'pl-PL', symbolAfter: true },
  CZK: { symbol: 'Kč', locale: 'cs-CZ', symbolAfter: true },
  HUF: { symbol: 'Ft', locale: 'hu-HU', symbolAfter: true },
  ZAR: { symbol: 'R', locale: 'en-ZA' },
  BRL: { symbol: 'R$', locale: 'pt-BR' },
  MXN: { symbol: 'MX$', locale: 'es-MX' },
}

/**
 * Format a number as currency with the appropriate symbol and formatting
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code (e.g., "USD", "EUR", "GBP")
 * @param options - Optional formatting options
 * @returns Formatted currency string (e.g., "$1,234.50", "€1.234,50", "100 CHF")
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string | null | undefined,
  options?: {
    decimals?: number
    showSymbol?: boolean
  }
): string {
  const decimals = options?.decimals ?? 2
  const showSymbol = options?.showSymbol ?? true

  // Parse amount
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)

  if (isNaN(numAmount)) {
    return showSymbol && currencyCode ? `${currencyCode} 0.00` : '0.00'
  }

  // Get currency configuration
  const currency = currencyCode?.toUpperCase() || 'USD'
  const config = currencyConfig[currency]

  // Format the absolute value, then apply the sign outside the symbol
  // (so negatives render as "-€25.00" / "-25.00 kr", not "€-25.00")
  const isNegative = numAmount < 0
  const formattedNumber = Math.abs(numAmount).toFixed(decimals)
  const sign = isNegative ? '-' : ''

  if (!showSymbol) {
    return `${sign}${formattedNumber}`
  }

  // If we have config, use the proper symbol and positioning
  if (config) {
    if (config.symbolAfter) {
      return `${sign}${formattedNumber} ${config.symbol}`
    }
    return `${sign}${config.symbol}${formattedNumber}`
  }

  // Fallback: use the currency code itself
  return `${sign}${formattedNumber} ${currency}`
}

/**
 * Get the currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code
 * @returns The currency symbol or the code itself if not found
 */
export function getCurrencySymbol(currencyCode: string | null | undefined): string {
  if (!currencyCode) return '$'

  const currency = currencyCode.toUpperCase()
  const config = currencyConfig[currency]

  return config?.symbol || currency
}

/**
 * Check if a currency symbol should be positioned after the amount
 * @param currencyCode - ISO 4217 currency code
 * @returns true if symbol should be after amount
 */
export function isCurrencySymbolAfter(currencyCode: string | null | undefined): boolean {
  if (!currencyCode) return false

  const currency = currencyCode.toUpperCase()
  const config = currencyConfig[currency]

  return config?.symbolAfter ?? false
}

/**
 * Format currency with locale-aware number formatting (thousands separators, decimal points)
 * @param amount - The amount to format
 * @param currencyCode - ISO 4217 currency code
 * @returns Formatted currency string with locale formatting
 */
export function formatCurrencyWithLocale(
  amount: number | string | null | undefined,
  currencyCode: string | null | undefined
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0)

  if (isNaN(numAmount)) {
    return formatCurrency(0, currencyCode)
  }

  const currency = currencyCode?.toUpperCase() || 'USD'
  const config = currencyConfig[currency]

  try {
    // Use Intl.NumberFormat for proper locale formatting
    if (config) {
      const formatter = new Intl.NumberFormat(config.locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
      return formatter.format(numAmount)
    }
  } catch (error) {
    // Fallback to basic formatting if Intl fails
    console.warn(`Failed to format currency ${currency}:`, error)
  }

  // Fallback
  return formatCurrency(numAmount, currencyCode)
}
