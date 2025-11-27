import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface DropzoneCSVRow {
  name: string
  city: string
  stateCounty: string
  country: string
  address: string
}

// Country to currency mapping
const countryToCurrency: Record<string, string> = {
  // United States
  'United States': 'USD',
  'USA': 'USD',

  // United Kingdom
  'United Kingdom': 'GBP',
  'UK': 'GBP',
  'England': 'GBP',
  'Scotland': 'GBP',
  'Wales': 'GBP',
  'Northern Ireland': 'GBP',

  // Eurozone countries
  'France': 'EUR',
  'Germany': 'EUR',
  'Spain': 'EUR',
  'Italy': 'EUR',
  'Netherlands': 'EUR',
  'Belgium': 'EUR',
  'Austria': 'EUR',
  'Portugal': 'EUR',
  'Greece': 'EUR',
  'Ireland': 'EUR',
  'Finland': 'EUR',
  'Luxembourg': 'EUR',
  'Slovenia': 'EUR',
  'Slovakia': 'EUR',
  'Estonia': 'EUR',
  'Latvia': 'EUR',
  'Lithuania': 'EUR',
  'Cyprus': 'EUR',
  'Malta': 'EUR',

  // Other major countries
  'Canada': 'CAD',
  'Australia': 'AUD',
  'New Zealand': 'NZD',
  'Switzerland': 'CHF',
  'Sweden': 'SEK',
  'Norway': 'NOK',
  'Denmark': 'DKK',
  'Poland': 'PLN',
  'Czech Republic': 'CZK',
  'Hungary': 'HUF',
  'Romania': 'RON',
  'Bulgaria': 'BGN',
  'Croatia': 'EUR',
  'Japan': 'JPY',
  'China': 'CNY',
  'South Korea': 'KRW',
  'India': 'INR',
  'Brazil': 'BRL',
  'Mexico': 'MXN',
  'Argentina': 'ARS',
  'Chile': 'CLP',
  'Colombia': 'COP',
  'Peru': 'PEN',
  'South Africa': 'ZAR',
  'Thailand': 'THB',
  'Malaysia': 'MYR',
  'Singapore': 'SGD',
  'Indonesia': 'IDR',
  'Philippines': 'PHP',
  'Vietnam': 'VND',
  'Turkey': 'TRY',
  'Russia': 'RUB',
  'Ukraine': 'UAH',
  'Israel': 'ILS',
  'United Arab Emirates': 'AED',
  'Saudi Arabia': 'SAR',
  'Egypt': 'EGP',
  'Morocco': 'MAD',
  'Kenya': 'KES',
  'Nigeria': 'NGN',
  'Costa Rica': 'CRC',
  'Ecuador': 'USD',
  'Panama': 'USD',
  'Sri Lanka': 'LKR',
}

function getCurrency(country: string | undefined): string {
  if (!country) return 'USD' // Default to USD if no country

  const currency = countryToCurrency[country.trim()]
  if (currency) return currency

  // Default to USD if country not found in mapping
  console.warn(`No currency mapping found for country: "${country}", defaulting to USD`)
  return 'USD'
}

function parseCSV(filePath: string): DropzoneCSVRow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n')

  // Skip header row
  const dataLines = lines.slice(1).filter(line => line.trim())

  return dataLines.map(line => {
    // Split by comma, but handle potential commas in quoted fields
    const parts = line.split(',').map(s => s.trim())

    return {
      name: parts[0] || '',
      city: parts[1] || '',
      stateCounty: parts[2] || '',
      country: parts[3] || '',
      address: parts[4] || '',
    }
  })
}

async function importDropzones() {
  try {
    console.log('Starting global dropzone import...\n')

    // Find CSV file
    const csvPath = path.join(process.cwd(), 'data', 'Dropzone list.csv')

    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at: ${csvPath}`)
      process.exit(1)
    }

    console.log(`Reading CSV from: ${csvPath}`)
    const dropzones = parseCSV(csvPath)
    console.log(`Found ${dropzones.length} dropzones in CSV\n`)

    let imported = 0
    let skipped = 0
    let errors = 0

    for (const dz of dropzones) {
      try {
        // Skip if name is empty
        if (!dz.name) {
          console.log(`Skipping row with empty name`)
          skipped++
          continue
        }

        // Check for duplicate global dropzone (name + country combination)
        const existing = await prisma.dropzone.findFirst({
          where: {
            name: dz.name,
            country: dz.country || null,
          },
        })

        if (existing) {
          console.log(`⏭️  Skipped: "${dz.name}" (${dz.country}) - already exists`)
          skipped++
          continue
        }

        // Get currency based on country
        const currency = getCurrency(dz.country)

        // Note: This script is deprecated as the schema no longer supports global dropzones
        // All dropzones must have a userId. This script will fail at runtime.
        console.log(`⚠️  Cannot import: "${dz.name}" - Global dropzones no longer supported`)
        skipped++

        // The following code is commented out as it won't work with current schema
        // await prisma.dropzone.create({
        //   data: {
        //     userId: null,  // Error: userId is required
        //     name: dz.name,
        //     city: dz.city || null,
        //     country: dz.country || null,
        //     address: dz.address || null,
        //     currency,
        //     isActive: true,
        //   },
        // })
        // console.log(`✅ Imported: "${dz.name}" (${dz.country}) - Currency: ${currency}`)
        // imported++
      } catch (error) {
        console.error(`❌ Error importing "${dz.name}":`, error)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('Import complete!')
    console.log(`✅ Imported: ${imported} global dropzones`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Fatal error during import:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

importDropzones()
