#!/usr/bin/env tsx

/**
 * Export SQLite data to PostgreSQL-compatible SQL inserts
 */

import { prisma } from './prisma'
import fs from 'fs'
import path from 'path'

async function exportData() {
  console.log('📤 Exporting production data to SQL...')
  
  try {
    let sql = `-- AIPS Production Database Export
-- Generated: ${new Date().toISOString()}

-- Clear existing data
DELETE FROM "ShiftAssignment";
DELETE FROM "OperatorCompetency"; 
DELETE FROM "SkillRequirement";
DELETE FROM "Changeover";
DELETE FROM "ScheduleBlock";
DELETE FROM "Order";
DELETE FROM "Product";
DELETE FROM "SKU";
DELETE FROM "Operator";
DELETE FROM "Skill";
DELETE FROM "ShiftPattern";
DELETE FROM "Holiday";
DELETE FROM "Workcenter";
DELETE FROM "Department";
DELETE FROM "Plant";

-- Reset sequences
ALTER SEQUENCE "Plant_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Department_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Workcenter_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Holiday_id_seq" RESTART WITH 1;
ALTER SEQUENCE "SKU_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Product_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ScheduleBlock_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Changeover_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Operator_id_seq" RESTART WITH 1;
ALTER SEQUENCE "Skill_id_seq" RESTART WITH 1;
ALTER SEQUENCE "OperatorCompetency_id_seq" RESTART WITH 1;
ALTER SEQUENCE "SkillRequirement_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ShiftPattern_id_seq" RESTART WITH 1;
ALTER SEQUENCE "ShiftAssignment_id_seq" RESTART WITH 1;

`

    // Export Plants
    const plants = await prisma.plant.findMany()
    for (const plant of plants) {
      sql += `INSERT INTO "Plant" (id, name, "tenantId") VALUES (${plant.id}, '${plant.name.replace(/'/g, "''")}', '${plant.tenantId}');\n`
    }

    // Export Departments
    const departments = await prisma.department.findMany()
    for (const dept of departments) {
      sql += `INSERT INTO "Department" (id, "plantId", name, "tenantId") VALUES (${dept.id}, ${dept.plantId}, '${dept.name.replace(/'/g, "''")}', '${dept.tenantId}');\n`
    }

    // Export Workcenters
    const workcenters = await prisma.workcenter.findMany()
    for (const wc of workcenters) {
      const displayTitle = wc.displayTitle ? `'${wc.displayTitle.replace(/'/g, "''")}'` : 'NULL'
      const changeoverFamily = wc.changeoverFamily ? `'${wc.changeoverFamily.replace(/'/g, "''")}'` : 'NULL'
      const gatingRules = wc.gatingRules ? `'${wc.gatingRules.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "Workcenter" (id, "plantId", "departmentId", "workcenterNo", name, "displayTitle", "defaultSchemeId", "minStaff", "gatingRules", "changeoverFamily", "tenantId") VALUES (${wc.id}, ${wc.plantId}, ${wc.departmentId}, '${wc.workcenterNo}', '${wc.name.replace(/'/g, "''")}', ${displayTitle}, ${wc.defaultSchemeId || 'NULL'}, ${wc.minStaff}, ${gatingRules}, ${changeoverFamily}, '${wc.tenantId}');\n`
    }

    // Export Skills
    const skills = await prisma.skill.findMany()
    for (const skill of skills) {
      const category = skill.category ? `'${skill.category.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "Skill" (id, code, name, category, "isCore", "isCertification", "expiryMonths") VALUES (${skill.id}, '${skill.code}', '${skill.name.replace(/'/g, "''")}', ${category}, ${skill.isCore}, ${skill.isCertification || false}, ${skill.expiryMonths || 'NULL'});\n`
    }

    // Export Shift Patterns
    const shiftPatterns = await prisma.shiftPattern.findMany()
    for (const pattern of shiftPatterns) {
      const description = pattern.description ? `'${pattern.description.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "ShiftPattern" (id, name, description, "startTime", "endTime", "hoursPerShift", "daysPattern", "isActive", "createdAt") VALUES (${pattern.id}, '${pattern.name.replace(/'/g, "''")}', ${description}, '${pattern.startTime}', '${pattern.endTime}', ${pattern.hoursPerShift}, '${pattern.daysPattern}', ${pattern.isActive}, '${pattern.createdAt.toISOString()}');\n`
    }

    // Export Operators
    const operators = await prisma.operator.findMany()
    for (const op of operators) {
      const email = op.email ? `'${op.email.replace(/'/g, "''")}'` : 'NULL'
      const phone = op.phone ? `'${op.phone.replace(/'/g, "''")}'` : 'NULL'
      const basePayRate = op.basePayRate || 'NULL'
      const emergencyContact = op.emergencyContact ? `'${op.emergencyContact.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "Operator" (id, "employeeId", "firstName", "lastName", email, phone, "hireDate", "departmentId", "isActive", "basePayRate", "emergencyContact", "tenantId", "createdAt", "updatedAt") VALUES (${op.id}, '${op.employeeId}', '${op.firstName.replace(/'/g, "''")}', '${op.lastName.replace(/'/g, "''")}', ${email}, ${phone}, '${op.hireDate.toISOString()}', ${op.departmentId || 'NULL'}, ${op.isActive}, ${basePayRate}, ${emergencyContact}, '${op.tenantId}', '${op.createdAt.toISOString()}', '${op.updatedAt.toISOString()}');\n`
    }

    // Export SKUs
    const skus = await prisma.sKU.findMany()
    for (const sku of skus) {
      const familyColorHex = sku.familyColorHex ? `'${sku.familyColorHex}'` : 'NULL'
      const formula = sku.formula ? `'${sku.formula.replace(/'/g, "''")}'` : 'NULL'
      const bottleSize = sku.bottleSize ? `'${sku.bottleSize.replace(/'/g, "''")}'` : 'NULL'
      const caseSize = sku.caseSize ? `'${sku.caseSize.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "SKU" (id, code, family, "familyColorHex", formula, "bottleSize", "caseSize") VALUES (${sku.id}, '${sku.code}', '${sku.family}', ${familyColorHex}, ${formula}, ${bottleSize}, ${caseSize});\n`
    }

    // Export Products
    const products = await prisma.product.findMany()
    for (const product of products) {
      sql += `INSERT INTO "Product" (id, name, "skuId") VALUES (${product.id}, '${product.name.replace(/'/g, "''")}', ${product.skuId});\n`
    }

    // Export Orders
    const orders = await prisma.order.findMany()
    for (const order of orders) {
      const shopfloorTitle = order.shopfloorTitle ? `'${order.shopfloorTitle.replace(/'/g, "''")}'` : 'NULL'
      const colorHex = order.colorHex ? `'${order.colorHex}'` : 'NULL'
      sql += `INSERT INTO "Order" (id, "orderNo", "skuId", qty, "runRateUph", "performanceLeverPct", priority, "dueAt", "workcenterId", "shopfloorTitle", "colorHex") VALUES (${order.id}, '${order.orderNo}', ${order.skuId}, ${order.qty}, ${order.runRateUph}, ${order.performanceLeverPct}, ${order.priority}, '${order.dueAt.toISOString()}', ${order.workcenterId || 'NULL'}, ${shopfloorTitle}, ${colorHex});\n`
    }

    // Export Schedule Blocks
    const scheduleBlocks = await prisma.scheduleBlock.findMany()
    for (const block of scheduleBlocks) {
      sql += `INSERT INTO "ScheduleBlock" (id, "workcenterId", "orderId", "startAt", "endAt") VALUES (${block.id}, ${block.workcenterId}, ${block.orderId || 'NULL'}, '${block.startAt.toISOString()}', '${block.endAt.toISOString()}');\n`
    }

    // Export Changeovers
    const changeovers = await prisma.changeover.findMany()
    for (const changeover of changeovers) {
      const complexityTier = changeover.complexityTier ? `'${changeover.complexityTier.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "Changeover" (id, "workcenterId", "fromBlockId", "toBlockId", "typeCode", "plannedMinutes", "includeInOee", "complexityTier") VALUES (${changeover.id}, ${changeover.workcenterId}, ${changeover.fromBlockId}, ${changeover.toBlockId}, '${changeover.typeCode}', ${changeover.plannedMinutes}, ${changeover.includeInOee}, ${complexityTier});\n`
    }

    // Export Operator Competencies
    const competencies = await prisma.operatorCompetency.findMany()
    for (const comp of competencies) {
      const certifiedAt = comp.certifiedAt ? `'${comp.certifiedAt.toISOString()}'` : 'NULL'
      const expiresAt = comp.expiresAt ? `'${comp.expiresAt.toISOString()}'` : 'NULL'
      const certifiedBy = comp.certifiedBy ? `'${comp.certifiedBy.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "OperatorCompetency" (id, "operatorId", "skillId", level, "certifiedAt", "expiresAt", "certifiedBy") VALUES (${comp.id}, ${comp.operatorId}, ${comp.skillId}, ${comp.level}, ${certifiedAt}, ${expiresAt}, ${certifiedBy});\n`
    }

    // Export Shift Assignments
    const assignments = await prisma.shiftAssignment.findMany()
    for (const assignment of assignments) {
      const endDate = assignment.endDate ? `'${assignment.endDate.toISOString()}'` : 'NULL'
      sql += `INSERT INTO "ShiftAssignment" (id, "operatorId", "workcenterId", "shiftPatternId", "startDate", "endDate", "createdAt", "updatedAt") VALUES (${assignment.id}, ${assignment.operatorId}, ${assignment.workcenterId}, ${assignment.shiftPatternId}, '${assignment.startDate.toISOString()}', ${endDate}, '${assignment.createdAt.toISOString()}', '${assignment.updatedAt.toISOString()}');\n`
    }

    // Export Holidays
    const holidays = await prisma.holiday.findMany()
    for (const holiday of holidays) {
      const label = holiday.label ? `'${holiday.label.replace(/'/g, "''")}'` : 'NULL'
      sql += `INSERT INTO "Holiday" (id, "plantId", date, label) VALUES (${holiday.id}, ${holiday.plantId}, '${holiday.date.toISOString()}', ${label});\n`
    }

    // Write to file
    const exportPath = path.join(process.cwd(), '..', 'production_data.sql')
    fs.writeFileSync(exportPath, sql)
    
    console.log(`✅ Data exported to: ${exportPath}`)
    console.log(`📊 Export includes:`)
    console.log(`   • ${plants.length} Plants`)
    console.log(`   • ${departments.length} Departments`) 
    console.log(`   • ${workcenters.length} Workcenters`)
    console.log(`   • ${operators.length} Operators`)
    console.log(`   • ${skills.length} Skills`)
    console.log(`   • ${orders.length} Orders`)
    console.log(`   • ${scheduleBlocks.length} Schedule Blocks`)
    console.log(`   • ${changeovers.length} Changeovers`)
    console.log(`   • ${competencies.length} Competencies`)
    console.log(`   • ${assignments.length} Shift Assignments`)
    console.log(`   • ${holidays.length} Holidays`)

  } catch (error) {
    console.error('❌ Export failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  exportData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
