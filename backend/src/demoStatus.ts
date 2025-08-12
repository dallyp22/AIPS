import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function generateDemoStatus() {
  console.log('🎯 AIPS Demo Database Status Report')
  console.log('=====================================\n')
  
  // Core Data Counts
  const plants = await prisma.plant.count()
  const departments = await prisma.department.count()
  const workcenters = await prisma.workcenter.count()
  const holidays = await prisma.holiday.count()
  
  console.log('🏭 Facility Data:')
  console.log(`   Plants: ${plants}`)
  console.log(`   Departments: ${departments}`)
  console.log(`   Workcenters/Lines: ${workcenters}`)
  console.log(`   Holidays: ${holidays}`)
  
  // Product Data
  const skus = await prisma.sKU.count()
  const products = await prisma.product.count()
  const orders = await prisma.order.count()
  
  console.log('\n📦 Product Data:')
  console.log(`   SKUs: ${skus}`)
  console.log(`   Products: ${products}`)
  console.log(`   Orders: ${orders}`)
  
  // Schedule Data
  const scheduleBlocks = await prisma.scheduleBlock.count()
  const changeovers = await prisma.changeover.count()
  
  console.log('\n📅 Schedule Data:')
  console.log(`   Schedule Blocks: ${scheduleBlocks}`)
  console.log(`   Changeovers: ${changeovers}`)
  
  // Resource Data
  const operators = await prisma.operator.count()
  const skills = await prisma.skill.count()
  const competencies = await prisma.operatorCompetency.count()
  const shiftPatterns = await prisma.shiftPattern.count()
  const shiftAssignments = await prisma.shiftAssignment.count()
  
  console.log('\n👥 Resource Data:')
  console.log(`   Operators: ${operators}`)
  console.log(`   Skills: ${skills}`)
  console.log(`   Competencies: ${competencies}`)
  console.log(`   Shift Patterns: ${shiftPatterns}`)
  console.log(`   Shift Assignments: ${shiftAssignments}`)
  
  // Sample Orders by Family
  const ordersByFamily = await prisma.order.groupBy({
    by: ['priority'],
    _count: { priority: true },
    orderBy: { priority: 'asc' }
  })
  
  console.log('\n📋 Orders by Priority:')
  ordersByFamily.forEach(group => {
    const priorityName = group.priority === 1 ? 'High' : 
                        group.priority === 2 ? 'Medium' : 'Low'
    console.log(`   Priority ${group.priority} (${priorityName}): ${group._count.priority} orders`)
  })
  
  // SKU Family Distribution
  const skuFamilies = await prisma.sKU.groupBy({
    by: ['family'],
    _count: { family: true },
    orderBy: { family: 'asc' }
  })
  
  console.log('\n📦 SKU Families:')
  skuFamilies.forEach(family => {
    const familyName = family.family === 'A' ? 'Energy Drinks' :
                      family.family === 'B' ? 'Sports Drinks' : 'Juices'
    console.log(`   Family ${family.family} (${familyName}): ${family._count.family} SKUs`)
  })
  
  // Competency Levels
  const competencyLevels = await prisma.operatorCompetency.groupBy({
    by: ['level'],
    _count: { level: true },
    orderBy: { level: 'asc' }
  })
  
  console.log('\n🎓 Competency Distribution:')
  competencyLevels.forEach(level => {
    console.log(`   Level ${level.level}: ${level._count.level} competencies`)
  })
  
  // Sample Data Preview
  const sampleOrders = await prisma.order.findMany({
    include: { 
      sku: { select: { code: true, family: true } },
      plannedWorkcenter: { select: { name: true } }
    },
    take: 5,
    orderBy: { priority: 'asc' }
  })
  
  console.log('\n📋 Sample Orders:')
  sampleOrders.forEach(order => {
    console.log(`   ${order.orderNo}: ${order.qty.toLocaleString()} units of ${order.sku.code} (Priority ${order.priority})`)
  })
  
  // Sample Operators
  const sampleOperators = await prisma.operator.findMany({
    include: {
      competencies: {
        include: { skill: { select: { name: true } } },
        where: { isActive: true },
        take: 3
      }
    },
    take: 3
  })
  
  console.log('\n👥 Sample Operators:')
  sampleOperators.forEach(op => {
    const skillCount = op.competencies.length
    const topSkill = op.competencies[0]?.skill.name || 'None'
    console.log(`   ${op.firstName} ${op.lastName} (${op.employeeId}): ${skillCount} skills, top: ${topSkill}`)
  })
  
  console.log('\n🎉 Demo Database Status: READY FOR TESTING!')
  console.log('🚀 Your AIPS application now has comprehensive, realistic data!')
  console.log('\n💡 Next Steps:')
  console.log('   1. Navigate to http://localhost:5173 to explore the UI')
  console.log('   2. Test all pages: Orders, Schedule Board, Resources, Settings')
  console.log('   3. Try the drag-and-drop scheduling functionality')
  console.log('   4. Explore operator competencies and shift assignments')
  console.log('   5. Test the changeover types and closeout features')
}

async function main() {
  try {
    await generateDemoStatus()
  } catch (error) {
    console.error('❌ Error generating demo status:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
