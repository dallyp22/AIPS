import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Enhanced operator competency scenarios
const OPERATOR_SCENARIOS = [
  {
    employeeId: 'OP001',
    role: 'Senior Operator',
    skills: [
      { skillCode: 'OP_BASIC', level: 5, certified: true, months: 36 },
      { skillCode: 'QC_VISUAL', level: 4, certified: true, months: 24 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 6 },
      { skillCode: 'PACK_ADV', level: 4, certified: false, months: 0 },
      { skillCode: 'LEAD_TEAM', level: 3, certified: false, months: 0 }
    ]
  },
  {
    employeeId: 'OP002',
    role: 'Line Lead',
    skills: [
      { skillCode: 'OP_BASIC', level: 5, certified: true, months: 48 },
      { skillCode: 'QC_VISUAL', level: 5, certified: true, months: 18 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 3 },
      { skillCode: 'MECH_L1', level: 3, certified: true, months: 30 },
      { skillCode: 'LEAD_TEAM', level: 4, certified: true, months: 12 },
      { skillCode: 'TRAIN_OTH', level: 3, certified: true, months: 18 }
    ]
  },
  {
    employeeId: 'OP003',
    role: 'Junior Operator',
    skills: [
      { skillCode: 'OP_BASIC', level: 3, certified: true, months: 18 },
      { skillCode: 'QC_VISUAL', level: 2, certified: false, months: 0 },
      { skillCode: 'SAFETY_PPE', level: 4, certified: true, months: 12 },
      { skillCode: 'CLEAN_CIP', level: 3, certified: true, months: 6 }
    ]
  },
  {
    employeeId: 'OP004',
    role: 'Quality Specialist',
    skills: [
      { skillCode: 'OP_BASIC', level: 4, certified: true, months: 30 },
      { skillCode: 'QC_VISUAL', level: 5, certified: true, months: 6 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 9 },
      { skillCode: 'QC_CHEM', level: 4, certified: true, months: 12 },
      { skillCode: 'CONT_IMP', level: 3, certified: false, months: 0 }
    ]
  },
  {
    employeeId: 'OP005',
    role: 'Trainee',
    skills: [
      { skillCode: 'OP_BASIC', level: 2, certified: false, months: 0 },
      { skillCode: 'SAFETY_PPE', level: 3, certified: true, months: 3 },
      { skillCode: 'CLEAN_CIP', level: 2, certified: false, months: 0 }
    ]
  },
  {
    employeeId: 'MN001',
    role: 'Maintenance Tech L2',
    skills: [
      { skillCode: 'OP_BASIC', level: 4, certified: true, months: 60 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 6 },
      { skillCode: 'MECH_L1', level: 5, certified: true, months: 36 },
      { skillCode: 'MECH_L2', level: 4, certified: true, months: 24 },
      { skillCode: 'ELEC_L1', level: 3, certified: true, months: 30 },
      { skillCode: 'ELEC_L2', level: 2, certified: false, months: 0 }
    ]
  },
  {
    employeeId: 'MN002',
    role: 'Maintenance Tech L1',
    skills: [
      { skillCode: 'OP_BASIC', level: 3, certified: true, months: 24 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 9 },
      { skillCode: 'MECH_L1', level: 4, certified: true, months: 18 },
      { skillCode: 'ELEC_L1', level: 3, certified: true, months: 12 },
      { skillCode: 'FORK_CERT', level: 3, certified: true, months: 24 }
    ]
  },
  {
    employeeId: 'LD001',
    role: 'Shift Supervisor',
    skills: [
      { skillCode: 'OP_BASIC', level: 5, certified: true, months: 72 },
      { skillCode: 'QC_VISUAL', level: 4, certified: true, months: 36 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 6 },
      { skillCode: 'LEAD_TEAM', level: 5, certified: true, months: 18 },
      { skillCode: 'TRAIN_OTH', level: 4, certified: true, months: 12 },
      { skillCode: 'CONT_IMP', level: 4, certified: true, months: 24 },
      { skillCode: 'PACK_ADV', level: 3, certified: true, months: 36 }
    ]
  },
  {
    employeeId: 'LD002',
    role: 'Assistant Supervisor',
    skills: [
      { skillCode: 'OP_BASIC', level: 5, certified: true, months: 48 },
      { skillCode: 'QC_VISUAL', level: 4, certified: true, months: 24 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 12 },
      { skillCode: 'LEAD_TEAM', level: 3, certified: false, months: 0 },
      { skillCode: 'MECH_L1', level: 2, certified: false, months: 0 }
    ]
  },
  {
    employeeId: 'QC001',
    role: 'QC Inspector',
    skills: [
      { skillCode: 'OP_BASIC', level: 3, certified: true, months: 36 },
      { skillCode: 'QC_VISUAL', level: 5, certified: true, months: 12 },
      { skillCode: 'SAFETY_PPE', level: 5, certified: true, months: 6 },
      { skillCode: 'QC_CHEM', level: 5, certified: true, months: 6 },
      { skillCode: 'CONT_IMP', level: 3, certified: true, months: 18 }
    ]
  }
]

// Realistic shift assignment patterns
const SHIFT_ASSIGNMENTS = [
  // Day shift operators (6 AM - 6 PM)
  { employeeIds: ['OP001', 'OP003', 'LD001', 'QC001'], pattern: '4x12 Days', workcenters: [1, 2] },
  
  // Night shift operators (6 PM - 6 AM)  
  { employeeIds: ['OP002', 'OP005', 'LD002'], pattern: '4x12 Nights', workcenters: [1, 3] },
  
  // Maintenance (Monday-Friday, 8 AM - 4 PM)
  { employeeIds: ['MN001', 'MN002'], pattern: 'Maintenance Days', workcenters: [1, 2, 3] },
  
  // Quality specialist (Monday-Friday, 7 AM - 3 PM)
  { employeeIds: ['OP004'], pattern: '3x8 Days', workcenters: [1, 2, 3] }
]

async function clearOperatorData() {
  console.log('🧹 Clearing existing operator competencies and assignments...')
  
  await prisma.shiftAssignment.deleteMany()
  await prisma.operatorCompetency.deleteMany()
  
  console.log('✅ Operator data cleared')
}

async function enhanceOperatorCompetencies() {
  console.log('🎓 Enhancing operator competencies with realistic scenarios...')
  
  const operators = await prisma.operator.findMany()
  const skills = await prisma.skill.findMany()
  
  const operatorMap = new Map(operators.map(op => [op.employeeId, op]))
  const skillMap = new Map(skills.map(skill => [skill.code, skill]))
  
  for (const scenario of OPERATOR_SCENARIOS) {
    const operator = operatorMap.get(scenario.employeeId)
    if (!operator) continue
    
    console.log(`   👤 Setting up ${operator.firstName} ${operator.lastName} (${scenario.role})`)
    
    for (const skillData of scenario.skills) {
      const skill = skillMap.get(skillData.skillCode)
      if (!skill) continue
      
      const certifiedAt = skillData.certified ? new Date() : null
      const expiresAt = skillData.certified && skill.expiryMonths ? 
        new Date(Date.now() + skillData.months * 30 * 24 * 60 * 60 * 1000) : null
      
      await prisma.operatorCompetency.create({
        data: {
          operatorId: operator.id,
          skillId: skill.id,
          level: skillData.level,
          certifiedAt,
          expiresAt,
          certifiedBy: skillData.certified ? 'Training Department' : null,
          notes: `${scenario.role} - Level ${skillData.level} competency`,
          isActive: true
        }
      })
    }
  }
  
  console.log('✅ Enhanced operator competencies created')
}

async function createRealisticShiftAssignments() {
  console.log('📋 Creating realistic shift assignments...')
  
  const operators = await prisma.operator.findMany()
  const workcenters = await prisma.workcenter.findMany()
  const shiftPatterns = await prisma.shiftPattern.findMany()
  
  const operatorMap = new Map(operators.map(op => [op.employeeId, op]))
  const patternMap = new Map(shiftPatterns.map(p => [p.name, p]))
  
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30) // Start 30 days ago
  
  for (const assignment of SHIFT_ASSIGNMENTS) {
    const pattern = patternMap.get(assignment.pattern)
    if (!pattern) continue
    
    for (const employeeId of assignment.employeeIds) {
      const operator = operatorMap.get(employeeId)
      if (!operator) continue
      
      // Assign to multiple workcenters if specified
      for (const wcId of assignment.workcenters) {
        const workcenter = workcenters.find(wc => wc.id === wcId)
        if (!workcenter) continue
        
        // Create assignment starting 30 days ago, ending 30 days from now
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 30)
        
        // Determine role and pay rate based on operator scenario
        const scenario = OPERATOR_SCENARIOS.find(s => s.employeeId === employeeId)
        const role = scenario?.role.includes('Lead') ? 'Lead' :
                    scenario?.role.includes('Supervisor') ? 'Lead' :
                    scenario?.role.includes('Maintenance') ? 'Mechanic' :
                    scenario?.role.includes('Quality') ? 'Quality' : 'Operator'
        
        const baseRate = operator.basePayRate || 25.00
        const payRate = role === 'Lead' ? baseRate * 1.15 :
                       role === 'Mechanic' ? baseRate * 1.25 :
                       role === 'Quality' ? baseRate * 1.10 : baseRate
        
        try {
          await prisma.shiftAssignment.create({
            data: {
              operatorId: operator.id,
              workcenterId: workcenter.id,
              shiftPatternId: pattern.id,
              startDate,
              endDate,
              isActive: true,
              role,
              payRate: Math.round(payRate * 100) / 100,
              notes: `Assigned to ${assignment.pattern} - ${workcenter.displayTitle || workcenter.name}`
            }
          })
        } catch (error) {
          // Skip duplicates (unique constraint on operatorId, workcenterId, startDate)
          console.log(`   ⚠️  Skipping duplicate assignment for ${operator.firstName} ${operator.lastName}`)
        }
      }
    }
  }
  
  console.log('✅ Realistic shift assignments created')
}

async function generateCompetencyStatistics() {
  console.log('📊 Generating competency statistics...')
  
  const competencyCount = await prisma.operatorCompetency.count()
  const certifiedCount = await prisma.operatorCompetency.count({
    where: { certifiedAt: { not: null } }
  })
  const assignmentCount = await prisma.shiftAssignment.count()
  
  // Get skill level distribution
  const skillLevels = await prisma.operatorCompetency.groupBy({
    by: ['level'],
    _count: { level: true },
    orderBy: { level: 'asc' }
  })
  
  console.log(`
🎯 Competency Statistics:
   🎓 Total Competencies: ${competencyCount}
   ✅ Certified: ${certifiedCount} (${Math.round(certifiedCount/competencyCount*100)}%)
   📋 Shift Assignments: ${assignmentCount}
   
📊 Skill Level Distribution:`)
  
  for (const level of skillLevels) {
    const percentage = Math.round(level._count.level / competencyCount * 100)
    console.log(`   Level ${level.level}: ${level._count.level} (${percentage}%)`)
  }
  
  // Sample competency matrix data
  const sampleData = await prisma.operatorCompetency.findMany({
    include: {
      operator: { select: { firstName: true, lastName: true, employeeId: true } },
      skill: { select: { name: true, category: true } }
    },
    take: 5
  })
  
  console.log('\n👥 Sample Competencies:')
  for (const comp of sampleData) {
    const status = comp.certifiedAt ? '✅' : '⏳'
    console.log(`   ${status} ${comp.operator.firstName} ${comp.operator.lastName}: ${comp.skill.name} (L${comp.level})`)
  }
}

async function main() {
  try {
    console.log('🚀 Starting Enhanced Operator Competency Seeding...\n')
    
    await clearOperatorData()
    await enhanceOperatorCompetencies()
    await createRealisticShiftAssignments()
    await generateCompetencyStatistics()
    
    console.log('\n🎉 Enhanced operator seeding completed successfully!')
    console.log('💼 Your operators now have realistic competencies and shift assignments!')
    
  } catch (error) {
    console.error('❌ Error during operator enhancement:', error)
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
