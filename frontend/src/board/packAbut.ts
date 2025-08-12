import type { OrderBlock, Changeover } from '../types/board'
import { deriveCoMinutes } from './coMatrix'

export const PX_PER_15 = 12
export const DAY_MINS = 24 * 60

export function effDurationMin(b: OrderBlock) {
  return Math.max(15, Math.round(b.durationMin * (100 / Math.max(1, b.leverPct))))
}

export function packLineAbutting(
  blocks: OrderBlock[],
  coByKey: Map<string, Changeover> = new Map()
) {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin)
  const changeovers: Changeover[] = []
  if (sorted.length === 0) return { blocks: sorted, changeovers }

  let cursor = Math.max(0, sorted[0].startMin)
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    a.startMin = Math.min(Math.max(a.startMin, cursor), DAY_MINS - 15)
    const aEnd = a.startMin + effDurationMin(a)

    const b = sorted[i + 1]
    const key = `${a.id}->${b.id}`
    const previous = coByKey.get(key)

    const minutes = deriveCoMinutes(a.family as any, b.family as any, previous?.typeCode)
    const co: Changeover = {
      id: previous?.id || `CO-${a.id}-${b.id}`,
      lineId: a.lineId,
      fromBlockId: a.id,
      toBlockId: b.id,
      typeCode: previous?.typeCode,
      minutes,
      includeInOee: true
    }
    changeovers.push(co)

    const bStart = aEnd + minutes
    b.startMin = Math.min(Math.max(bStart, 0), DAY_MINS - 15)
    cursor = b.startMin
  }

  return { blocks: sorted, changeovers }
} 