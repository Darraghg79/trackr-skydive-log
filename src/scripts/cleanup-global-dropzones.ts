import { prisma } from '@/lib/prisma'

async function cleanupGlobalDropzones() {
  try {
    console.log('Starting cleanup of global dropzones...\n')

    // Count global dropzones
    const count = await prisma.dropzone.count({
      where: {
        userId: null,
      },
    })

    console.log(`Found ${count} global dropzones to delete\n`)

    if (count === 0) {
      console.log('No global dropzones to clean up.')
      return
    }

    // Delete all global dropzones
    const result = await prisma.dropzone.deleteMany({
      where: {
        userId: null,
      },
    })

    console.log(`✅ Successfully deleted ${result.count} global dropzones`)
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupGlobalDropzones()
