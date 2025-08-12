import { prisma } from './prisma'

export async function createDatabaseSchema() {
  console.log('🏗️  Creating complete database schema...')
  
  try {
    // First, drop all tables to ensure clean schema (in reverse order for foreign keys)
    console.log('🧹 Dropping existing tables for clean schema...')
    
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ShiftAssignment" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "SkillRequirement" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "OperatorCompetency" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Changeover" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ScheduleBlock" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Order" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Product" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "SKU" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Operator" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Skill" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "ShiftPattern" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Holiday" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Workcenter" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Department" CASCADE;`
    await prisma.$executeRaw`DROP TABLE IF EXISTS "Plant" CASCADE;`
    
    console.log('✅ Existing tables dropped, creating fresh schema...')
    
    // Create all tables in correct order (respecting foreign keys)
    await prisma.$executeRaw`
      CREATE TABLE "Plant" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "tenantId" TEXT DEFAULT 'default'
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Department" (
        id SERIAL PRIMARY KEY,
        "plantId" INTEGER NOT NULL REFERENCES "Plant"(id),
        name TEXT NOT NULL,
        "tenantId" TEXT DEFAULT 'default'
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Workcenter" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "departmentId" INTEGER NOT NULL REFERENCES "Department"(id),
        "tenantId" TEXT DEFAULT 'default',
        "plantId" INTEGER NOT NULL REFERENCES "Plant"(id),
        "workcenterNo" TEXT NOT NULL,
        "displayTitle" TEXT,
        "defaultSchemeId" INTEGER,
        "minStaff" INTEGER NOT NULL DEFAULT 1,
        "gatingRules" TEXT,
        "changeoverFamily" TEXT
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Holiday" (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        label TEXT NOT NULL,
        "plantId" INTEGER NOT NULL REFERENCES "Plant"(id)
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "SKU" (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        family TEXT NOT NULL,
        "familyColorHex" TEXT,
        formula TEXT,
        "bottleSize" TEXT,
        "caseSize" TEXT
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Product" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        "skuId" INTEGER NOT NULL REFERENCES "SKU"(id)
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Order" (
        id SERIAL PRIMARY KEY,
        "orderNo" TEXT NOT NULL UNIQUE,
        "skuId" INTEGER NOT NULL REFERENCES "SKU"(id),
        qty INTEGER NOT NULL,
        "runRateUph" INTEGER NOT NULL,
        "performanceLeverPct" DOUBLE PRECISION DEFAULT 100,
        priority INTEGER DEFAULT 3,
        "dueAt" TIMESTAMP NOT NULL,
        "workcenterId" INTEGER REFERENCES "Workcenter"(id),
        "shopfloorTitle" TEXT,
        "colorHex" TEXT
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "ScheduleBlock" (
        id SERIAL PRIMARY KEY,
        "workcenterId" INTEGER NOT NULL REFERENCES "Workcenter"(id),
        "orderId" INTEGER REFERENCES "Order"(id),
        "startAt" TIMESTAMP NOT NULL,
        "endAt" TIMESTAMP NOT NULL
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Changeover" (
        id SERIAL PRIMARY KEY,
        "workcenterId" INTEGER NOT NULL REFERENCES "Workcenter"(id),
        "fromBlockId" INTEGER NOT NULL REFERENCES "ScheduleBlock"(id),
        "toBlockId" INTEGER NOT NULL REFERENCES "ScheduleBlock"(id),
        "typeCode" TEXT NOT NULL,
        "plannedMinutes" INTEGER NOT NULL,
        "includeInOee" BOOLEAN DEFAULT true,
        "complexityTier" TEXT
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Skill" (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        "isCore" BOOLEAN DEFAULT false,
        "isCertification" BOOLEAN DEFAULT false,
        "expiryMonths" INTEGER,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "Operator" (
        id SERIAL PRIMARY KEY,
        "employeeId" TEXT NOT NULL UNIQUE,
        "firstName" TEXT NOT NULL,
        "lastName" TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        "hireDate" TIMESTAMP NOT NULL,
        "departmentId" INTEGER REFERENCES "Department"(id),
        "isActive" BOOLEAN DEFAULT true,
        "basePayRate" DOUBLE PRECISION,
        "emergencyContact" TEXT,
        "tenantId" TEXT DEFAULT 'default',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "OperatorCompetency" (
        id SERIAL PRIMARY KEY,
        "operatorId" INTEGER NOT NULL REFERENCES "Operator"(id),
        "skillId" INTEGER NOT NULL REFERENCES "Skill"(id),
        level INTEGER NOT NULL DEFAULT 1,
        "certifiedAt" TIMESTAMP,
        "expiresAt" TIMESTAMP,
        "certifiedBy" TEXT,
        notes TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "SkillRequirement" (
        id SERIAL PRIMARY KEY,
        "workcenterId" INTEGER NOT NULL REFERENCES "Workcenter"(id),
        "skillId" INTEGER NOT NULL REFERENCES "Skill"(id),
        "minLevel" INTEGER NOT NULL DEFAULT 1,
        "isRequired" BOOLEAN DEFAULT true,
        "shiftType" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "ShiftPattern" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "hoursPerShift" DOUBLE PRECISION NOT NULL,
        "daysPattern" TEXT NOT NULL
      );
    `
    
    await prisma.$executeRaw`
      CREATE TABLE "ShiftAssignment" (
        id SERIAL PRIMARY KEY,
        "operatorId" INTEGER NOT NULL REFERENCES "Operator"(id),
        "workcenterId" INTEGER NOT NULL REFERENCES "Workcenter"(id),
        "shiftPatternId" INTEGER NOT NULL REFERENCES "ShiftPattern"(id),
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP,
        "isActive" BOOLEAN DEFAULT true,
        role TEXT DEFAULT 'Operator',
        "payRate" DOUBLE PRECISION,
        notes TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    
    console.log('✅ All database tables created successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Schema creation failed:', error)
    throw error
  }
}
