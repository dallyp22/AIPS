import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

console.log('Available Prisma models:')
console.log(Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$')))

async function test() {
  try {
    console.log('\nTesting model access:')
    
    // Test each model exists
    const models = ['plant', 'department', 'workcenter', 'holiday', 'sku', 'product', 'order', 'scheduleBlock', 'changeover', 'operator', 'skill', 'operatorCompetency', 'skillRequirement', 'shiftPattern', 'shiftAssignment']
    
    for (const model of models) {
      try {
        if (prisma[model]) {
          console.log(`✅ ${model}: Available`)
        } else {
          console.log(`❌ ${model}: NOT available`)
        }
      } catch (e) {
        console.log(`❌ ${model}: Error -`, e.message)
      }
    }
  } finally {
    await prisma.$disconnect()
  }
}

test()
