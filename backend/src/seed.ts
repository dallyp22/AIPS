import { readFileSync } from 'fs'
import path from 'path'
import { prisma } from './prisma'

async function ensurePlantAndDepartment(){
  let plant = await prisma.plant.findFirst()
  if(!plant){
    plant = await prisma.plant.create({ data: { name: 'Default Plant' } })
  }
  let dept = await prisma.department.findFirst({ where: { plantId: plant.id } })
  if(!dept){
    dept = await prisma.department.create({ data: { name: 'Packaging', plantId: plant.id } })
  }
  return { plantId: plant.id, departmentId: dept.id }
}

async function seedWorkcenters(plantId: number, departmentId: number){
  const csvPath = path.resolve(__dirname, '../../seeds/workcenters.csv')
  const csv = readFileSync(csvPath, 'utf-8').trim()
  const [header, ...lines] = csv.split(/\r?\n/)
  const cols = header.split(',')
  const records = lines
    .map((line: string) => line.trim())
    .filter(Boolean)
    .map((line: string) => {
      const parts = line.split(',')
      const rec: Record<string, string> = {}
      cols.forEach((c: string, i: number) => { rec[c] = parts[i] })
      return {
        plantId,
        departmentId,
        workcenterNo: String(rec.workcenterNo),
        name: String(rec.name),
        displayTitle: String(rec.displayTitle || rec.name),
        defaultSchemeId: Number(rec.defaultSchemeId || 1),
        minStaff: Number(rec.minStaff || 0)
      }
    })

  if(records.length > 0){
    for(const r of records){
      await prisma.workcenter.create({ data: r })
    }
  }
}

async function seedSkusAndOrders(){
  const skuCount = await prisma.sKU.count()
  if(skuCount === 0){
    const skuA = await prisma.sKU.create({ data: { code: 'SKU-AX12', family: 'A', familyColorHex: '#2E86AB', formula: 'AX12', bottleSize: '500ml', caseSize: '12' } })
    const skuB = await prisma.sKU.create({ data: { code: 'SKU-BX22', family: 'B', familyColorHex: '#6AA84F', formula: 'BX22', bottleSize: '100ml', caseSize: '24' } })

    const wc = await prisma.workcenter.findFirst()
    await prisma.order.create({ data: {
      orderNo: 'O-1001', skuId: skuA.id, qty: 12000, runRateUph: 600, performanceLeverPct: 100, priority: 3,
      dueAt: new Date(Date.now() + 24*3600*1000), shopfloorTitle: 'AX12-500ml', colorHex: '#2E86AB', workcenterId: wc?.id ?? null
    } })
    await prisma.order.create({ data: {
      orderNo: 'O-1002', skuId: skuB.id, qty: 9000, runRateUph: 450, performanceLeverPct: 100, priority: 3,
      dueAt: new Date(Date.now() + 48*3600*1000), shopfloorTitle: 'BX22-100ml', colorHex: '#6AA84F', workcenterId: wc?.id ?? null
    } })
  }
}

async function seedBoard(){
  const wc = await prisma.workcenter.findFirst()
  const orders = await prisma.order.findMany({ take: 2, orderBy: { id: 'asc' } })
  if(wc && orders.length >= 2){
    const existing = await prisma.scheduleBlock.count({ where: { workcenterId: wc.id } })
    if(existing === 0){
      const now = new Date()
      const start1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0)
      const end1 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0)
      const start2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0)
      const end2 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 0, 0)
      const b1 = await prisma.scheduleBlock.create({ data: { workcenterId: wc.id, orderId: orders[0].id, startAt: start1, endAt: end1 } })
      const b2 = await prisma.scheduleBlock.create({ data: { workcenterId: wc.id, orderId: orders[1].id, startAt: start2, endAt: end2 } })
      await prisma.changeover.create({ data: { workcenterId: wc.id, fromBlockId: b1.id, toBlockId: b2.id, typeCode: 'B', plannedMinutes: 20, includeInOee: true } })
    }
  }
}

async function main(){
  const existingCount = await prisma.workcenter.count()
  if(existingCount === 0){
    const ids = await ensurePlantAndDepartment()
    await seedWorkcenters(ids.plantId, ids.departmentId)
  }
  await seedSkusAndOrders()
  await seedBoard()
  console.log('Seed complete')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async ()=> { await prisma.$disconnect() }) 