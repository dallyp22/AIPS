import type { Family } from '../types/board'

// Changeover Types A-J with fixed minutes and complexity tiers
export const CO_TYPES: Record<string, { minutes: number; tier: string; description: string }> = {
  A: { minutes: 10, tier: 'light', description: 'Minor adjustment' },
  B: { minutes: 20, tier: 'light', description: 'Standard clean' },
  C: { minutes: 30, tier: 'med', description: 'Deep clean' },
  D: { minutes: 40, tier: 'med', description: 'Setup + clean' },
  E: { minutes: 50, tier: 'med', description: 'Component swap' },
  F: { minutes: 60, tier: 'heavy', description: 'Major setup' },
  G: { minutes: 75, tier: 'heavy', description: 'Line reconfiguration' },
  H: { minutes: 90, tier: 'heavy', description: 'Format change' },
  I: { minutes: 120, tier: 'ext', description: 'Complete teardown' },
  J: { minutes: 150, tier: 'ext', description: 'Full line rebuild' }
}

// Family-to-family base changeover minutes (when no type specified)
export const CO_MATRIX: Record<Family, Record<Family, number>> = {
  A: { A: 10, B: 20, C: 40 }, // Light to Medium/Heavy changeovers
  B: { A: 25, B: 10, C: 30 }, // Medium complexity 
  C: { A: 50, B: 35, C: 10 }  // Heavy family requires more setup
}

// Color mapping for changeover complexity tiers
export const CO_TIER_COLORS = {
  light: { bg: '#F8D7DA', border: '#E57373', textColor: '#8B0000' },
  med: { bg: '#F5C6CB', border: '#D32F2F', textColor: '#8B0000' },
  heavy: { bg: '#F1AEB2', border: '#C62828', textColor: '#FFFFFF' },
  ext: { bg: '#E5989B', border: '#B71C1C', textColor: '#FFFFFF' }
}

// Determine complexity tier from minutes
export const coTier = (minutes: number): string => {
  if (minutes <= 20) return 'light'
  if (minutes <= 60) return 'med'
  if (minutes <= 120) return 'heavy'
  return 'ext'
}

// Calculate changeover minutes with business rules
export function deriveCoMinutes(fromFam: Family, toFam: Family, typeCode?: string): number {
  // If explicit type is specified, use its fixed minutes
  if (typeCode && CO_TYPES[typeCode]) {
    return CO_TYPES[typeCode].minutes
  }
  
  // Otherwise use family matrix default
  return CO_MATRIX[fromFam]?.[toFam] ?? 20
}

// Get changeover color based on minutes or type
export function getChangeoverColor(minutes: number, typeCode?: string) {
  const tier = typeCode ? CO_TYPES[typeCode]?.tier || coTier(minutes) : coTier(minutes)
  return CO_TIER_COLORS[tier as keyof typeof CO_TIER_COLORS] || CO_TIER_COLORS.med
}

// Validate if changeover requires specific skill level
export function requiresSkillLevel(minutes: number, typeCode?: string): { level: number; role: string } | null {
  const tier = typeCode ? CO_TYPES[typeCode]?.tier || coTier(minutes) : coTier(minutes)
  
  switch (tier) {
    case 'heavy':
    case 'ext':
      return { level: 2, role: 'Mechanic' } // Requires Mechanic L2+
    default:
      return null // Standard operator can handle
  }
} 