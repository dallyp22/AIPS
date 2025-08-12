export type Family = 'A' | 'B' | 'C'
export type ViewMode = 'day' | 'week' | 'month'
export type BlockType = 'plan' | 'performance' | 'actual'

export interface OrderBlock {
  id: string
  lineId: string
  sku: string
  title: string
  family: Family
  qty: number
  runRateUph: number
  leverPct: number
  startMin: number
  durationMin: number
  colorHex?: string
  // Enhanced performance data
  plannedUnits?: number
  actualUnits?: number
  performanceUnits?: number
  oee?: number
  blockType: BlockType
  weekOf?: string
  performancePct?: number
}

export interface Changeover {
  id: string
  lineId: string
  fromBlockId: string
  toBlockId: string
  typeCode?: 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'
  minutes: number
  includeInOee: boolean
}

export interface DayHeader {
  date: string
  dayName: string
  plannedUnits: number
  actualUnits: number
  oee: number
}

export interface WeekSummary {
  weekOf: string
  plannedUnits: number
  actualUnits: number
  oee: number
  performancePct: number
}

export interface LineData {
  lineId: string
  lineName: string
  blocks: OrderBlock[]
  changeovers: Changeover[]
  weekSummary?: WeekSummary
  valueStream?: string
}

export interface BoardState {
  dateISO: string
  viewMode: ViewMode
  weekStart: string
  monthStart: string
  headers: DayHeader[]
  lines: LineData[]
} 