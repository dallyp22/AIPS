import { Chip, Tooltip } from '@mui/material'
import { getChangeoverColor, CO_TYPES, requiresSkillLevel } from './coMatrix'

export default function ChangeoverChip({ 
  fromFam, 
  toFam, 
  minutes, 
  typeCode,
  onSetType 
}: {
  fromFam: 'A'|'B'|'C'
  toFam: 'A'|'B'|'C'
  minutes: number
  typeCode?: string
  onSetType: () => void
}){
  const colors = getChangeoverColor(minutes, typeCode)
  const skillReq = requiresSkillLevel(minutes, typeCode)
  const typeInfo = typeCode ? CO_TYPES[typeCode] : null
  
  const tooltipContent = `
    ${typeCode ? `Type ${typeCode}: ` : ''}${typeInfo?.description || 'Standard changeover'}
    Duration: ${minutes} minutes
    ${skillReq ? `Requires: ${skillReq.role} Level ${skillReq.level}+` : 'Standard operator can handle'}
    Click to change type (A-J)
  `.trim()

  return (
    <Tooltip title={tooltipContent} arrow>
      <Chip
        onClick={onSetType}
        label={`CO ${fromFam}→${toFam} ${typeCode ? `(${typeCode})` : ''} ${minutes}m`}
        size="small"
        sx={{ 
          position: 'absolute', 
          bottom: 6, 
          bgcolor: colors.bg, 
          border: `1px solid ${colors.border}`, 
          color: colors.textColor,
          fontSize: '10px',
          fontWeight: 600,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
            transform: 'scale(1.05)'
          },
          // Warning indicator for skill requirements
          ...(skillReq && {
            '&::after': {
              content: '"⚠"',
              position: 'absolute',
              top: -2,
              right: -2,
              fontSize: '8px',
              color: '#FF6B35'
            }
          })
        }}
      />
    </Tooltip>
  )
} 