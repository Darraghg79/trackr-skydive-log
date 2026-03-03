import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface DropzoneRow {
  name: string
  city: string
  state: string
  country: string
  address: string
}

function parseCSV(filePath: string): DropzoneRow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const lines = fileContent.split('\n')

  // Skip header row (line 0), filter out blank lines
  const dataLines = lines.slice(1).filter(line => line.trim())

  return dataLines.map(line => {
    // Split by comma — simple split (fields in this CSV don't contain commas)
    const parts = line.split(',').map(s => s.trim())

    // Map by index (col 1 is city, unnamed in header)
    return {
      name: parts[0] ?? '',
      city: parts[1] ?? '',
      state: parts[2] ?? '',
      country: parts[3] ?? '',
      address: parts[4] ?? '',
    }
  })
}

async function importGlobalDropzones() {
  try {
    console.log('Starting global dropzone import...\n')

    const csvPath = path.join(process.cwd(), 'data', 'Dropzone list.csv')
    if (!fs.existsSync(csvPath)) {
      console.error(`CSV file not found at: ${csvPath}`)
      process.exit(1)
    }

    console.log(`Reading CSV from: ${csvPath}`)
    const rows = parseCSV(csvPath)
    console.log(`Found ${rows.length} rows in CSV\n`)

    let upserted = 0
    let skipped = 0
    let errors = 0

    for (const row of rows) {
      if (!row.name) {
        skipped++
        continue
      }

      try {
        // Upsert: find by name (first match), update if found, create if not
        const existing = await prisma.globalDropzone.findFirst({
          where: { name: row.name },
        })

        if (existing) {
          await prisma.globalDropzone.update({
            where: { id: existing.id },
            data: {
              city: row.city || null,
              state: row.state || null,
              country: row.country || null,
              address: row.address || null,
            },
          })
          console.log(`♻️  Updated: "${row.name}"`)
        } else {
          await prisma.globalDropzone.create({
            data: {
              name: row.name,
              city: row.city || null,
              state: row.state || null,
              country: row.country || null,
              address: row.address || null,
              isActive: true,
            },
          })
          console.log(`✅ Created: "${row.name}" (${row.country || 'unknown country'})`)
        }
        upserted++
      } catch (error) {
        console.error(`❌ Error upserting "${row.name}":`, error)
        errors++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('Import complete!')
    console.log(`✅ Upserted: ${upserted} global dropzones`)
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

importGlobalDropzones()
