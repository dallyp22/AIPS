"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Comprehensive SKU families for realistic production scenarios
const SKU_FAMILIES = [
    { family: 'A', description: 'Energy Drinks', color: '#2E86AB', complexity: 'low' },
    { family: 'B', description: 'Sports Drinks', color: '#A23B72', complexity: 'medium' },
    { family: 'C', description: 'Juices', color: '#F18F01', complexity: 'high' }
];
// Realistic order scenarios for packaging operations
const ORDER_SCENARIOS = [
    { type: 'rush', description: 'High priority rush orders', leverRange: [110, 120] },
    { type: 'standard', description: 'Standard production orders', leverRange: [95, 105] },
    { type: 'efficiency', description: 'Efficiency-focused orders', leverRange: [85, 95] }
];
// Comprehensive list of packaging SKUs
const PACKAGING_SKUS = [
    // Energy Drinks (Family A)
    { code: 'NRG-RED-500', family: 'A', formula: 'NRG001', bottle: '500ml', case: '24' },
    { code: 'NRG-BLU-500', family: 'A', formula: 'NRG002', bottle: '500ml', case: '24' },
    { code: 'NRG-GRN-355', family: 'A', formula: 'NRG003', bottle: '355ml', case: '24' },
    { code: 'NRG-SIL-250', family: 'A', formula: 'NRG004', bottle: '250ml', case: '30' },
    // Sports Drinks (Family B)
    { code: 'SPT-ORG-750', family: 'B', formula: 'SPT001', bottle: '750ml', case: '12' },
    { code: 'SPT-BLU-500', family: 'B', formula: 'SPT002', bottle: '500ml', case: '20' },
    { code: 'SPT-RED-500', family: 'B', formula: 'SPT003', bottle: '500ml', case: '20' },
    { code: 'SPT-YEL-1L', family: 'B', formula: 'SPT004', bottle: '1L', case: '12' },
    // Juices (Family C)
    { code: 'JCE-APL-1L', family: 'C', formula: 'JCE001', bottle: '1L', case: '12' },
    { code: 'JCE-ORG-500', family: 'C', formula: 'JCE002', bottle: '500ml', case: '15' },
    { code: 'JCE-GRP-750', family: 'C', formula: 'JCE003', bottle: '750ml', case: '12' },
    { code: 'JCE-CRN-500', family: 'C', formula: 'JCE004', bottle: '500ml', case: '15' },
    { code: 'JCE-MIX-1L', family: 'C', formula: 'JCE005', bottle: '1L', case: '10' }
];
// Production orders with realistic characteristics
const PRODUCTION_ORDERS = [
    // Week 1 - Monday
    { sku: 'NRG-RED-500', qty: 48000, rate: 2000, priority: 1, type: 'rush', due: 1 },
    { sku: 'SPT-ORG-750', qty: 24000, rate: 1200, priority: 2, type: 'standard', due: 1 },
    { sku: 'JCE-APL-1L', qty: 18000, rate: 900, priority: 3, type: 'efficiency', due: 2 },
    // Week 1 - Tuesday
    { sku: 'NRG-BLU-500', qty: 36000, rate: 1800, priority: 1, type: 'standard', due: 2 },
    { sku: 'SPT-BLU-500', qty: 30000, rate: 1500, priority: 2, type: 'rush', due: 2 },
    { sku: 'JCE-ORG-500', qty: 22500, rate: 1125, priority: 3, type: 'standard', due: 3 },
    // Week 1 - Wednesday
    { sku: 'NRG-GRN-355', qty: 42000, rate: 2100, priority: 1, type: 'efficiency', due: 3 },
    { sku: 'SPT-RED-500', qty: 27000, rate: 1350, priority: 2, type: 'standard', due: 3 },
    { sku: 'JCE-GRP-750', qty: 15000, rate: 750, priority: 3, type: 'rush', due: 4 },
    // Week 1 - Thursday
    { sku: 'NRG-SIL-250', qty: 60000, rate: 2400, priority: 1, type: 'standard', due: 4 },
    { sku: 'SPT-YEL-1L', qty: 18000, rate: 900, priority: 2, type: 'efficiency', due: 4 },
    { sku: 'JCE-CRN-500', qty: 25500, rate: 1275, priority: 3, type: 'standard', due: 5 },
    // Week 1 - Friday
    { sku: 'NRG-RED-500', qty: 33000, rate: 1650, priority: 2, type: 'rush', due: 5 },
    { sku: 'SPT-ORG-750', qty: 21000, rate: 1050, priority: 3, type: 'standard', due: 5 },
    { sku: 'JCE-MIX-1L', qty: 12000, rate: 600, priority: 1, type: 'efficiency', due: 6 },
];
async function clearExistingData() {
    console.log('🧹 Clearing existing data...');
    // Delete in dependency order
    await prisma.changeover.deleteMany();
    await prisma.scheduleBlock.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.sKU.deleteMany();
    console.log('✅ Existing data cleared');
}
async function seedEnhancedSKUs() {
    console.log('📦 Seeding enhanced SKU catalog...');
    for (const skuData of PACKAGING_SKUS) {
        const familyInfo = SKU_FAMILIES.find(f => f.family === skuData.family);
        await prisma.sKU.create({
            data: {
                code: skuData.code,
                family: skuData.family,
                familyColorHex: familyInfo.color,
                formula: skuData.formula,
                bottleSize: skuData.bottle,
                caseSize: skuData.case,
                products: {
                    create: {
                        name: `${familyInfo.description} - ${skuData.bottle}`
                    }
                }
            }
        });
    }
    console.log(`✅ Created ${PACKAGING_SKUS.length} SKUs with products`);
}
async function seedRealisticOrders() {
    console.log('📋 Seeding realistic production orders...');
    const workcenters = await prisma.workcenter.findMany();
    const skus = await prisma.sKU.findMany();
    const skuMap = new Map(skus.map(s => [s.code, s]));
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    for (const orderData of PRODUCTION_ORDERS) {
        const sku = skuMap.get(orderData.sku);
        if (!sku)
            continue;
        const scenario = ORDER_SCENARIOS.find(s => s.type === orderData.type);
        const leverPct = scenario.leverRange[0] + Math.random() * (scenario.leverRange[1] - scenario.leverRange[0]);
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + orderData.due);
        // Assign to random workcenter for now (in real system, this would be planned)
        const workcenter = workcenters[Math.floor(Math.random() * workcenters.length)];
        await prisma.order.create({
            data: {
                orderNo: `ORD-${orderData.sku}-${String(orderData.due).padStart(2, '0')}`,
                skuId: sku.id,
                qty: orderData.qty,
                runRateUph: orderData.rate,
                performanceLeverPct: Math.round(leverPct * 10) / 10,
                priority: orderData.priority,
                dueAt: dueDate,
                workcenterId: workcenter.id,
                shopfloorTitle: `${sku.family}-Family ${orderData.qty / 1000}k units`,
                colorHex: orderData.type === 'rush' ? '#FF5722' :
                    orderData.type === 'efficiency' ? '#4CAF50' : null
            }
        });
    }
    console.log(`✅ Created ${PRODUCTION_ORDERS.length} realistic production orders`);
}
async function seedScheduleBlocks() {
    console.log('📅 Creating realistic schedule blocks...');
    const orders = await prisma.order.findMany({
        include: { sku: true, plannedWorkcenter: true }
    });
    const workcenters = await prisma.workcenter.findMany();
    let blockId = 1;
    const today = new Date();
    today.setHours(6, 0, 0, 0); // Start at 6 AM
    for (let day = 0; day < 7; day++) { // Create schedule for a week
        for (const wc of workcenters) {
            const dayOrders = orders.filter(o => o.workcenterId === wc.id &&
                Math.floor(Math.random() * 7) === day // Random assignment for demo
            ).slice(0, 2); // Max 2 orders per line per day
            let currentTime = new Date(today);
            currentTime.setDate(currentTime.getDate() + day);
            currentTime.setHours(6, 0, 0, 0); // Start each day at 6 AM
            for (const order of dayOrders) {
                // Calculate realistic duration based on quantity and rate
                const adjustedRate = order.runRateUph * (order.performanceLeverPct / 100);
                const durationHours = order.qty / adjustedRate;
                const blockDuration = Math.min(durationHours, 8); // Max 8 hours per block
                const startTime = new Date(currentTime);
                const endTime = new Date(currentTime.getTime() + blockDuration * 60 * 60 * 1000);
                await prisma.scheduleBlock.create({
                    data: {
                        workcenterId: wc.id,
                        orderId: order.id,
                        startAt: startTime,
                        endAt: endTime
                    }
                });
                // Move to next time slot with 30-min changeover buffer
                currentTime = new Date(endTime.getTime() + 30 * 60 * 1000);
                // Don't exceed 18:00 (6 PM)
                const endOfDay = new Date(startTime);
                endOfDay.setHours(18, 0, 0, 0);
                if (currentTime >= endOfDay)
                    break;
            }
        }
    }
    console.log('✅ Created realistic schedule blocks for the week');
}
async function seedChangeoverScenarios() {
    console.log('🔄 Creating changeover scenarios...');
    const scheduleBlocks = await prisma.scheduleBlock.findMany({
        include: { order: { include: { sku: true } } },
        orderBy: [{ workcenterId: 'asc' }, { startAt: 'asc' }]
    });
    // Group blocks by workcenter
    const blocksByWorkcenter = new Map();
    for (const block of scheduleBlocks) {
        if (!blocksByWorkcenter.has(block.workcenterId)) {
            blocksByWorkcenter.set(block.workcenterId, []);
        }
        blocksByWorkcenter.get(block.workcenterId).push(block);
    }
    // Create changeovers between consecutive blocks
    for (const [workcenterId, blocks] of blocksByWorkcenter) {
        for (let i = 0; i < blocks.length - 1; i++) {
            const fromBlock = blocks[i];
            const toBlock = blocks[i + 1];
            if (!fromBlock.order || !toBlock.order)
                continue;
            // Determine changeover type based on family changes
            const fromFamily = fromBlock.order.sku.family;
            const toFamily = toBlock.order.sku.family;
            let changeoverType;
            let plannedMinutes;
            if (fromFamily === toFamily) {
                // Same family - minor changeover
                changeoverType = Math.random() > 0.5 ? 'A' : 'B';
                plannedMinutes = changeoverType === 'A' ? 10 : 20;
            }
            else {
                // Different families - more complex changeover
                const complexityMap = {
                    'A': ['C', 'D'], // Energy drinks to others
                    'B': ['D', 'E'], // Sports drinks to others  
                    'C': ['F', 'G'] // Juices to others (most complex)
                };
                const types = complexityMap[fromFamily] || ['C'];
                changeoverType = types[Math.floor(Math.random() * types.length)];
                const minutesMap = {
                    'A': 10, 'B': 20, 'C': 30, 'D': 40, 'E': 50, 'F': 60, 'G': 75
                };
                plannedMinutes = minutesMap[changeoverType] || 30;
            }
            await prisma.changeover.create({
                data: {
                    workcenterId,
                    fromBlockId: fromBlock.id,
                    toBlockId: toBlock.id,
                    typeCode: changeoverType,
                    plannedMinutes,
                    includeInOee: true,
                    complexityTier: plannedMinutes <= 30 ? 'Low' :
                        plannedMinutes <= 60 ? 'Medium' : 'High'
                }
            });
        }
    }
    console.log('✅ Created realistic changeover scenarios');
}
async function generateDemoStatistics() {
    console.log('📊 Generating demo statistics...');
    // Get counts of created data
    const skuCount = await prisma.sKU.count();
    const orderCount = await prisma.order.count();
    const blockCount = await prisma.scheduleBlock.count();
    const changeoverCount = await prisma.changeover.count();
    const operatorCount = await prisma.operator.count();
    const skillCount = await prisma.skill.count();
    console.log(`
🎯 Demo Database Statistics:
   📦 SKUs: ${skuCount}
   📋 Orders: ${orderCount}
   📅 Schedule Blocks: ${blockCount}
   🔄 Changeovers: ${changeoverCount}
   👥 Operators: ${operatorCount}
   🎓 Skills: ${skillCount}
  `);
    // Sample some data to verify
    const sampleOrders = await prisma.order.findMany({
        include: { sku: true, plannedWorkcenter: true },
        take: 3
    });
    console.log('\n📋 Sample Orders:');
    for (const order of sampleOrders) {
        console.log(`   ${order.orderNo}: ${order.qty.toLocaleString()} units of ${order.sku.code} (${order.performanceLeverPct}% lever)`);
    }
}
async function main() {
    try {
        console.log('🚀 Starting Enhanced Database Seeding...\n');
        await clearExistingData();
        await seedEnhancedSKUs();
        await seedRealisticOrders();
        await seedScheduleBlocks();
        await seedChangeoverScenarios();
        await generateDemoStatistics();
        console.log('\n🎉 Enhanced seeding completed successfully!');
        console.log('🔥 Your AIPS demo database is now loaded with realistic production data!');
    }
    catch (error) {
        console.error('❌ Error during enhanced seeding:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
if (require.main === module) {
    main()
        .catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
