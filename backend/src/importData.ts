import { prisma } from './prisma'

export async function importProductionData() {
  console.log('🏭 Starting Production Data Import...')
  
  try {
    // Clear existing data
    console.log('🧹 Cleaning existing data...')
    await prisma.shiftAssignment.deleteMany()
    await prisma.operatorCompetency.deleteMany()
    await prisma.skillRequirement.deleteMany()
    await prisma.changeover.deleteMany()
    await prisma.scheduleBlock.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.sKU.deleteMany()
    await prisma.operator.deleteMany()
    await prisma.skill.deleteMany()
    await prisma.shiftPattern.deleteMany()
    await prisma.holiday.deleteMany()
    await prisma.workcenter.deleteMany()
    await prisma.department.deleteMany()
    await prisma.plant.deleteMany()

    // Create Plant
    console.log('🏗️  Creating plant structure...')
    const plant = await prisma.plant.create({
      data: { name: 'AIPS Manufacturing Plant - Texas', tenantId: 'default' }
    })

    // Create Departments
    const departments = await prisma.department.createMany({
      data: [
        { plantId: plant.id, name: 'Production Assembly', tenantId: 'default' },
        { plantId: plant.id, name: 'Quality Control', tenantId: 'default' },
        { plantId: plant.id, name: 'Packaging & Shipping', tenantId: 'default' },
        { plantId: plant.id, name: 'Maintenance', tenantId: 'default' }
      ]
    })

    const deptList = await prisma.department.findMany({ where: { plantId: plant.id } })
    const [prodDept, qcDept, packDept, maintDept] = deptList

    // Create Workcenters
    console.log('⚙️  Creating workcenters...')
    await prisma.workcenter.createMany({
      data: [
        {
          plantId: plant.id, departmentId: prodDept.id, workcenterNo: 'LINE-001',
          name: 'Assembly Line A', displayTitle: 'High-Volume Assembly', minStaff: 3,
          changeoverFamily: 'Electronics', tenantId: 'default'
        },
        {
          plantId: plant.id, departmentId: prodDept.id, workcenterNo: 'LINE-002',
          name: 'Assembly Line B', displayTitle: 'Precision Assembly', minStaff: 4,
          changeoverFamily: 'Electronics', tenantId: 'default'
        },
        {
          plantId: plant.id, departmentId: prodDept.id, workcenterNo: 'LINE-003',
          name: 'Final Assembly', displayTitle: 'Integration & Testing', minStaff: 2,
          changeoverFamily: 'Final', tenantId: 'default'
        },
        {
          plantId: plant.id, departmentId: qcDept.id, workcenterNo: 'QC-001',
          name: 'Quality Control Station', displayTitle: 'Inspection & Testing', minStaff: 2,
          changeoverFamily: 'Testing', tenantId: 'default'
        },
        {
          plantId: plant.id, departmentId: packDept.id, workcenterNo: 'PACK-001',
          name: 'Packaging Line', displayTitle: 'Package & Ship', minStaff: 3,
          changeoverFamily: 'Packaging', tenantId: 'default'
        }
      ]
    })

    // Create Skills
    console.log('🎯 Creating operator skills...')
    await prisma.skill.createMany({
      data: [
        { code: 'ASSEMBLY', name: 'Electronic Assembly', category: 'Technical', isCore: true },
        { code: 'SOLDERING', name: 'Precision Soldering', category: 'Technical', isCore: true },
        { code: 'TESTING', name: 'Circuit Testing', category: 'Quality', isCore: false },
        { code: 'PACKAGING', name: 'Product Packaging', category: 'Operations', isCore: false },
        { code: 'FORKLIFT', name: 'Forklift Operation', category: 'Equipment', isCore: false, isCertification: true, expiryMonths: 36 },
        { code: 'QC_INSPECT', name: 'Quality Inspection', category: 'Quality', isCore: true },
        { code: 'LEAN_SIX', name: 'Lean Six Sigma', category: 'Process', isCore: false, isCertification: true, expiryMonths: 24 },
        { code: 'SAFETY', name: 'Safety Procedures', category: 'Safety', isCore: true, isCertification: true, expiryMonths: 12 }
      ]
    })

    // Create basic SKUs and Orders for demonstration
    console.log('📦 Creating products and orders...')
    const sku = await prisma.sKU.create({
      data: {
        code: 'CTRL-001',
        family: 'Controllers',
        familyColorHex: '#2196F3'
      }
    })

    const wcList = await prisma.workcenter.findMany()
    
    // Create some orders
    for (let i = 1; i <= 10; i++) {
      const wc = wcList[Math.floor(Math.random() * wcList.length)]
      await prisma.order.create({
        data: {
          orderNo: `ORD-${String(i).padStart(4, '0')}`,
          skuId: sku.id,
          workcenterId: wc.id,
          qty: Math.floor(Math.random() * 500) + 50,
          runRateUph: Math.floor(Math.random() * 100) + 20,
          priority: Math.floor(Math.random() * 5) + 1,
          dueAt: new Date(Date.now() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000),
          performanceLeverPct: 85 + Math.random() * 30,
          shopfloorTitle: `Production Run ${i}`,
          colorHex: `#${Math.floor(Math.random()*16777215).toString(16)}`
        }
      })
    }

    console.log('✅ Production data imported successfully!')
    return { success: true, message: 'Production data imported' }

  } catch (error) {
    console.error('❌ Import failed:', error)
    throw error
  }
}
