import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Realistic US holidays for manufacturing calendar
const HOLIDAYS_2025 = [
  { date: '2025-01-01', label: 'New Year\'s Day' },
  { date: '2025-01-20', label: 'Martin Luther King Jr. Day' },
  { date: '2025-02-17', label: 'Presidents\' Day' },
  { date: '2025-05-26', label: 'Memorial Day' },
  { date: '2025-07-04', label: 'Independence Day' },
  { date: '2025-09-01', label: 'Labor Day' },
  { date: '2025-10-13', label: 'Columbus Day' },
  { date: '2025-11-11', label: 'Veterans Day' },
  { date: '2025-11-27', label: 'Thanksgiving Day' },
  { date: '2025-11-28', label: 'Day After Thanksgiving' },
  { date: '2025-12-25', label: 'Christmas Day' },
  { date: '2025-12-26', label: 'Christmas Break' },
  
  // Company-specific holidays
  { date: '2025-03-14', label: 'Company Founder\'s Day' },
  { date: '2025-07-15', label: 'Summer Shutdown Start' },
  { date: '2025-07-16', label: 'Summer Shutdown' },
  { date: '2025-07-17', label: 'Summer Shutdown' },
  { date: '2025-07-18', label: 'Summer Shutdown End' },
  { date: '2025-12-30', label: 'Year-End Shutdown' },
  { date: '2025-12-31', label: 'New Year\'s Eve' }
]

async function seedHolidays() {
  console.log('🗓️  Seeding company holidays...')
  
  // Get the first plant (should exist from base seeding)
  const plant = await prisma.plant.findFirst()
  if (!plant) {
    throw new Error('No plant found. Please run base seeding first.')
  }
  
  // Clear existing holidays
  await prisma.holiday.deleteMany({ where: { plantId: plant.id } })
  
  // Add all holidays
  for (const holiday of HOLIDAYS_2025) {
    await prisma.holiday.create({
      data: {
        plantId: plant.id,
        date: new Date(holiday.date + 'T00:00:00Z'),
        label: holiday.label
      }
    })
  }
  
  console.log(`✅ Created ${HOLIDAYS_2025.length} holidays for ${plant.name}`)
}

async function main() {
  try {
    await seedHolidays()
    console.log('🎉 Holiday seeding completed!')
  } catch (error) {
    console.error('❌ Error seeding holidays:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
