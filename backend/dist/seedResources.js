"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedResourcesManagement = seedResourcesManagement;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Core skills for manufacturing operations
const CORE_SKILLS = [
    { code: 'OP_BASIC', name: 'Basic Operations', description: 'Fundamental production line operations', category: 'Technical', isCore: true },
    { code: 'QC_VISUAL', name: 'Visual Quality Control', description: 'Visual inspection and quality checks', category: 'Quality', isCore: true },
    { code: 'SAFETY_PPE', name: 'PPE & Safety Protocols', description: 'Personal protective equipment and safety procedures', category: 'Safety', isCore: true, isCertification: true, expiryMonths: 12 },
    { code: 'MECH_L1', name: 'Mechanic Level 1', description: 'Basic mechanical troubleshooting and maintenance', category: 'Technical' },
    { code: 'MECH_L2', name: 'Mechanic Level 2', description: 'Advanced mechanical repairs and changeovers', category: 'Technical', isCertification: true, expiryMonths: 24 },
    { code: 'ELEC_L1', name: 'Electrical Level 1', description: 'Basic electrical systems and controls', category: 'Technical', isCertification: true, expiryMonths: 18 },
    { code: 'ELEC_L2', name: 'Electrical Level 2', description: 'Advanced electrical troubleshooting and PLC', category: 'Technical', isCertification: true, expiryMonths: 24 },
    { code: 'FORK_CERT', name: 'Forklift Certified', description: 'Certified forklift operator', category: 'Safety', isCertification: true, expiryMonths: 36 },
    { code: 'LEAD_TEAM', name: 'Team Leadership', description: 'Team leadership and coordination skills', category: 'Leadership' },
    { code: 'TRAIN_OTH', name: 'Trainer Certification', description: 'Certified to train other operators', category: 'Leadership', isCertification: true, expiryMonths: 24 },
    { code: 'QC_CHEM', name: 'Chemical Quality Testing', description: 'Chemical analysis and quality testing', category: 'Quality', isCertification: true, expiryMonths: 12 },
    { code: 'CLEAN_CIP', name: 'CIP/Sanitation', description: 'Clean-in-place and sanitation procedures', category: 'Quality', isCore: true },
    { code: 'PACK_ADV', name: 'Advanced Packaging', description: 'Complex packaging operations and troubleshooting', category: 'Technical' },
    { code: 'CONT_IMP', name: 'Continuous Improvement', description: 'Lean manufacturing and process improvement', category: 'Leadership' }
];
// Standard shift patterns
const SHIFT_PATTERNS = [
    { name: '4x12 Days', description: '4 days on, 3 days off - Day shift', startTime: '06:00', endTime: '18:00', hoursPerShift: 12.0, daysPattern: '1111000' },
    { name: '4x12 Nights', description: '4 days on, 3 days off - Night shift', startTime: '18:00', endTime: '06:00', hoursPerShift: 12.0, daysPattern: '1111000' },
    { name: '3x8 Days', description: '5 days on, 2 days off - Day shift', startTime: '07:00', endTime: '15:00', hoursPerShift: 8.0, daysPattern: '1111100' },
    { name: '3x8 Evenings', description: '5 days on, 2 days off - Evening shift', startTime: '15:00', endTime: '23:00', hoursPerShift: 8.0, daysPattern: '1111100' },
    { name: '3x8 Nights', description: '5 days on, 2 days off - Night shift', startTime: '23:00', endTime: '07:00', hoursPerShift: 8.0, daysPattern: '1111100' },
    { name: 'Maintenance Days', description: 'Monday-Friday maintenance schedule', startTime: '08:00', endTime: '16:00', hoursPerShift: 8.0, daysPattern: '1111100' }
];
// Sample operators with varying skill levels
const OPERATORS = [
    { employeeId: 'OP001', firstName: 'John', lastName: 'Smith', email: 'john.smith@company.com', hireDate: '2020-01-15', basePayRate: 28.50 },
    { employeeId: 'OP002', firstName: 'Maria', lastName: 'Garcia', email: 'maria.garcia@company.com', hireDate: '2019-03-22', basePayRate: 32.00 },
    { employeeId: 'OP003', firstName: 'David', lastName: 'Johnson', email: 'david.johnson@company.com', hireDate: '2021-07-10', basePayRate: 26.75 },
    { employeeId: 'OP004', firstName: 'Sarah', lastName: 'Williams', email: 'sarah.williams@company.com', hireDate: '2018-11-05', basePayRate: 34.25 },
    { employeeId: 'OP005', firstName: 'Michael', lastName: 'Brown', email: 'michael.brown@company.com', hireDate: '2022-02-14', basePayRate: 25.00 },
    { employeeId: 'MN001', firstName: 'Robert', lastName: 'Davis', email: 'robert.davis@company.com', hireDate: '2017-05-08', basePayRate: 42.00 },
    { employeeId: 'MN002', firstName: 'Jennifer', lastName: 'Miller', email: 'jennifer.miller@company.com', hireDate: '2019-09-12', basePayRate: 38.50 },
    { employeeId: 'LD001', firstName: 'James', lastName: 'Wilson', email: 'james.wilson@company.com', hireDate: '2016-08-30', basePayRate: 45.00 },
    { employeeId: 'LD002', firstName: 'Lisa', lastName: 'Moore', email: 'lisa.moore@company.com', hireDate: '2018-04-18', basePayRate: 41.75 },
    { employeeId: 'QC001', firstName: 'Thomas', lastName: 'Taylor', email: 'thomas.taylor@company.com', hireDate: '2020-10-25', basePayRate: 36.00 }
];
async function seedSkills() {
    console.log('🎯 Seeding core skills...');
    for (const skill of CORE_SKILLS) {
        await prisma.skill.upsert({
            where: { code: skill.code },
            update: skill,
            create: skill
        });
    }
    console.log(`✅ Created ${CORE_SKILLS.length} skills`);
}
async function seedShiftPatterns() {
    console.log('⏰ Seeding shift patterns...');
    for (const pattern of SHIFT_PATTERNS) {
        await prisma.shiftPattern.upsert({
            where: { name: pattern.name },
            update: pattern,
            create: pattern
        });
    }
    console.log(`✅ Created ${SHIFT_PATTERNS.length} shift patterns`);
}
async function seedOperators() {
    console.log('👥 Seeding operators...');
    // Get the default department for operators
    const department = await prisma.department.findFirst();
    if (!department) {
        throw new Error('No department found - run main seed first');
    }
    for (const op of OPERATORS) {
        await prisma.operator.upsert({
            where: { employeeId: op.employeeId },
            update: {
                firstName: op.firstName,
                lastName: op.lastName,
                email: op.email,
                hireDate: new Date(op.hireDate),
                basePayRate: op.basePayRate,
                departmentId: department.id
            },
            create: {
                ...op,
                hireDate: new Date(op.hireDate),
                departmentId: department.id
            }
        });
    }
    console.log(`✅ Created ${OPERATORS.length} operators`);
}
async function seedCompetencies() {
    console.log('🎓 Seeding operator competencies...');
    const operators = await prisma.operator.findMany();
    const skills = await prisma.skill.findMany();
    // Define competency profiles for different operator types
    const competencyProfiles = {
        // Standard operators - basic skills
        'OP': [
            { skillCode: 'OP_BASIC', level: 3 },
            { skillCode: 'QC_VISUAL', level: 2 },
            { skillCode: 'SAFETY_PPE', level: 4, certified: true },
            { skillCode: 'CLEAN_CIP', level: 3 }
        ],
        // Maintenance staff - technical skills
        'MN': [
            { skillCode: 'OP_BASIC', level: 4 },
            { skillCode: 'MECH_L1', level: 4 },
            { skillCode: 'MECH_L2', level: 3, certified: true },
            { skillCode: 'ELEC_L1', level: 3, certified: true },
            { skillCode: 'SAFETY_PPE', level: 5, certified: true },
            { skillCode: 'FORK_CERT', level: 4, certified: true }
        ],
        // Team leads - leadership + technical
        'LD': [
            { skillCode: 'OP_BASIC', level: 5 },
            { skillCode: 'QC_VISUAL', level: 4 },
            { skillCode: 'LEAD_TEAM', level: 4 },
            { skillCode: 'TRAIN_OTH', level: 3, certified: true },
            { skillCode: 'SAFETY_PPE', level: 5, certified: true },
            { skillCode: 'CONT_IMP', level: 3 },
            { skillCode: 'MECH_L1', level: 3 }
        ],
        // Quality control - quality focused
        'QC': [
            { skillCode: 'QC_VISUAL', level: 5 },
            { skillCode: 'QC_CHEM', level: 4, certified: true },
            { skillCode: 'SAFETY_PPE', level: 4, certified: true },
            { skillCode: 'OP_BASIC', level: 3 },
            { skillCode: 'CLEAN_CIP', level: 4 }
        ]
    };
    for (const operator of operators) {
        const prefix = operator.employeeId.substring(0, 2);
        const profile = competencyProfiles[prefix] || competencyProfiles['OP'];
        for (const comp of profile) {
            const skill = skills.find(s => s.code === comp.skillCode);
            if (!skill)
                continue;
            const certifiedAt = comp.certified ? new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000) : null;
            const expiresAt = certifiedAt && skill.expiryMonths
                ? new Date(certifiedAt.getTime() + skill.expiryMonths * 30 * 24 * 60 * 60 * 1000)
                : null;
            await prisma.operatorCompetency.upsert({
                where: {
                    operatorId_skillId: {
                        operatorId: operator.id,
                        skillId: skill.id
                    }
                },
                update: {
                    level: comp.level,
                    certifiedAt,
                    expiresAt
                },
                create: {
                    operatorId: operator.id,
                    skillId: skill.id,
                    level: comp.level,
                    certifiedAt,
                    expiresAt,
                    certifiedBy: comp.certified ? 'Training Department' : null
                }
            });
        }
    }
    console.log('✅ Created operator competencies');
}
async function seedSkillRequirements() {
    console.log('📋 Seeding workcenter skill requirements...');
    const workcenters = await prisma.workcenter.findMany();
    const skills = await prisma.skill.findMany();
    // Define skill requirements for different workcenters
    const requirements = [
        { skillCode: 'OP_BASIC', minLevel: 2, isRequired: true },
        { skillCode: 'SAFETY_PPE', minLevel: 3, isRequired: true },
        { skillCode: 'QC_VISUAL', minLevel: 2, isRequired: true },
        { skillCode: 'CLEAN_CIP', minLevel: 2, isRequired: true },
        { skillCode: 'MECH_L1', minLevel: 2, isRequired: false }, // Preferred
        { skillCode: 'PACK_ADV', minLevel: 3, isRequired: false } // For packaging lines
    ];
    for (const workcenter of workcenters) {
        for (const req of requirements) {
            const skill = skills.find(s => s.code === req.skillCode);
            if (!skill)
                continue;
            // Different requirements for different shifts
            const shiftTypes = ['Day', 'Evening', 'Night'];
            for (const shiftType of shiftTypes) {
                // Adjust requirements for night shift (higher skill levels needed)
                const adjustedMinLevel = shiftType === 'Night' ? Math.min(req.minLevel + 1, 5) : req.minLevel;
                await prisma.skillRequirement.upsert({
                    where: {
                        workcenterId_skillId_shiftType: {
                            workcenterId: workcenter.id,
                            skillId: skill.id,
                            shiftType
                        }
                    },
                    update: {
                        minLevel: adjustedMinLevel,
                        isRequired: req.isRequired
                    },
                    create: {
                        workcenterId: workcenter.id,
                        skillId: skill.id,
                        minLevel: adjustedMinLevel,
                        isRequired: req.isRequired,
                        shiftType
                    }
                });
            }
        }
    }
    console.log('✅ Created skill requirements for workcenters');
}
async function seedShiftAssignments() {
    console.log('📅 Seeding shift assignments...');
    const operators = await prisma.operator.findMany();
    const workcenters = await prisma.workcenter.findMany();
    const shiftPatterns = await prisma.shiftPattern.findMany();
    // Assign operators to shifts
    const assignments = [
        { operatorPrefix: 'OP', shiftPattern: '4x12 Days', role: 'Operator' },
        { operatorPrefix: 'MN', shiftPattern: 'Maintenance Days', role: 'Mechanic' },
        { operatorPrefix: 'LD', shiftPattern: '4x12 Days', role: 'Lead' },
        { operatorPrefix: 'QC', shiftPattern: '3x8 Days', role: 'Quality' }
    ];
    for (const operator of operators) {
        const prefix = operator.employeeId.substring(0, 2);
        const assignment = assignments.find(a => a.operatorPrefix === prefix);
        if (!assignment)
            continue;
        const pattern = shiftPatterns.find(p => p.name === assignment.shiftPattern);
        const workcenter = workcenters[Math.floor(Math.random() * workcenters.length)];
        if (pattern && workcenter) {
            await prisma.shiftAssignment.create({
                data: {
                    operatorId: operator.id,
                    workcenterId: workcenter.id,
                    shiftPatternId: pattern.id,
                    startDate: new Date('2024-01-01'),
                    role: assignment.role,
                    payRate: operator.basePayRate
                }
            });
        }
    }
    console.log('✅ Created shift assignments');
}
async function seedResourcesManagement() {
    console.log('🚀 Starting Resources Management seed...');
    try {
        await seedSkills();
        await seedShiftPatterns();
        await seedOperators();
        await seedCompetencies();
        await seedSkillRequirements();
        await seedShiftAssignments();
        console.log('🎉 Resources Management seed completed successfully!');
    }
    catch (error) {
        console.error('❌ Error seeding resources management:', error);
        throw error;
    }
}
// Run if called directly
if (require.main === module) {
    seedResourcesManagement()
        .catch(console.error)
        .finally(() => prisma.$disconnect());
}
