#!/usr/bin/env tsx

/**
 * Production Database Seeding Script
 * Creates a comprehensive, realistic manufacturing operation dataset
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedProduction() {
  console.log('🏭 Starting Production Database Seeding...')
  
  try {
    // Clear existing data (be careful in production!)
    console.log('🧹 Cleaning existing data...')
    await prisma.shiftAssignment.deleteMany()
    await prisma.operatorCompetency.deleteMany()
    await prisma.skillRequirement.deleteMany()
    await prisma.changeover.deleteMany()
    await prisma.scheduleBlock.deleteMany()
    await prisma.order.deleteMany()
    await prisma.product.deleteMany()
    await prisma.sku.deleteMany()
    await prisma.operator.deleteMany()
    await prisma.skill.deleteMany()
    await prisma.shiftPattern.deleteMany()
    await prisma.holiday.deleteMany()
    await prisma.workcenter.deleteMany()
    await prisma.department.deleteMany()
    await prisma.plant.deleteMany()

    // 1. Create Plant and Departments
    console.log('🏗️  Creating plant structure...')
    const plant = await prisma.plant.create({
      data: {
        name: 'AIPS Manufacturing Plant - Texas',
        tenantId: 'default'
      }
    })

    const departments = await prisma.department.createMany({
      data: [
        { plantId: plant.id, name: 'Production Assembly', tenantId: 'default' },
        { plantId: plant.id, name: 'Quality Control', tenantId: 'default' },
        { plantId: plant.id, name: 'Packaging & Shipping', tenantId: 'default' },
        { plantId: plant.id, name: 'Maintenance', tenantId: 'default' }
      ]
    })

    const deptList = await prisma.department.findMany()
    const [prodDept, qcDept, packDept, maintDept] = deptList

    // 2. Create Workcenters (Production Lines)
    console.log('⚙️  Creating workcenters...')
    const workcenters = await prisma.workcenter.createMany({
      data: [
        {
          plantId: plant.id,
          departmentId: prodDept.id,
          workcenterNo: 'LINE-001',
          name: 'Assembly Line A',
          displayTitle: 'High-Volume Assembly',
          minStaff: 3,
          changeoverFamily: 'Electronics',
          tenantId: 'default'
        },
        {
          plantId: plant.id,
          departmentId: prodDept.id,
          workcenterNo: 'LINE-002',
          name: 'Assembly Line B',
          displayTitle: 'Precision Assembly',
          minStaff: 4,
          changeoverFamily: 'Electronics',
          tenantId: 'default'
        },
        {
          plantId: plant.id,
          departmentId: prodDept.id,
          workcenterNo: 'LINE-003',
          name: 'Final Assembly',
          displayTitle: 'Integration & Testing',
          minStaff: 2,
          changeoverFamily: 'Final',
          tenantId: 'default'
        },
        {
          plantId: plant.id,
          departmentId: qcDept.id,
          workcenterNo: 'QC-001',
          name: 'Quality Control Station',
          displayTitle: 'Inspection & Testing',
          minStaff: 2,
          changeoverFamily: 'Testing',
          tenantId: 'default'
        },
        {
          plantId: plant.id,
          departmentId: packDept.id,
          workcenterNo: 'PACK-001',
          name: 'Packaging Line',
          displayTitle: 'Package & Ship',
          minStaff: 3,
          changeoverFamily: 'Packaging',
          tenantId: 'default'
        }
      ]
    })

    const wcList = await prisma.workcenter.findMany()

    // 3. Create Skills
    console.log('🎯 Creating operator skills...')
    const skills = await prisma.skill.createMany({
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

    const skillList = await prisma.skill.findMany()

    // 4. Create Shift Patterns
    console.log('⏰ Creating shift patterns...')
    const shiftPatterns = await prisma.shiftPattern.createMany({
      data: [
        {
          name: 'Day Shift',
          description: 'Standard day shift',
          startTime: '06:00',
          endTime: '14:00',
          daysOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          totalHours: 8
        },
        {
          name: 'Evening Shift',
          description: 'Evening production shift',
          startTime: '14:00',
          endTime: '22:00',
          daysOfWeek: 'Monday,Tuesday,Wednesday,Thursday,Friday',
          totalHours: 8
        },
        {
          name: 'Night Shift',
          description: 'Night maintenance shift',
          startTime: '22:00',
          endTime: '06:00',
          daysOfWeek: 'Sunday,Monday,Tuesday,Wednesday,Thursday',
          totalHours: 8
        }
      ]
    })

    const shiftList = await prisma.shiftPattern.findMany()

    // 5. Create Operators (Workforce)
    console.log('👥 Creating operators...')
    const operators = [
      { employeeId: 'EMP001', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@aips.com', departmentId: prodDept.id, basePayRate: 28.50 },
      { employeeId: 'EMP002', firstName: 'Mike', lastName: 'Rodriguez', email: 'mike.rodriguez@aips.com', departmentId: prodDept.id, basePayRate: 32.00 },
      { employeeId: 'EMP003', firstName: 'Emily', lastName: 'Chen', email: 'emily.chen@aips.com', departmentId: qcDept.id, basePayRate: 30.75 },
      { employeeId: 'EMP004', firstName: 'David', lastName: 'Thompson', email: 'david.thompson@aips.com', departmentId: prodDept.id, basePayRate: 29.25 },
      { employeeId: 'EMP005', firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.anderson@aips.com', departmentId: packDept.id, basePayRate: 26.50 },
      { employeeId: 'EMP006', firstName: 'Carlos', lastName: 'Martinez', email: 'carlos.martinez@aips.com', departmentId: prodDept.id, basePayRate: 31.00 },
      { employeeId: 'EMP007', firstName: 'Jennifer', lastName: 'Taylor', email: 'jennifer.taylor@aips.com', departmentId: qcDept.id, basePayRate: 33.25 },
      { employeeId: 'EMP008', firstName: 'Robert', lastName: 'Wilson', email: 'robert.wilson@aips.com', departmentId: maintDept.id, basePayRate: 35.00 },
      { employeeId: 'EMP009', firstName: 'Amanda', lastName: 'Brown', email: 'amanda.brown@aips.com', departmentId: prodDept.id, basePayRate: 27.75 },
      { employeeId: 'EMP010', firstName: 'Kevin', lastName: 'Davis', email: 'kevin.davis@aips.com', departmentId: packDept.id, basePayRate: 28.00 }
    ]

    for (const op of operators) {
      await prisma.operator.create({
        data: {
          ...op,
          hireDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000 * 3), // Random hire date within last 3 years
          tenantId: 'default'
        }
      })
    }

    const operatorList = await prisma.operator.findMany()

    // 6. Create SKUs and Products
    console.log('📦 Creating products...')
    const skus = [
      { skuNo: 'CTRL-001', name: 'Industrial Controller Pro', family: 'Controllers', baseProcessingTime: 120, setupTime: 30, idealCycleTime: 8 },
      { skuNo: 'SENS-002', name: 'Temperature Sensor Array', family: 'Sensors', baseProcessingTime: 45, setupTime: 15, idealCycleTime: 3 },
      { skuNo: 'MOTO-003', name: 'Servo Motor Assembly', family: 'Motors', baseProcessingTime: 180, setupTime: 45, idealCycleTime: 12 },
      { skuNo: 'DISP-004', name: 'HMI Display Unit', family: 'Displays', baseProcessingTime: 90, setupTime: 20, idealCycleTime: 6 },
      { skuNo: 'CABL-005', name: 'Industrial Cable Harness', family: 'Cables', baseProcessingTime: 60, setupTime: 10, idealCycleTime: 4 },
      { skuNo: 'POWR-006', name: 'Power Supply Module', family: 'Power', baseProcessingTime: 150, setupTime: 35, idealCycleTime: 10 },
      { skuNo: 'SAFE-007', name: 'Safety Relay System', family: 'Safety', baseProcessingTime: 200, setupTime: 50, idealCycleTime: 15 }
    ]

    for (const sku of skus) {
      await prisma.sku.create({
        data: {
          ...sku,
          colorCode: `#${Math.floor(Math.random()*16777215).toString(16)}`,
          products: {
            create: {
              bomVersion: '1.0',
              yield: 0.95 + Math.random() * 0.04, // 95-99% yield
              scrapRate: Math.random() * 0.03 // 0-3% scrap
            }
          }
        }
      })
    }

    const skuList = await prisma.sku.findMany()

    // 7. Create Production Orders (Active Manufacturing)
    console.log('📋 Creating production orders...')
    const today = new Date()
    const orders = []

    for (let i = 0; i < 25; i++) {
      const sku = skuList[Math.floor(Math.random() * skuList.length)]
      const wc = wcList[Math.floor(Math.random() * wcList.length)]
      const dueDate = new Date(today.getTime() + (Math.random() * 14 + 1) * 24 * 60 * 60 * 1000) // 1-14 days from now
      
      orders.push({
        orderNo: `ORD-${String(i + 1).padStart(4, '0')}`,
        skuId: sku.id,
        workcenterId: wc.id,
        quantity: Math.floor(Math.random() * 500) + 50, // 50-550 units
        priority: Math.floor(Math.random() * 10) + 1,
        dueDate,
        startDate: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Started within last week
        isRush: Math.random() > 0.8, // 20% rush orders
        performanceLever: 0.85 + Math.random() * 0.3 // 85-115% performance
      })
    }

    for (const order of orders) {
      await prisma.order.create({ data: order })
    }

    const orderList = await prisma.order.findMany()

    // 8. Create Schedule Blocks (Current Production Schedule)
    console.log('📅 Creating production schedule...')
    for (const order of orderList.slice(0, 15)) { // Schedule first 15 orders
      const sku = skuList.find(s => s.id === order.skuId)!
      const processingTime = sku.baseProcessingTime! * order.quantity / 60 // Convert to minutes
      
      const startTime = new Date(order.startDate!)
      const endTime = new Date(startTime.getTime() + processingTime * 60 * 1000)
      
      await prisma.scheduleBlock.create({
        data: {
          orderId: order.id,
          workcenterId: order.workcenterId,
          startTime,
          endTime,
          scheduledUnits: order.quantity,
          actualUnits: Math.random() > 0.3 ? Math.floor(order.quantity * (0.8 + Math.random() * 0.4)) : null, // 70% have actuals
          laborMinutesPlanned: Math.floor(processingTime * 0.8),
          laborMinutesActual: Math.random() > 0.3 ? Math.floor(processingTime * (0.7 + Math.random() * 0.6)) : null,
          status: Math.random() > 0.4 ? 'In Progress' : Math.random() > 0.7 ? 'Completed' : 'Planned'
        }
      })
    }

    // 9. Create Changeovers
    console.log('🔄 Creating changeovers...')
    const scheduleBlocks = await prisma.scheduleBlock.findMany({ orderBy: { startTime: 'asc' } })
    
    for (let i = 0; i < scheduleBlocks.length - 1; i++) {
      const currentBlock = scheduleBlocks[i]
      const nextBlock = scheduleBlocks[i + 1]
      
      if (currentBlock.workcenterId === nextBlock.workcenterId) {
        await prisma.changeover.create({
          data: {
            workcenterId: currentBlock.workcenterId,
            fromBlockId: currentBlock.id,
            toBlockId: nextBlock.id,
            estimatedTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
            actualTime: Math.random() > 0.3 ? Math.floor(Math.random() * 90) + 10 : null,
            status: Math.random() > 0.5 ? 'Completed' : 'Planned'
          }
        })
      }
    }

    // 10. Create Operator Competencies
    console.log('🎓 Creating operator competencies...')
    for (const operator of operatorList) {
      const numSkills = Math.floor(Math.random() * 4) + 2 // 2-5 skills per operator
      const operatorSkills = skillList.sort(() => 0.5 - Math.random()).slice(0, numSkills)
      
      for (const skill of operatorSkills) {
        await prisma.operatorCompetency.create({
          data: {
            operatorId: operator.id,
            skillId: skill.id,
            level: Math.floor(Math.random() * 5) + 1, // 1-5 skill level
            certifiedAt: skill.isCertification ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : null,
            expiresAt: skill.isCertification && skill.expiryMonths ? 
              new Date(Date.now() + skill.expiryMonths * 30 * 24 * 60 * 60 * 1000) : null,
            certifiedBy: skill.isCertification ? 'Training Dept' : null
          }
        })
      }
    }

    // 11. Create Shift Assignments
    console.log('📋 Creating shift assignments...')
    for (const operator of operatorList) {
      const shift = shiftList[Math.floor(Math.random() * shiftList.length)]
      const workcenter = wcList.filter(wc => wc.departmentId === operator.departmentId)[0] || wcList[0]
      
      await prisma.shiftAssignment.create({
        data: {
          operatorId: operator.id,
          workcenterId: workcenter.id,
          shiftPatternId: shift.id,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Started 30 days ago
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Ends in 1 year
        }
      })
    }

    // 12. Create Holidays
    console.log('🎉 Creating holidays...')
    const currentYear = new Date().getFullYear()
    const holidays = [
      { date: new Date(currentYear, 0, 1), name: 'New Year\'s Day' },
      { date: new Date(currentYear, 6, 4), name: 'Independence Day' },
      { date: new Date(currentYear, 8, 4), name: 'Labor Day' },
      { date: new Date(currentYear, 10, 23), name: 'Thanksgiving' },
      { date: new Date(currentYear, 11, 25), name: 'Christmas Day' }
    ]

    for (const holiday of holidays) {
      await prisma.holiday.create({
        data: {
          plantId: plant.id,
          date: holiday.date,
          name: holiday.name
        }
      })
    }

    console.log('✅ Production database seeded successfully!')
    console.log(`
🏭 Created:
   • 1 Plant with 4 Departments
   • 5 Production Workcenters
   • 8 Operator Skills
   • 10 Operators with competencies
   • 7 Product SKUs
   • 25 Production Orders
   • 15 Active Schedule Blocks
   • Changeovers and Shift Assignments
   • Company Holidays
   
🚀 Your AIPS system is now running at full capacity!
    `)

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedProduction()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
