import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Default dropzones around the world
const DEFAULT_DROPZONES = [
  {
    name: 'Skydive Dubai',
    address: 'Dubai Desert Conservation Reserve, Dubai, UAE',
    country: 'United Arab Emirates',
    currency: 'AED',
    rateAFF: 1500,
    rateTandem: 1400,
    rateCamera: 500,
    rateCoach: 400,
    rateHandcam: 200,
    taxRate: 5,
  },
  {
    name: 'Skydive Perris',
    address: '2091 Goetz Road, Perris, CA 92570',
    country: 'United States',
    currency: 'USD',
    rateAFF: 350,
    rateTandem: 229,
    rateCamera: 100,
    rateCoach: 80,
    rateHandcam: 50,
    taxRate: 7.75,
  },
  {
    name: 'Skydive Hibaldstow',
    address: 'Hibaldstow Airfield, Hibaldstow, North Lincolnshire DN20 9NN',
    country: 'United Kingdom',
    currency: 'GBP',
    rateAFF: 220,
    rateTandem: 199,
    rateCamera: 60,
    rateCoach: 50,
    rateHandcam: 30,
    taxRate: 20,
  },
  {
    name: 'Skydive Sydney',
    address: 'Picton Airfield, 55 Remembrance Drive, Picton NSW 2571',
    country: 'Australia',
    currency: 'AUD',
    rateAFF: 450,
    rateTandem: 299,
    rateCamera: 120,
    rateCoach: 100,
    rateHandcam: 60,
    taxRate: 10,
  },
  {
    name: 'Skydive Spain',
    address: 'Aeródromo de Empuriabrava, 17486 Empuriabrava, Girona',
    country: 'Spain',
    currency: 'EUR',
    rateAFF: 280,
    rateTandem: 220,
    rateCamera: 80,
    rateCoach: 70,
    rateHandcam: 40,
    taxRate: 21,
  },
  {
    name: 'Skydive Interlaken',
    address: 'Flugplatzstrasse, 3800 Interlaken',
    country: 'Switzerland',
    currency: 'CHF',
    rateAFF: 380,
    rateTandem: 420,
    rateCamera: 150,
    rateCoach: 120,
    rateHandcam: 70,
    taxRate: 7.7,
  },
  {
    name: 'Skydive Wanaka',
    address: 'Wanaka Airport, 398 Wanaka-Luggate Highway, Wanaka 9382',
    country: 'New Zealand',
    currency: 'NZD',
    rateAFF: 450,
    rateTandem: 299,
    rateCamera: 150,
    rateCoach: 120,
    rateHandcam: 80,
    taxRate: 15,
  },
  {
    name: 'Skydive Algarve',
    address: 'Aeródromo Municipal de Portimão, Alvor, 8500-059 Portimão',
    country: 'Portugal',
    currency: 'EUR',
    rateAFF: 250,
    rateTandem: 200,
    rateCamera: 70,
    rateCoach: 60,
    rateHandcam: 35,
    taxRate: 23,
  },
  {
    name: 'Skydive Elsinore',
    address: '20701 Lake Street, Lake Elsinore, CA 92530',
    country: 'United States',
    currency: 'USD',
    rateAFF: 320,
    rateTandem: 199,
    rateCamera: 90,
    rateCoach: 75,
    rateHandcam: 45,
    taxRate: 7.75,
  },
  {
    name: 'Skydive Toronto',
    address: '8775 County Road 27, Cookstown, ON L0L 1L0',
    country: 'Canada',
    currency: 'CAD',
    rateAFF: 380,
    rateTandem: 249,
    rateCamera: 110,
    rateCoach: 90,
    rateHandcam: 55,
    taxRate: 13,
  },
]

// Default aircraft types
const DEFAULT_AIRCRAFT = [
  { name: 'Cessna 182 Skylane', sortOrder: 1 },
  { name: 'Cessna 206 Stationair', sortOrder: 2 },
  { name: 'Cessna 208 Caravan', sortOrder: 3 },
  { name: 'Twin Otter (DHC-6)', sortOrder: 4 },
  { name: 'King Air 90', sortOrder: 5 },
  { name: 'King Air 200', sortOrder: 6 },
  { name: 'Skyvan SC.7', sortOrder: 7 },
  { name: 'PAC-750 XSTOL', sortOrder: 8 },
  { name: 'Pilatus Porter PC-6', sortOrder: 9 },
  { name: 'Helicopter', sortOrder: 10 },
]

// Default jump types
const DEFAULT_JUMP_TYPES = [
  { name: 'Solo', sortOrder: 1, isDefault: true },
  { name: 'Formation', sortOrder: 2, isDefault: false },
  { name: 'Freefly', sortOrder: 3, isDefault: false },
  { name: 'Wingsuit', sortOrder: 4, isDefault: false },
  { name: 'Tracking', sortOrder: 5, isDefault: false },
  { name: 'Angle', sortOrder: 6, isDefault: false },
  { name: 'Hop & Pop', sortOrder: 7, isDefault: false },
  { name: 'High Altitude', sortOrder: 8, isDefault: false },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Get all users to seed data for them
  const users = await prisma.user.findMany()

  if (users.length === 0) {
    console.log('⚠️  No users found. Create a user account first.')
    return
  }

  for (const user of users) {
    console.log(`\n👤 Seeding data for user: ${user.email}`)

    // Check if user already has dropzones
    const existingDropzones = await prisma.dropzone.count({
      where: { userId: user.id },
    })

    if (existingDropzones === 0) {
      console.log('  📍 Creating default dropzones...')
      for (const dz of DEFAULT_DROPZONES) {
        await prisma.dropzone.create({
          data: {
            ...dz,
            userId: user.id,
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_DROPZONES.length} dropzones`)
    } else {
      console.log(`  ⏭️  User already has ${existingDropzones} dropzones, skipping...`)
    }

    // Check if user already has aircraft
    const existingAircraft = await prisma.userAircraft.count({
      where: { userId: user.id },
    })

    if (existingAircraft === 0) {
      console.log('  ✈️  Creating default aircraft...')
      for (const aircraft of DEFAULT_AIRCRAFT) {
        await prisma.userAircraft.create({
          data: {
            ...aircraft,
            userId: user.id,
            isDefault: aircraft.sortOrder === 3, // Caravan as default
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_AIRCRAFT.length} aircraft`)
    } else {
      console.log(`  ⏭️  User already has ${existingAircraft} aircraft, skipping...`)
    }

    // Check if user already has jump types
    const existingJumpTypes = await prisma.userJumpType.count({
      where: { userId: user.id },
    })

    if (existingJumpTypes === 0) {
      console.log('  🪂 Creating default jump types...')
      for (const jumpType of DEFAULT_JUMP_TYPES) {
        await prisma.userJumpType.create({
          data: {
            ...jumpType,
            userId: user.id,
          },
        })
      }
      console.log(`  ✅ Created ${DEFAULT_JUMP_TYPES.length} jump types`)
    } else {
      console.log(`  ⏭️  User already has ${existingJumpTypes} jump types, skipping...`)
    }
  }

  console.log('\n✅ Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
