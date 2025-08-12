require('dotenv').config()
import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import cors from '@fastify/cors'
import { z } from 'zod'
import { prisma } from './prisma'
import { authenticate, requireRole, optionalAuth, AuthenticatedRequest } from './auth'

const app = Fastify({ logger: false })

const allowedOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173']
console.log('🔒 CORS allowed origins:', allowedOrigin)
app.register(cors, { 
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
})

app.get('/health', async () => ({ ok: true, ts: Date.now() }))

// Authentication endpoints
app.get('/auth/user', { preHandler: [authenticate] }, async (req: AuthenticatedRequest) => {
  const user = req.user!
  
  // Get user roles from token
  const roles = user['https://aips.app/roles'] || ['operator']
  
  return {
    id: user.sub,
    email: user.email,
    name: user.name || user.email,
    picture: user.picture,
    roles,
    permissions: {
      canManageOperators: roles.includes('admin') || roles.includes('manager'),
      canViewReports: true,
      canManageSkills: roles.includes('admin') || roles.includes('manager'),
      canManageSchedules: roles.includes('admin') || roles.includes('manager') || roles.includes('planner'),
    }
  }
})

// Public health check (no auth required)
app.get('/auth/status', async () => {
  return { 
    authEnabled: true,
    domain: process.env.AUTH0_DOMAIN || 'not-configured',
    audience: process.env.AUTH0_AUDIENCE || 'not-configured',
    clientId: process.env.AUTH0_CLIENT_ID || 'not-configured'
  }
})

const NewWorkcenter = z.object({
  plantId: z.number(),
  departmentId: z.number(),
  workcenterNo: z.string(),
  name: z.string(),
  displayTitle: z.string().optional().nullable(),
  defaultSchemeId: z.number().optional().nullable(),
  minStaff: z.number().int().nonnegative().default(0).optional(),
  gatingRules: z.string().optional().nullable(),
  changeoverFamily: z.string().optional().nullable()
})

const UpdateWorkcenter = z.object({
  name: z.string().optional(),
  displayTitle: z.string().optional().nullable(),
  defaultSchemeId: z.number().optional().nullable(),
  minStaff: z.number().int().nonnegative().optional(),
  gatingRules: z.string().optional().nullable(),
  changeoverFamily: z.string().optional().nullable()
})

// Changeover Type DTOs
const ChangeoverType = z.object({
  code: z.string(),
  minutes: z.number().int().nonnegative(),
  includeInOee: z.boolean(),
  notes: z.string().optional()
})

const EventType = z.object({
  code: z.string(),
  label: z.string(),
  planned: z.boolean(),
  includeInOee: z.boolean()
})

// Holiday DTOs
const NewHoliday = z.object({
  plantId: z.number().int().positive(),
  date: z.string().datetime(),
  label: z.string().min(1).max(100).optional().nullable()
})

const UpdateHoliday = z.object({
  date: z.string().datetime().optional(),
  label: z.string().min(1).max(100).optional().nullable()
})

// Orders DTOs
const NewOrder = z.object({
  orderNo: z.string(),
  skuCode: z.string(),
  qty: z.number().int().positive(),
  runRateUph: z.number().int().positive(),
  performanceLeverPct: z.number().min(50).max(120).default(100).optional(),
  priority: z.number().int().min(1).max(5).default(3).optional(),
  dueAt: z.string().datetime(),
  shopfloorTitle: z.string().optional().nullable(),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().nullable(),
  workcenterId: z.number().int().optional().nullable()
})

const UpdateOrder = z.object({
  performanceLeverPct: z.number().min(50).max(120).optional(),
  colorHex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().nullable(),
  shopfloorTitle: z.string().optional().nullable(),
  priority: z.number().int().min(1).max(5).optional()
})

app.get('/workcenters', async (_req: FastifyRequest, _reply: FastifyReply) => {
  return prisma.workcenter.findMany({ orderBy: { id: 'asc' } })
})

app.get('/workcenters/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const row = await prisma.workcenter.findUnique({ where: { id: idParam } })
  if(!row){
    reply.code(404).send({ message: 'Not found' })
    return
  }
  reply.send(row)
})

app.post('/workcenters', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = NewWorkcenter.parse(req.body)
  const row = await prisma.workcenter.create({ data: body })
  reply.code(201).send(row)
})

app.patch('/workcenters/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const data = UpdateWorkcenter.parse(req.body)
  const row = await prisma.workcenter.update({ where: { id: idParam }, data })
  reply.send(row)
})

// Holidays
app.get('/holidays', async (req: FastifyRequest, _reply: FastifyReply) => {
  const plantId = z.coerce.number().optional().parse((req.query as any)?.plantId)
  const where = plantId ? { plantId } : {}
  return prisma.holiday.findMany({ 
    where,
    orderBy: { date: 'asc' },
    include: { plant: { select: { name: true } } }
  })
})

app.post('/holidays', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = NewHoliday.parse(req.body)
  
  // Check max 20 holidays per plant per year
  const year = new Date(body.date).getFullYear()
  const startOfYear = new Date(`${year}-01-01T00:00:00Z`)
  const endOfYear = new Date(`${year + 1}-01-01T00:00:00Z`)
  
  const existingCount = await prisma.holiday.count({
    where: {
      plantId: body.plantId,
      date: {
        gte: startOfYear,
        lt: endOfYear
      }
    }
  })
  
  if (existingCount >= 20) {
    reply.code(400).send({ message: 'Maximum 20 holidays allowed per plant per year' })
    return
  }
  
  const row = await prisma.holiday.create({ data: body })
  reply.code(201).send(row)
})

app.patch('/holidays/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const data = UpdateHoliday.parse(req.body)
  const row = await prisma.holiday.update({ where: { id: idParam }, data })
  reply.send(row)
})

app.delete('/holidays/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  await prisma.holiday.delete({ where: { id: idParam } })
  reply.code(204).send()
})

// Changeover Types endpoints
app.get('/changeover-types', async (_req: FastifyRequest, _reply: FastifyReply) => {
  // Load changeover types from the seed file
  const fs = require('fs')
  const path = require('path')
  const changeoverTypesPath = path.join(__dirname, '../../seeds/changeover_types.json')
  const changeoverTypes = JSON.parse(fs.readFileSync(changeoverTypesPath, 'utf-8'))
  
  // Transform to array format
  const types = Object.entries(changeoverTypes).map(([code, data]: [string, any]) => ({
    code,
    minutes: data.minutes,
    includeInOee: data.includeInOee,
    notes: data.notes
  }))
  
  return { types }
})

app.get('/event-types', async (_req: FastifyRequest, _reply: FastifyReply) => {
  // Static event types as defined in the requirements
  const eventTypes = [
    { code: 'PM', label: 'Planned Maintenance', planned: true, includeInOee: false },
    { code: 'TRIAL', label: 'Trial', planned: true, includeInOee: false },
    { code: 'TRAIN', label: 'Training', planned: true, includeInOee: false },
    { code: 'BREAKDOWN', label: 'Unplanned Breakdown', planned: false, includeInOee: false },
    { code: 'MATERIAL', label: 'Material Shortage', planned: false, includeInOee: false }
  ]
  
  return { eventTypes }
})

// Closeout DTOs
const CloseoutData = z.object({
  workcenterId: z.number().int(),
  actualUnits: z.number().int().nonnegative(),
  laborUnavailableMinutes: z.number().int().nonnegative().default(0),
  top3Shortfalls: z.array(z.string()).max(3).default([])
})

const SaveCloseoutPayload = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shiftType: z.string().optional().default('Day'),
  lines: z.array(CloseoutData)
})

// Closeout endpoints
app.get('/closeout', async (req: FastifyRequest, _reply: FastifyReply) => {
  const dateParam = (req.query as any)?.date || new Date().toISOString().split('T')[0]
  const shiftType = (req.query as any)?.shiftType || 'Day'
  
  // Get workcenters with their planned production for the date
  const workcenters = await prisma.workcenter.findMany({
    include: {
      scheduleBlocks: {
        where: {
          startAt: {
            gte: new Date(dateParam + 'T00:00:00Z'),
            lt: new Date(new Date(dateParam + 'T00:00:00Z').getTime() + 24 * 60 * 60 * 1000)
          }
        },
        include: {
          order: {
            include: {
              sku: true
            }
          }
        }
      }
    },
    orderBy: { id: 'asc' }
  })
  
  const lines = workcenters.map(wc => {
    // Calculate planned units for the day
    const plannedUnits = wc.scheduleBlocks.reduce((sum, block) => {
      if (block.order) {
        const durationHours = (block.endAt.getTime() - block.startAt.getTime()) / (1000 * 60 * 60)
        const adjustedRate = block.order.runRateUph * (block.order.performanceLeverPct / 100)
        return sum + Math.round(durationHours * adjustedRate)
      }
      return sum
    }, 0)
    
    // Mock actual units (in production, this would come from MES/historian)
    const performancePct = Math.random() * 15 + 85 // 85-100% performance
    const actualUnits = Math.round(plannedUnits * (performancePct / 100))
    
    const aheadBehindHours = plannedUnits > 0 ? 
      ((actualUnits - plannedUnits) / (plannedUnits / 8)) : 0 // Assume 8-hour shift
    
    return {
      workcenterId: wc.id,
      lineName: wc.displayTitle || wc.name,
      plannedUnits,
      actualUnits,
      laborUnavailableMinutes: 0,
      aheadBehindHours: Math.round(aheadBehindHours * 10) / 10,
      top3Shortfalls: []
    }
  }).filter(line => line.plannedUnits > 0) // Only include lines with production
  
  return {
    date: dateParam,
    shiftType,
    lines
  }
})

app.post('/closeout', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = SaveCloseoutPayload.parse(req.body)
  
  // In a real implementation, this would:
  // 1. Save actual production data to a closeout/actual table
  // 2. Calculate schedule variance
  // 3. Trigger re-planning algorithm to adjust downstream schedules
  // 4. Update order priorities based on shortfalls
  
  // For now, we'll simulate the save and return success
  console.log(`Closeout saved for ${body.date} ${body.shiftType} shift:`, body.lines)
  
  // Simulate re-planning logic
  const adjustedLines = body.lines.map(line => {
    const variance = line.actualUnits - (line.laborUnavailableMinutes > 0 ? 
      line.actualUnits * (1 - line.laborUnavailableMinutes / 480) : line.actualUnits) // 480 min = 8 hour shift
    
    return {
      ...line,
      replanAction: variance < 0 ? 'Pull forward next shift' : variance > 0 ? 'Defer low priority orders' : 'No change'
    }
  })
  
  return {
    success: true,
    message: 'Closeout saved successfully. Schedule adjustments calculated.',
    adjustedLines,
    nextActions: [
      'Updated downstream order priorities',
      'Recalculated resource requirements',
      'Notified planning team of variances'
    ]
  }
})

// ========================================
// RESOURCES MANAGEMENT API ENDPOINTS
// ========================================

// DTOs for Resources
const NewOperator = z.object({
  employeeId: z.string().min(1).max(20),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  hireDate: z.string().datetime(),
  departmentId: z.number().int().positive().optional().nullable(),
  basePayRate: z.number().positive().optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable()
})

const UpdateOperator = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  departmentId: z.number().int().positive().optional().nullable(),
  basePayRate: z.number().positive().optional().nullable(),
  emergencyContact: z.string().max(200).optional().nullable(),
  isActive: z.boolean().optional()
})

const NewSkill = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  category: z.enum(['Technical', 'Safety', 'Leadership', 'Quality']),
  isCore: z.boolean().default(false),
  isCertification: z.boolean().default(false),
  expiryMonths: z.number().int().positive().optional().nullable()
})

const NewCompetency = z.object({
  operatorId: z.number().int().positive(),
  skillId: z.number().int().positive(),
  level: z.number().int().min(1).max(5),
  certifiedAt: z.string().datetime().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  certifiedBy: z.string().max(100).optional().nullable(),
  notes: z.string().max(500).optional().nullable()
})

const NewShiftAssignment = z.object({
  operatorId: z.number().int().positive(),
  workcenterId: z.number().int().positive(),
  shiftPatternId: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional().nullable(),
  role: z.string().max(50).default('Operator'),
  payRate: z.number().positive().optional().nullable(),
  notes: z.string().max(500).optional().nullable()
})

// OPERATORS ENDPOINTS
app.get('/operators', { preHandler: [authenticate] }, async (req: AuthenticatedRequest, _reply: FastifyReply) => {
  const departmentId = z.coerce.number().optional().parse((req.query as any)?.departmentId)
  const isActive = z.coerce.boolean().optional().parse((req.query as any)?.isActive)
  
  const where: any = {}
  if (departmentId) where.departmentId = departmentId
  if (isActive !== undefined) where.isActive = isActive
  
  return prisma.operator.findMany({
    where,
    include: {
      department: { select: { name: true } },
      competencies: {
        include: {
          skill: { select: { name: true, category: true, isCertification: true } }
        },
        where: { isActive: true }
      },
      shiftAssignments: {
        where: { isActive: true },
        include: {
          workcenter: { select: { name: true } },
          shiftPattern: { select: { name: true, startTime: true, endTime: true } }
        }
      }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  })
})

app.get('/operators/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  return prisma.operator.findUniqueOrThrow({
    where: { id: idParam },
    include: {
      department: true,
      competencies: {
        include: { skill: true },
        orderBy: { skill: { category: 'asc' } }
      },
      shiftAssignments: {
        include: {
          workcenter: true,
          shiftPattern: true
        },
        orderBy: { startDate: 'desc' }
      }
    }
  })
})

app.post('/operators', { preHandler: [authenticate, requireRole(['admin', 'manager'])] }, async (req: AuthenticatedRequest, reply: FastifyReply) => {
  const body = NewOperator.parse(req.body)
  const operator = await prisma.operator.create({
    data: {
      ...body,
      hireDate: new Date(body.hireDate)
    }
  })
  reply.code(201).send(operator)
})

app.patch('/operators/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const data = UpdateOperator.parse(req.body)
  const operator = await prisma.operator.update({
    where: { id: idParam },
    data
  })
  reply.send(operator)
})

// SKILLS ENDPOINTS
app.get('/skills', async (req: FastifyRequest, _reply: FastifyReply) => {
  const category = z.string().optional().parse((req.query as any)?.category)
  const isCore = z.coerce.boolean().optional().parse((req.query as any)?.isCore)
  
  const where: any = {}
  if (category) where.category = category
  if (isCore !== undefined) where.isCore = isCore
  
  return prisma.skill.findMany({
    where,
    include: {
      competencies: {
        include: {
          operator: { select: { firstName: true, lastName: true, employeeId: true } }
        }
      }
    },
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })
})

app.post('/skills', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = NewSkill.parse(req.body)
  const skill = await prisma.skill.create({ data: body })
  reply.code(201).send(skill)
})

// COMPETENCIES ENDPOINTS
app.get('/competencies', async (req: FastifyRequest, _reply: FastifyReply) => {
  const operatorId = z.coerce.number().optional().parse((req.query as any)?.operatorId)
  const skillId = z.coerce.number().optional().parse((req.query as any)?.skillId)
  const expiringDays = z.coerce.number().optional().parse((req.query as any)?.expiringDays)
  
  const where: any = { isActive: true }
  if (operatorId) where.operatorId = operatorId
  if (skillId) where.skillId = skillId
  
  // Filter for expiring certifications
  if (expiringDays) {
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiringDays)
    where.expiresAt = { lte: expiryDate, not: null }
  }
  
  return prisma.operatorCompetency.findMany({
    where,
    include: {
      operator: { select: { firstName: true, lastName: true, employeeId: true } },
      skill: true
    },
    orderBy: [{ expiresAt: 'asc' }, { operator: { lastName: 'asc' } }]
  })
})

app.post('/competencies', { preHandler: [authenticate, requireRole(['admin', 'manager'])] }, async (req: AuthenticatedRequest, reply: FastifyReply) => {
  const body = NewCompetency.parse(req.body)
  const competency = await prisma.operatorCompetency.create({
    data: {
      ...body,
      certifiedAt: body.certifiedAt ? new Date(body.certifiedAt) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
    }
  })
  reply.code(201).send(competency)
})

app.patch('/competencies/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const body = z.object({
    level: z.number().int().min(1).max(5).optional(),
    certifiedAt: z.string().datetime().optional().nullable(),
    expiresAt: z.string().datetime().optional().nullable(),
    certifiedBy: z.string().max(100).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    isActive: z.boolean().optional()
  }).parse(req.body)
  
  const updateData: any = { ...body }
  if (body.certifiedAt) updateData.certifiedAt = new Date(body.certifiedAt)
  if (body.expiresAt) updateData.expiresAt = new Date(body.expiresAt)
  
  const competency = await prisma.operatorCompetency.update({
    where: { id: idParam },
    data: updateData
  })
  reply.send(competency)
})

// SHIFT PATTERNS ENDPOINTS
app.get('/shift-patterns', async (req: FastifyRequest, _reply: FastifyReply) => {
  const isActive = z.coerce.boolean().optional().parse((req.query as any)?.isActive)
  const where = isActive !== undefined ? { isActive } : {}
  
  return prisma.shiftPattern.findMany({
    where,
    include: {
      shiftAssignments: {
        where: { isActive: true },
        include: {
          operator: { select: { firstName: true, lastName: true, employeeId: true } },
          workcenter: { select: { name: true } }
        }
      }
    },
    orderBy: { name: 'asc' }
  })
})

// SHIFT ASSIGNMENTS ENDPOINTS
app.get('/shift-assignments', async (req: FastifyRequest, _reply: FastifyReply) => {
  const operatorId = z.coerce.number().optional().parse((req.query as any)?.operatorId)
  const workcenterId = z.coerce.number().optional().parse((req.query as any)?.workcenterId)
  const isActive = z.coerce.boolean().optional().parse((req.query as any)?.isActive)
  
  const where: any = {}
  if (operatorId) where.operatorId = operatorId
  if (workcenterId) where.workcenterId = workcenterId
  if (isActive !== undefined) where.isActive = isActive
  
  return prisma.shiftAssignment.findMany({
    where,
    include: {
      operator: { select: { firstName: true, lastName: true, employeeId: true } },
      workcenter: { select: { name: true, displayTitle: true } },
      shiftPattern: true
    },
    orderBy: [{ startDate: 'desc' }, { operator: { lastName: 'asc' } }]
  })
})

app.post('/shift-assignments', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = NewShiftAssignment.parse(req.body)
  
  // Check for overlapping assignments
  const overlapping = await prisma.shiftAssignment.findFirst({
    where: {
      operatorId: body.operatorId,
      workcenterId: body.workcenterId,
      isActive: true,
      OR: [
        {
          startDate: { lte: new Date(body.startDate) },
          endDate: { gte: new Date(body.startDate) }
        },
        {
          startDate: { lte: body.endDate ? new Date(body.endDate) : new Date('2099-12-31') },
          endDate: { gte: body.endDate ? new Date(body.endDate) : new Date('2099-12-31') }
        }
      ]
    }
  })
  
  if (overlapping) {
    reply.code(400).send({ message: 'Operator already has an overlapping shift assignment' })
    return
  }
  
  const assignment = await prisma.shiftAssignment.create({
    data: {
      ...body,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null
    }
  })
  reply.code(201).send(assignment)
})

// COMPETENCY MATRIX ENDPOINT
app.get('/competency-matrix', async (req: FastifyRequest, _reply: FastifyReply) => {
  const workcenterId = z.coerce.number().optional().parse((req.query as any)?.workcenterId)
  
  // Get all operators with their competencies
  const operators = await prisma.operator.findMany({
    where: { isActive: true },
    include: {
      department: { select: { name: true } },
      competencies: {
        where: { isActive: true },
        include: { skill: true }
      },
      shiftAssignments: {
        where: {
          isActive: true,
          ...(workcenterId ? { workcenterId } : {})
        },
        include: {
          workcenter: { select: { name: true } },
          shiftPattern: { select: { name: true } }
        }
      }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  })
  
  // Get all skills
  const skills = await prisma.skill.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }]
  })
  
  // Get skill requirements for workcenter if specified
  const skillRequirements = workcenterId ? await prisma.skillRequirement.findMany({
    where: { workcenterId },
    include: { skill: true }
  }) : []
  
  return {
    operators,
    skills,
    skillRequirements
  }
})

// Orders
app.get('/orders', async (_req: FastifyRequest, _reply: FastifyReply) => {
  const rows = await prisma.order.findMany({
    include: { sku: { select: { code: true, family: true, familyColorHex: true } } },
    orderBy: { id: 'asc' }
  })
  return rows
})

app.post('/orders', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = NewOrder.parse(req.body)
  const sku = await prisma.sKU.findFirst({ where: { code: body.skuCode } })
  if(!sku){
    reply.code(400).send({ message: 'Unknown SKU code' })
    return
  }
  const row = await prisma.order.create({ data: {
    orderNo: body.orderNo,
    skuId: sku.id,
    qty: body.qty,
    runRateUph: body.runRateUph,
    performanceLeverPct: body.performanceLeverPct ?? 100,
    priority: body.priority ?? 3,
    dueAt: new Date(body.dueAt),
    shopfloorTitle: body.shopfloorTitle ?? null,
    colorHex: body.colorHex ?? null,
    workcenterId: body.workcenterId ?? null
  }})
  reply.code(201).send(row)
})

app.patch('/orders/:id', async (req: FastifyRequest, reply: FastifyReply) => {
  const idParam = z.coerce.number().parse((req.params as any).id)
  const data = UpdateOrder.parse(req.body)
  const row = await prisma.order.update({ where: { id: idParam }, data })
  reply.send(row)
})

// Schedule Board - Enhanced for new dashboard layout
app.get('/schedule/board', async (req: FastifyRequest, _reply: FastifyReply) => {
  const viewMode = (req.query as any)?.viewMode || 'week'
  const dateParam = (req.query as any)?.date || new Date().toISOString().split('T')[0]
  
  const wcs = await prisma.workcenter.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, displayTitle: true }
  })
  
  const lines: Array<any> = []
  for(const wc of wcs){
    const blocks = await prisma.scheduleBlock.findMany({
      where: { workcenterId: wc.id },
      orderBy: { startAt: 'asc' },
      include: { order: { include: { sku: true } } }
    })
    
    const blockIds = blocks.map((b: any)=> b.id)
    const changeovers = await prisma.changeover.findMany({
      where: { workcenterId: wc.id, fromBlockId: { in: blockIds } },
      orderBy: { id: 'asc' }
    })

    // Convert database blocks to frontend OrderBlock format
    const orderBlocks = blocks.flatMap((b: any) => {
      if (!b.order) return []
      
      const startDate = new Date(b.startAt)
      const endDate = new Date(b.endAt)
      const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
      const startMin = startDate.getHours() * 60 + startDate.getMinutes()
      
      const baseBlock = {
        id: `${b.id}`,
        lineId: wc.name,
        sku: b.order.sku.code,
        title: b.order.shopfloorTitle || b.order.sku.code,
        family: b.order.sku.family as 'A' | 'B' | 'C',
        qty: b.order.qty,
        runRateUph: b.order.runRateUph,
        leverPct: b.order.performanceLeverPct,
        startMin,
        durationMin,
        colorHex: b.order.colorHex || b.order.sku.familyColorHex
      }
      
      // Generate plan, performance, and actual blocks
      const plannedUnits = Math.round(b.order.qty)
      const performancePct = Math.random() * 10 + 88 // 88-98% range
      const actualUnits = Math.round(plannedUnits * (performancePct / 100))
      
      return [
        { ...baseBlock, id: `P-${b.id}`, blockType: 'plan', plannedUnits, performancePct },
        { ...baseBlock, id: `PF-${b.id}`, blockType: 'performance', plannedUnits, actualUnits, performancePct },
        { ...baseBlock, id: `A-${b.id}`, blockType: 'actual', actualUnits }
      ]
    })

    // Calculate week summary
    const totalPlanned = orderBlocks.filter(b => b.blockType === 'plan').reduce((sum, b) => sum + (('plannedUnits' in b) ? b.plannedUnits || 0 : 0), 0)
    const totalActual = orderBlocks.filter(b => b.blockType === 'actual').reduce((sum, b) => sum + (('actualUnits' in b) ? b.actualUnits || 0 : 0), 0)
    const oee = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0
    
    lines.push({
      lineId: wc.name,
      lineName: wc.displayTitle || wc.name,
      blocks: orderBlocks,
      changeovers: changeovers.map(co => ({
        id: co.id,
        lineId: wc.name,
        fromBlockId: co.fromBlockId.toString(),
        toBlockId: co.toBlockId.toString(),
        typeCode: co.typeCode,
        minutes: co.plannedMinutes,
        includeInOee: co.includeInOee
      })),
      weekSummary: viewMode !== 'day' ? {
        weekOf: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        plannedUnits: totalPlanned,
        actualUnits: totalActual,
        oee,
        performancePct: Math.round(Math.random() * 10 + 90)
      } : undefined,
      valueStream: viewMode !== 'day' ? `${Math.round(totalActual/1000)}k/${oee}%` : undefined
    })
  }

  // Generate day headers based on view mode
  const headers: Array<any> = []
  const today = new Date()
  const daysInView = viewMode === 'day' ? 24 : viewMode === 'week' ? 7 : 31
  
  for (let i = 0; i < daysInView; i++) {
    if (viewMode === 'day') {
      headers.push({
        date: today.toISOString().split('T')[0],
        dayName: `${i.toString().padStart(2, '0')}:00`,
        plannedUnits: Math.floor(Math.random() * 200) + 100,
        actualUnits: Math.floor(Math.random() * 220) + 90,
        oee: Math.floor(Math.random() * 20) + 75
      })
    } else {
      const date = new Date(today)
      date.setDate(today.getDate() - today.getDay() + i)
      headers.push({
        date: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        plannedUnits: Math.floor(Math.random() * 2000) + 1000,
        actualUnits: Math.floor(Math.random() * 2200) + 900,
        oee: Math.floor(Math.random() * 20) + 75
      })
    }
  }

  return {
    dateISO: dateParam,
    viewMode,
    weekStart: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    monthStart: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    headers,
    lines
  }
})

const SaveBoardPayload = z.object({
  lanes: z.array(z.object({
    workcenterId: z.number().int(),
    blocks: z.array(z.object({ id: z.number().int().optional(), orderId: z.number().int().nullable(), startAt: z.coerce.date(), endAt: z.coerce.date() })),
    changeovers: z.array(z.object({ id: z.number().int().optional(), fromBlockId: z.number().int(), toBlockId: z.number().int(), typeCode: z.string(), plannedMinutes: z.number().int().nonnegative() }))
  }))
})

app.post('/schedule/board', async (req: FastifyRequest, reply: FastifyReply) => {
  const body = SaveBoardPayload.parse(req.body)
  await prisma.$transaction(async (tx: any) => {
    const wcIds = body.lanes.map(l=> l.workcenterId)
    // delete in order: changeovers then blocks
    await tx.changeover.deleteMany({ where: { workcenterId: { in: wcIds } } })
    await tx.scheduleBlock.deleteMany({ where: { workcenterId: { in: wcIds } } })

    for(const lane of body.lanes){
      const createdBlocks: Record<number, number> = {}
      for(const b of lane.blocks){
        const row = await tx.scheduleBlock.create({ data: {
          workcenterId: lane.workcenterId,
          orderId: b.orderId ?? null,
          startAt: b.startAt,
          endAt: b.endAt
        }})
        if(b.id){ createdBlocks[b.id] = row.id }
      }
      for(const c of lane.changeovers){
        const fromId = createdBlocks[c.fromBlockId] ?? c.fromBlockId
        const toId = createdBlocks[c.toBlockId] ?? c.toBlockId
        await tx.changeover.create({ data: {
          workcenterId: lane.workcenterId,
          fromBlockId: fromId,
          toBlockId: toId,
          typeCode: c.typeCode,
          plannedMinutes: c.plannedMinutes,
          includeInOee: true,
          complexityTier: null
        }})
      }
    }
  })
  reply.send({ ok: true })
})

app.get('/reports/daily', async (req: FastifyRequest, _reply: FastifyReply) => {
  const dateParam = (req.query as any)?.date || new Date().toISOString().split('T')[0]
  const viewMode = (req.query as any)?.viewMode || 'day'
  
  // Calculate date range based on view mode
  const startDate = new Date(dateParam + 'T00:00:00Z')
  let endDate: Date
  
  switch (viewMode) {
    case 'week':
      // Get the week (7 days from start date)
      endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      // Get the month
      endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1)
      break
    default: // 'day'
      endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)
  }
  
  // Get all workcenters with their schedule blocks for the date range
  const wcs = await prisma.workcenter.findMany({
    orderBy: { id: 'asc' },
    include: {
      scheduleBlocks: {
        where: {
          startAt: {
            gte: startDate,
            lt: endDate
          }
        },
        include: {
          order: {
            include: { sku: true }
          }
        }
      },
      changeovers: {
        where: {
          // Get changeovers for blocks in this date range
          fromBlock: {
            startAt: {
              gte: startDate,
              lt: endDate
            }
          }
        }
      }
    }
  })

  let totalPlannedUnits = 0
  let totalProducedUnits = 0
  let totalChangeoverHours = 0
  const lines: any[] = []

  for (const wc of wcs) {
    // Calculate planned units from orders
    const plannedUnits = wc.scheduleBlocks.reduce((sum, block) => {
      return sum + (block.order?.qty || 0)
    }, 0)

    // Simulate actual production (88-98% of planned)
    const performancePct = Math.random() * 10 + 88
    const producedUnits = Math.round(plannedUnits * (performancePct / 100))
    
    // Calculate changeover time in hours
    const changeoverMinutes = wc.changeovers.reduce((sum, co) => sum + co.plannedMinutes, 0)
    const changeoverHours = changeoverMinutes / 60

    // Calculate OEE (simplified: actual/planned * 100)
    const oee = plannedUnits > 0 ? Math.round((producedUnits / plannedUnits) * 100) : 0

    // Calculate ahead/behind in hours (simplified calculation)
    const scheduleVariance = (producedUnits - plannedUnits) / Math.max(1, plannedUnits) * 8 // 8 hour shift
    
    totalPlannedUnits += plannedUnits
    totalProducedUnits += producedUnits
    totalChangeoverHours += changeoverHours

    if (plannedUnits > 0) { // Only include lines with scheduled production
      lines.push({
        line: wc.displayTitle || wc.name,
        plannedUnits,
        producedUnits,
        oee,
        changeoverHours: Math.round(changeoverHours * 10) / 10,
        aheadBehindH: Math.round(scheduleVariance * 10) / 10,
        top3: ['Changeover', 'Material', 'Quality'] // Simplified for now
      })
    }
  }

  // Calculate overall metrics
  const pctToPlan = totalPlannedUnits > 0 ? Math.round((totalProducedUnits / totalPlannedUnits) * 1000) / 10 : 0
  const overallOee = totalPlannedUnits > 0 ? Math.round((totalProducedUnits / totalPlannedUnits) * 100) : 0
  
  // Project weekly total (current daily * 7)
  const weekProjection = totalProducedUnits * 7

  // Determine RAG status
  let rag = 'On-Track'
  if (pctToPlan < 95) rag = 'At-Risk'
  if (pctToPlan < 90) rag = 'Off-Track'

  return {
    overall: {
      plannedUnits: totalPlannedUnits,
      producedUnits: totalProducedUnits,
      pctToPlan,
      oee: overallOee,
      projection: weekProjection,
      rag,
      changeoverHours: Math.round(totalChangeoverHours * 10) / 10
    },
    lines,
    date: dateParam,
    viewMode
  }
})

app.setErrorHandler((error: unknown, req, reply) => {
  if (error instanceof z.ZodError) {
    reply.code(400).send({ message: 'Validation failed', issues: error.issues })
    return
  }
  req.log?.error(error as any)
  reply.code(500).send({ message: 'Internal Server Error' })
})

const PORT = parseInt(process.env.PORT || '3000', 10)
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'

app.listen({ port: PORT, host: HOST }, (err, addr) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('🚀 AIPS API on', addr)
})
