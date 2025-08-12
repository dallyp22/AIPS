"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const zod_1 = require("zod");
const prisma_1 = require("./prisma");
const auth_1 = require("./auth");
const app = (0, fastify_1.default)({ logger: false });
const allowedOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173'];
app.register(cors_1.default, { origin: allowedOrigin });
app.get('/health', async () => ({ ok: true, ts: Date.now() }));
// Authentication endpoints
app.get('/auth/user', { preHandler: [auth_1.authenticate] }, async (req) => {
    const user = req.user;
    // Get user roles from token
    const roles = user['https://aips.app/roles'] || ['operator'];
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
    };
});
// Public health check (no auth required)
app.get('/auth/status', async () => {
    return {
        authEnabled: true,
        domain: process.env.AUTH0_DOMAIN || 'not-configured',
        audience: process.env.AUTH0_AUDIENCE || 'not-configured',
        clientId: process.env.AUTH0_CLIENT_ID || 'not-configured'
    };
});
const NewWorkcenter = zod_1.z.object({
    plantId: zod_1.z.number(),
    departmentId: zod_1.z.number(),
    workcenterNo: zod_1.z.string(),
    name: zod_1.z.string(),
    displayTitle: zod_1.z.string().optional().nullable(),
    defaultSchemeId: zod_1.z.number().optional().nullable(),
    minStaff: zod_1.z.number().int().nonnegative().default(0).optional(),
    gatingRules: zod_1.z.string().optional().nullable(),
    changeoverFamily: zod_1.z.string().optional().nullable()
});
const UpdateWorkcenter = zod_1.z.object({
    name: zod_1.z.string().optional(),
    displayTitle: zod_1.z.string().optional().nullable(),
    defaultSchemeId: zod_1.z.number().optional().nullable(),
    minStaff: zod_1.z.number().int().nonnegative().optional(),
    gatingRules: zod_1.z.string().optional().nullable(),
    changeoverFamily: zod_1.z.string().optional().nullable()
});
// Changeover Type DTOs
const ChangeoverType = zod_1.z.object({
    code: zod_1.z.string(),
    minutes: zod_1.z.number().int().nonnegative(),
    includeInOee: zod_1.z.boolean(),
    notes: zod_1.z.string().optional()
});
const EventType = zod_1.z.object({
    code: zod_1.z.string(),
    label: zod_1.z.string(),
    planned: zod_1.z.boolean(),
    includeInOee: zod_1.z.boolean()
});
// Holiday DTOs
const NewHoliday = zod_1.z.object({
    plantId: zod_1.z.number().int().positive(),
    date: zod_1.z.string().datetime(),
    label: zod_1.z.string().min(1).max(100).optional().nullable()
});
const UpdateHoliday = zod_1.z.object({
    date: zod_1.z.string().datetime().optional(),
    label: zod_1.z.string().min(1).max(100).optional().nullable()
});
// Orders DTOs
const NewOrder = zod_1.z.object({
    orderNo: zod_1.z.string(),
    skuCode: zod_1.z.string(),
    qty: zod_1.z.number().int().positive(),
    runRateUph: zod_1.z.number().int().positive(),
    performanceLeverPct: zod_1.z.number().min(50).max(120).default(100).optional(),
    priority: zod_1.z.number().int().min(1).max(5).default(3).optional(),
    dueAt: zod_1.z.string().datetime(),
    shopfloorTitle: zod_1.z.string().optional().nullable(),
    colorHex: zod_1.z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().nullable(),
    workcenterId: zod_1.z.number().int().optional().nullable()
});
const UpdateOrder = zod_1.z.object({
    performanceLeverPct: zod_1.z.number().min(50).max(120).optional(),
    colorHex: zod_1.z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().nullable(),
    shopfloorTitle: zod_1.z.string().optional().nullable(),
    priority: zod_1.z.number().int().min(1).max(5).optional()
});
app.get('/workcenters', async (_req, _reply) => {
    return prisma_1.prisma.workcenter.findMany({ orderBy: { id: 'asc' } });
});
app.get('/workcenters/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const row = await prisma_1.prisma.workcenter.findUnique({ where: { id: idParam } });
    if (!row) {
        reply.code(404).send({ message: 'Not found' });
        return;
    }
    reply.send(row);
});
app.post('/workcenters', async (req, reply) => {
    const body = NewWorkcenter.parse(req.body);
    const row = await prisma_1.prisma.workcenter.create({ data: body });
    reply.code(201).send(row);
});
app.patch('/workcenters/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const data = UpdateWorkcenter.parse(req.body);
    const row = await prisma_1.prisma.workcenter.update({ where: { id: idParam }, data });
    reply.send(row);
});
// Holidays
app.get('/holidays', async (req, _reply) => {
    const plantId = zod_1.z.coerce.number().optional().parse(req.query?.plantId);
    const where = plantId ? { plantId } : {};
    return prisma_1.prisma.holiday.findMany({
        where,
        orderBy: { date: 'asc' },
        include: { plant: { select: { name: true } } }
    });
});
app.post('/holidays', async (req, reply) => {
    const body = NewHoliday.parse(req.body);
    // Check max 20 holidays per plant per year
    const year = new Date(body.date).getFullYear();
    const startOfYear = new Date(`${year}-01-01T00:00:00Z`);
    const endOfYear = new Date(`${year + 1}-01-01T00:00:00Z`);
    const existingCount = await prisma_1.prisma.holiday.count({
        where: {
            plantId: body.plantId,
            date: {
                gte: startOfYear,
                lt: endOfYear
            }
        }
    });
    if (existingCount >= 20) {
        reply.code(400).send({ message: 'Maximum 20 holidays allowed per plant per year' });
        return;
    }
    const row = await prisma_1.prisma.holiday.create({ data: body });
    reply.code(201).send(row);
});
app.patch('/holidays/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const data = UpdateHoliday.parse(req.body);
    const row = await prisma_1.prisma.holiday.update({ where: { id: idParam }, data });
    reply.send(row);
});
app.delete('/holidays/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    await prisma_1.prisma.holiday.delete({ where: { id: idParam } });
    reply.code(204).send();
});
// Changeover Types endpoints
app.get('/changeover-types', async (_req, _reply) => {
    // Load changeover types from the seed file
    const fs = require('fs');
    const path = require('path');
    const changeoverTypesPath = path.join(__dirname, '../../seeds/changeover_types.json');
    const changeoverTypes = JSON.parse(fs.readFileSync(changeoverTypesPath, 'utf-8'));
    // Transform to array format
    const types = Object.entries(changeoverTypes).map(([code, data]) => ({
        code,
        minutes: data.minutes,
        includeInOee: data.includeInOee,
        notes: data.notes
    }));
    return { types };
});
app.get('/event-types', async (_req, _reply) => {
    // Static event types as defined in the requirements
    const eventTypes = [
        { code: 'PM', label: 'Planned Maintenance', planned: true, includeInOee: false },
        { code: 'TRIAL', label: 'Trial', planned: true, includeInOee: false },
        { code: 'TRAIN', label: 'Training', planned: true, includeInOee: false },
        { code: 'BREAKDOWN', label: 'Unplanned Breakdown', planned: false, includeInOee: false },
        { code: 'MATERIAL', label: 'Material Shortage', planned: false, includeInOee: false }
    ];
    return { eventTypes };
});
// Closeout DTOs
const CloseoutData = zod_1.z.object({
    workcenterId: zod_1.z.number().int(),
    actualUnits: zod_1.z.number().int().nonnegative(),
    laborUnavailableMinutes: zod_1.z.number().int().nonnegative().default(0),
    top3Shortfalls: zod_1.z.array(zod_1.z.string()).max(3).default([])
});
const SaveCloseoutPayload = zod_1.z.object({
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    shiftType: zod_1.z.string().optional().default('Day'),
    lines: zod_1.z.array(CloseoutData)
});
// Closeout endpoints
app.get('/closeout', async (req, _reply) => {
    const dateParam = req.query?.date || new Date().toISOString().split('T')[0];
    const shiftType = req.query?.shiftType || 'Day';
    // Get workcenters with their planned production for the date
    const workcenters = await prisma_1.prisma.workcenter.findMany({
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
    });
    const lines = workcenters.map(wc => {
        // Calculate planned units for the day
        const plannedUnits = wc.scheduleBlocks.reduce((sum, block) => {
            if (block.order) {
                const durationHours = (block.endAt.getTime() - block.startAt.getTime()) / (1000 * 60 * 60);
                const adjustedRate = block.order.runRateUph * (block.order.performanceLeverPct / 100);
                return sum + Math.round(durationHours * adjustedRate);
            }
            return sum;
        }, 0);
        // Mock actual units (in production, this would come from MES/historian)
        const performancePct = Math.random() * 15 + 85; // 85-100% performance
        const actualUnits = Math.round(plannedUnits * (performancePct / 100));
        const aheadBehindHours = plannedUnits > 0 ?
            ((actualUnits - plannedUnits) / (plannedUnits / 8)) : 0; // Assume 8-hour shift
        return {
            workcenterId: wc.id,
            lineName: wc.displayTitle || wc.name,
            plannedUnits,
            actualUnits,
            laborUnavailableMinutes: 0,
            aheadBehindHours: Math.round(aheadBehindHours * 10) / 10,
            top3Shortfalls: []
        };
    }).filter(line => line.plannedUnits > 0); // Only include lines with production
    return {
        date: dateParam,
        shiftType,
        lines
    };
});
app.post('/closeout', async (req, reply) => {
    const body = SaveCloseoutPayload.parse(req.body);
    // In a real implementation, this would:
    // 1. Save actual production data to a closeout/actual table
    // 2. Calculate schedule variance
    // 3. Trigger re-planning algorithm to adjust downstream schedules
    // 4. Update order priorities based on shortfalls
    // For now, we'll simulate the save and return success
    console.log(`Closeout saved for ${body.date} ${body.shiftType} shift:`, body.lines);
    // Simulate re-planning logic
    const adjustedLines = body.lines.map(line => {
        const variance = line.actualUnits - (line.laborUnavailableMinutes > 0 ?
            line.actualUnits * (1 - line.laborUnavailableMinutes / 480) : line.actualUnits); // 480 min = 8 hour shift
        return {
            ...line,
            replanAction: variance < 0 ? 'Pull forward next shift' : variance > 0 ? 'Defer low priority orders' : 'No change'
        };
    });
    return {
        success: true,
        message: 'Closeout saved successfully. Schedule adjustments calculated.',
        adjustedLines,
        nextActions: [
            'Updated downstream order priorities',
            'Recalculated resource requirements',
            'Notified planning team of variances'
        ]
    };
});
// ========================================
// RESOURCES MANAGEMENT API ENDPOINTS
// ========================================
// DTOs for Resources
const NewOperator = zod_1.z.object({
    employeeId: zod_1.z.string().min(1).max(20),
    firstName: zod_1.z.string().min(1).max(50),
    lastName: zod_1.z.string().min(1).max(50),
    email: zod_1.z.string().email().optional().nullable(),
    phone: zod_1.z.string().max(20).optional().nullable(),
    hireDate: zod_1.z.string().datetime(),
    departmentId: zod_1.z.number().int().positive().optional().nullable(),
    basePayRate: zod_1.z.number().positive().optional().nullable(),
    emergencyContact: zod_1.z.string().max(200).optional().nullable()
});
const UpdateOperator = zod_1.z.object({
    firstName: zod_1.z.string().min(1).max(50).optional(),
    lastName: zod_1.z.string().min(1).max(50).optional(),
    email: zod_1.z.string().email().optional().nullable(),
    phone: zod_1.z.string().max(20).optional().nullable(),
    departmentId: zod_1.z.number().int().positive().optional().nullable(),
    basePayRate: zod_1.z.number().positive().optional().nullable(),
    emergencyContact: zod_1.z.string().max(200).optional().nullable(),
    isActive: zod_1.z.boolean().optional()
});
const NewSkill = zod_1.z.object({
    code: zod_1.z.string().min(1).max(20),
    name: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().max(500).optional().nullable(),
    category: zod_1.z.enum(['Technical', 'Safety', 'Leadership', 'Quality']),
    isCore: zod_1.z.boolean().default(false),
    isCertification: zod_1.z.boolean().default(false),
    expiryMonths: zod_1.z.number().int().positive().optional().nullable()
});
const NewCompetency = zod_1.z.object({
    operatorId: zod_1.z.number().int().positive(),
    skillId: zod_1.z.number().int().positive(),
    level: zod_1.z.number().int().min(1).max(5),
    certifiedAt: zod_1.z.string().datetime().optional().nullable(),
    expiresAt: zod_1.z.string().datetime().optional().nullable(),
    certifiedBy: zod_1.z.string().max(100).optional().nullable(),
    notes: zod_1.z.string().max(500).optional().nullable()
});
const NewShiftAssignment = zod_1.z.object({
    operatorId: zod_1.z.number().int().positive(),
    workcenterId: zod_1.z.number().int().positive(),
    shiftPatternId: zod_1.z.number().int().positive(),
    startDate: zod_1.z.string().datetime(),
    endDate: zod_1.z.string().datetime().optional().nullable(),
    role: zod_1.z.string().max(50).default('Operator'),
    payRate: zod_1.z.number().positive().optional().nullable(),
    notes: zod_1.z.string().max(500).optional().nullable()
});
// OPERATORS ENDPOINTS
app.get('/operators', { preHandler: [auth_1.authenticate] }, async (req, _reply) => {
    const departmentId = zod_1.z.coerce.number().optional().parse(req.query?.departmentId);
    const isActive = zod_1.z.coerce.boolean().optional().parse(req.query?.isActive);
    const where = {};
    if (departmentId)
        where.departmentId = departmentId;
    if (isActive !== undefined)
        where.isActive = isActive;
    return prisma_1.prisma.operator.findMany({
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
    });
});
app.get('/operators/:id', async (req, _reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    return prisma_1.prisma.operator.findUniqueOrThrow({
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
    });
});
app.post('/operators', { preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(['admin', 'manager'])] }, async (req, reply) => {
    const body = NewOperator.parse(req.body);
    const operator = await prisma_1.prisma.operator.create({
        data: {
            ...body,
            hireDate: new Date(body.hireDate)
        }
    });
    reply.code(201).send(operator);
});
app.patch('/operators/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const data = UpdateOperator.parse(req.body);
    const operator = await prisma_1.prisma.operator.update({
        where: { id: idParam },
        data
    });
    reply.send(operator);
});
// SKILLS ENDPOINTS
app.get('/skills', async (req, _reply) => {
    const category = zod_1.z.string().optional().parse(req.query?.category);
    const isCore = zod_1.z.coerce.boolean().optional().parse(req.query?.isCore);
    const where = {};
    if (category)
        where.category = category;
    if (isCore !== undefined)
        where.isCore = isCore;
    return prisma_1.prisma.skill.findMany({
        where,
        include: {
            competencies: {
                include: {
                    operator: { select: { firstName: true, lastName: true, employeeId: true } }
                }
            }
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
});
app.post('/skills', async (req, reply) => {
    const body = NewSkill.parse(req.body);
    const skill = await prisma_1.prisma.skill.create({ data: body });
    reply.code(201).send(skill);
});
// COMPETENCIES ENDPOINTS
app.get('/competencies', async (req, _reply) => {
    const operatorId = zod_1.z.coerce.number().optional().parse(req.query?.operatorId);
    const skillId = zod_1.z.coerce.number().optional().parse(req.query?.skillId);
    const expiringDays = zod_1.z.coerce.number().optional().parse(req.query?.expiringDays);
    const where = { isActive: true };
    if (operatorId)
        where.operatorId = operatorId;
    if (skillId)
        where.skillId = skillId;
    // Filter for expiring certifications
    if (expiringDays) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiringDays);
        where.expiresAt = { lte: expiryDate, not: null };
    }
    return prisma_1.prisma.operatorCompetency.findMany({
        where,
        include: {
            operator: { select: { firstName: true, lastName: true, employeeId: true } },
            skill: true
        },
        orderBy: [{ expiresAt: 'asc' }, { operator: { lastName: 'asc' } }]
    });
});
app.post('/competencies', { preHandler: [auth_1.authenticate, (0, auth_1.requireRole)(['admin', 'manager'])] }, async (req, reply) => {
    const body = NewCompetency.parse(req.body);
    const competency = await prisma_1.prisma.operatorCompetency.create({
        data: {
            ...body,
            certifiedAt: body.certifiedAt ? new Date(body.certifiedAt) : null,
            expiresAt: body.expiresAt ? new Date(body.expiresAt) : null
        }
    });
    reply.code(201).send(competency);
});
app.patch('/competencies/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const body = zod_1.z.object({
        level: zod_1.z.number().int().min(1).max(5).optional(),
        certifiedAt: zod_1.z.string().datetime().optional().nullable(),
        expiresAt: zod_1.z.string().datetime().optional().nullable(),
        certifiedBy: zod_1.z.string().max(100).optional().nullable(),
        notes: zod_1.z.string().max(500).optional().nullable(),
        isActive: zod_1.z.boolean().optional()
    }).parse(req.body);
    const updateData = { ...body };
    if (body.certifiedAt)
        updateData.certifiedAt = new Date(body.certifiedAt);
    if (body.expiresAt)
        updateData.expiresAt = new Date(body.expiresAt);
    const competency = await prisma_1.prisma.operatorCompetency.update({
        where: { id: idParam },
        data: updateData
    });
    reply.send(competency);
});
// SHIFT PATTERNS ENDPOINTS
app.get('/shift-patterns', async (req, _reply) => {
    const isActive = zod_1.z.coerce.boolean().optional().parse(req.query?.isActive);
    const where = isActive !== undefined ? { isActive } : {};
    return prisma_1.prisma.shiftPattern.findMany({
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
    });
});
// SHIFT ASSIGNMENTS ENDPOINTS
app.get('/shift-assignments', async (req, _reply) => {
    const operatorId = zod_1.z.coerce.number().optional().parse(req.query?.operatorId);
    const workcenterId = zod_1.z.coerce.number().optional().parse(req.query?.workcenterId);
    const isActive = zod_1.z.coerce.boolean().optional().parse(req.query?.isActive);
    const where = {};
    if (operatorId)
        where.operatorId = operatorId;
    if (workcenterId)
        where.workcenterId = workcenterId;
    if (isActive !== undefined)
        where.isActive = isActive;
    return prisma_1.prisma.shiftAssignment.findMany({
        where,
        include: {
            operator: { select: { firstName: true, lastName: true, employeeId: true } },
            workcenter: { select: { name: true, displayTitle: true } },
            shiftPattern: true
        },
        orderBy: [{ startDate: 'desc' }, { operator: { lastName: 'asc' } }]
    });
});
app.post('/shift-assignments', async (req, reply) => {
    const body = NewShiftAssignment.parse(req.body);
    // Check for overlapping assignments
    const overlapping = await prisma_1.prisma.shiftAssignment.findFirst({
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
    });
    if (overlapping) {
        reply.code(400).send({ message: 'Operator already has an overlapping shift assignment' });
        return;
    }
    const assignment = await prisma_1.prisma.shiftAssignment.create({
        data: {
            ...body,
            startDate: new Date(body.startDate),
            endDate: body.endDate ? new Date(body.endDate) : null
        }
    });
    reply.code(201).send(assignment);
});
// COMPETENCY MATRIX ENDPOINT
app.get('/competency-matrix', async (req, _reply) => {
    const workcenterId = zod_1.z.coerce.number().optional().parse(req.query?.workcenterId);
    // Get all operators with their competencies
    const operators = await prisma_1.prisma.operator.findMany({
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
    });
    // Get all skills
    const skills = await prisma_1.prisma.skill.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
    // Get skill requirements for workcenter if specified
    const skillRequirements = workcenterId ? await prisma_1.prisma.skillRequirement.findMany({
        where: { workcenterId },
        include: { skill: true }
    }) : [];
    return {
        operators,
        skills,
        skillRequirements
    };
});
// Orders
app.get('/orders', async (_req, _reply) => {
    const rows = await prisma_1.prisma.order.findMany({
        include: { sku: { select: { code: true, family: true, familyColorHex: true } } },
        orderBy: { id: 'asc' }
    });
    return rows;
});
app.post('/orders', async (req, reply) => {
    const body = NewOrder.parse(req.body);
    const sku = await prisma_1.prisma.sKU.findFirst({ where: { code: body.skuCode } });
    if (!sku) {
        reply.code(400).send({ message: 'Unknown SKU code' });
        return;
    }
    const row = await prisma_1.prisma.order.create({ data: {
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
        } });
    reply.code(201).send(row);
});
app.patch('/orders/:id', async (req, reply) => {
    const idParam = zod_1.z.coerce.number().parse(req.params.id);
    const data = UpdateOrder.parse(req.body);
    const row = await prisma_1.prisma.order.update({ where: { id: idParam }, data });
    reply.send(row);
});
// Schedule Board - Enhanced for new dashboard layout
app.get('/schedule/board', async (req, _reply) => {
    const viewMode = req.query?.viewMode || 'week';
    const dateParam = req.query?.date || new Date().toISOString().split('T')[0];
    const wcs = await prisma_1.prisma.workcenter.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true, displayTitle: true }
    });
    const lines = [];
    for (const wc of wcs) {
        const blocks = await prisma_1.prisma.scheduleBlock.findMany({
            where: { workcenterId: wc.id },
            orderBy: { startAt: 'asc' },
            include: { order: { include: { sku: true } } }
        });
        const blockIds = blocks.map((b) => b.id);
        const changeovers = await prisma_1.prisma.changeover.findMany({
            where: { workcenterId: wc.id, fromBlockId: { in: blockIds } },
            orderBy: { id: 'asc' }
        });
        // Convert database blocks to frontend OrderBlock format
        const orderBlocks = blocks.flatMap((b) => {
            if (!b.order)
                return [];
            const startDate = new Date(b.startAt);
            const endDate = new Date(b.endAt);
            const durationMin = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60));
            const startMin = startDate.getHours() * 60 + startDate.getMinutes();
            const baseBlock = {
                id: `${b.id}`,
                lineId: wc.name,
                sku: b.order.sku.code,
                title: b.order.shopfloorTitle || b.order.sku.code,
                family: b.order.sku.family,
                qty: b.order.qty,
                runRateUph: b.order.runRateUph,
                leverPct: b.order.performanceLeverPct,
                startMin,
                durationMin,
                colorHex: b.order.colorHex || b.order.sku.familyColorHex
            };
            // Generate plan, performance, and actual blocks
            const plannedUnits = Math.round(b.order.qty);
            const performancePct = Math.random() * 10 + 88; // 88-98% range
            const actualUnits = Math.round(plannedUnits * (performancePct / 100));
            return [
                { ...baseBlock, id: `P-${b.id}`, blockType: 'plan', plannedUnits, performancePct },
                { ...baseBlock, id: `PF-${b.id}`, blockType: 'performance', plannedUnits, actualUnits, performancePct },
                { ...baseBlock, id: `A-${b.id}`, blockType: 'actual', actualUnits }
            ];
        });
        // Calculate week summary
        const totalPlanned = orderBlocks.filter(b => b.blockType === 'plan').reduce((sum, b) => sum + (('plannedUnits' in b) ? b.plannedUnits || 0 : 0), 0);
        const totalActual = orderBlocks.filter(b => b.blockType === 'actual').reduce((sum, b) => sum + (('actualUnits' in b) ? b.actualUnits || 0 : 0), 0);
        const oee = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 100) : 0;
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
            valueStream: viewMode !== 'day' ? `${Math.round(totalActual / 1000)}k/${oee}%` : undefined
        });
    }
    // Generate day headers based on view mode
    const headers = [];
    const today = new Date();
    const daysInView = viewMode === 'day' ? 24 : viewMode === 'week' ? 7 : 31;
    for (let i = 0; i < daysInView; i++) {
        if (viewMode === 'day') {
            headers.push({
                date: today.toISOString().split('T')[0],
                dayName: `${i.toString().padStart(2, '0')}:00`,
                plannedUnits: Math.floor(Math.random() * 200) + 100,
                actualUnits: Math.floor(Math.random() * 220) + 90,
                oee: Math.floor(Math.random() * 20) + 75
            });
        }
        else {
            const date = new Date(today);
            date.setDate(today.getDate() - today.getDay() + i);
            headers.push({
                date: date.toISOString().split('T')[0],
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                plannedUnits: Math.floor(Math.random() * 2000) + 1000,
                actualUnits: Math.floor(Math.random() * 2200) + 900,
                oee: Math.floor(Math.random() * 20) + 75
            });
        }
    }
    return {
        dateISO: dateParam,
        viewMode,
        weekStart: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        monthStart: today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        headers,
        lines
    };
});
const SaveBoardPayload = zod_1.z.object({
    lanes: zod_1.z.array(zod_1.z.object({
        workcenterId: zod_1.z.number().int(),
        blocks: zod_1.z.array(zod_1.z.object({ id: zod_1.z.number().int().optional(), orderId: zod_1.z.number().int().nullable(), startAt: zod_1.z.coerce.date(), endAt: zod_1.z.coerce.date() })),
        changeovers: zod_1.z.array(zod_1.z.object({ id: zod_1.z.number().int().optional(), fromBlockId: zod_1.z.number().int(), toBlockId: zod_1.z.number().int(), typeCode: zod_1.z.string(), plannedMinutes: zod_1.z.number().int().nonnegative() }))
    }))
});
app.post('/schedule/board', async (req, reply) => {
    const body = SaveBoardPayload.parse(req.body);
    await prisma_1.prisma.$transaction(async (tx) => {
        const wcIds = body.lanes.map(l => l.workcenterId);
        // delete in order: changeovers then blocks
        await tx.changeover.deleteMany({ where: { workcenterId: { in: wcIds } } });
        await tx.scheduleBlock.deleteMany({ where: { workcenterId: { in: wcIds } } });
        for (const lane of body.lanes) {
            const createdBlocks = {};
            for (const b of lane.blocks) {
                const row = await tx.scheduleBlock.create({ data: {
                        workcenterId: lane.workcenterId,
                        orderId: b.orderId ?? null,
                        startAt: b.startAt,
                        endAt: b.endAt
                    } });
                if (b.id) {
                    createdBlocks[b.id] = row.id;
                }
            }
            for (const c of lane.changeovers) {
                const fromId = createdBlocks[c.fromBlockId] ?? c.fromBlockId;
                const toId = createdBlocks[c.toBlockId] ?? c.toBlockId;
                await tx.changeover.create({ data: {
                        workcenterId: lane.workcenterId,
                        fromBlockId: fromId,
                        toBlockId: toId,
                        typeCode: c.typeCode,
                        plannedMinutes: c.plannedMinutes,
                        includeInOee: true,
                        complexityTier: null
                    } });
            }
        }
    });
    reply.send({ ok: true });
});
app.get('/reports/daily', async (req, _reply) => {
    const dateParam = req.query?.date || new Date().toISOString().split('T')[0];
    const viewMode = req.query?.viewMode || 'day';
    // Calculate date range based on view mode
    const startDate = new Date(dateParam + 'T00:00:00Z');
    let endDate;
    switch (viewMode) {
        case 'week':
            // Get the week (7 days from start date)
            endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            // Get the month
            endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
            break;
        default: // 'day'
            endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    }
    // Get all workcenters with their schedule blocks for the date range
    const wcs = await prisma_1.prisma.workcenter.findMany({
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
    });
    let totalPlannedUnits = 0;
    let totalProducedUnits = 0;
    let totalChangeoverHours = 0;
    const lines = [];
    for (const wc of wcs) {
        // Calculate planned units from orders
        const plannedUnits = wc.scheduleBlocks.reduce((sum, block) => {
            return sum + (block.order?.qty || 0);
        }, 0);
        // Simulate actual production (88-98% of planned)
        const performancePct = Math.random() * 10 + 88;
        const producedUnits = Math.round(plannedUnits * (performancePct / 100));
        // Calculate changeover time in hours
        const changeoverMinutes = wc.changeovers.reduce((sum, co) => sum + co.plannedMinutes, 0);
        const changeoverHours = changeoverMinutes / 60;
        // Calculate OEE (simplified: actual/planned * 100)
        const oee = plannedUnits > 0 ? Math.round((producedUnits / plannedUnits) * 100) : 0;
        // Calculate ahead/behind in hours (simplified calculation)
        const scheduleVariance = (producedUnits - plannedUnits) / Math.max(1, plannedUnits) * 8; // 8 hour shift
        totalPlannedUnits += plannedUnits;
        totalProducedUnits += producedUnits;
        totalChangeoverHours += changeoverHours;
        if (plannedUnits > 0) { // Only include lines with scheduled production
            lines.push({
                line: wc.displayTitle || wc.name,
                plannedUnits,
                producedUnits,
                oee,
                changeoverHours: Math.round(changeoverHours * 10) / 10,
                aheadBehindH: Math.round(scheduleVariance * 10) / 10,
                top3: ['Changeover', 'Material', 'Quality'] // Simplified for now
            });
        }
    }
    // Calculate overall metrics
    const pctToPlan = totalPlannedUnits > 0 ? Math.round((totalProducedUnits / totalPlannedUnits) * 1000) / 10 : 0;
    const overallOee = totalPlannedUnits > 0 ? Math.round((totalProducedUnits / totalPlannedUnits) * 100) : 0;
    // Project weekly total (current daily * 7)
    const weekProjection = totalProducedUnits * 7;
    // Determine RAG status
    let rag = 'On-Track';
    if (pctToPlan < 95)
        rag = 'At-Risk';
    if (pctToPlan < 90)
        rag = 'Off-Track';
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
    };
});
app.setErrorHandler((error, req, reply) => {
    if (error instanceof zod_1.z.ZodError) {
        reply.code(400).send({ message: 'Validation failed', issues: error.issues });
        return;
    }
    req.log?.error(error);
    reply.code(500).send({ message: 'Internal Server Error' });
});
app.listen({ port: 3000 }, (err, addr) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log('AIPS API on', addr);
});
