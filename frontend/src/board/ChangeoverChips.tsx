import { Box, Chip, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { useState } from 'react'
import { getChangeoverColor, CO_TYPES, requiresSkillLevel } from './coMatrix'
import type { Changeover, OrderBlock } from '../types/board'

interface ChangeoverChipsProps {
  line: {
    lineId: string
    blocks: OrderBlock[]
    changeovers?: Changeover[]
  }
  viewMode: 'day' | 'week' | 'month'
  dayWidth: number
  onChangeoverTypeChange?: (fromBlockId: string, toBlockId: string, typeCode: string) => void
}

export default function ChangeoverChips({ 
  line, 
  viewMode, 
  dayWidth,
  onChangeoverTypeChange 
}: ChangeoverChipsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedChangeover, setSelectedChangeover] = useState<Changeover | null>(null)
  const [newTypeCode, setNewTypeCode] = useState('')

  const planBlocks = line.blocks.filter(b => b.blockType === 'plan').sort((a, b) => a.startMin - b.startMin)
  
  const handleChangeoverClick = (changeover: Changeover) => {
    setSelectedChangeover(changeover)
    setNewTypeCode(changeover.typeCode || 'B')
    setDialogOpen(true)
  }

  const handleSaveTypeCode = () => {
    if (selectedChangeover && onChangeoverTypeChange) {
      onChangeoverTypeChange(selectedChangeover.fromBlockId, selectedChangeover.toBlockId, newTypeCode)
    }
    setDialogOpen(false)
    setSelectedChangeover(null)
  }

  const getPositionX = (minutes: number) => {
    if (viewMode === 'day') {
      return (minutes / 60) * dayWidth // Hour-based positioning
    } else {
      return (minutes / (24 * 60)) * dayWidth // Day-based positioning
    }
  }

  return (
    <>
      {line.changeovers?.map(changeover => {
        const fromBlock = planBlocks.find(b => b.id === changeover.fromBlockId)
        const toBlock = planBlocks.find(b => b.id === changeover.toBlockId)
        
        if (!fromBlock || !toBlock) return null

        const fromFamily = fromBlock.family
        const toFamily = toBlock.family
        const colors = getChangeoverColor(changeover.minutes, changeover.typeCode)
        const skillReq = requiresSkillLevel(changeover.minutes, changeover.typeCode)
        const typeInfo = changeover.typeCode ? CO_TYPES[changeover.typeCode] : null

        // Position the chip between the blocks
        const chipPosition = getPositionX(fromBlock.startMin + fromBlock.durationMin)
        
        const tooltipContent = `
          ${changeover.typeCode ? `Type ${changeover.typeCode}: ` : ''}${typeInfo?.description || 'Standard changeover'}
          ${fromFamily} → ${toFamily}
          Duration: ${changeover.minutes} minutes
          ${skillReq ? `Requires: ${skillReq.role} Level ${skillReq.level}+` : 'Standard operator can handle'}
          Click to change type (A-J)
        `.trim()

        return (
          <Tooltip key={changeover.id} title={tooltipContent} arrow>
            <Chip
              onClick={() => handleChangeoverClick(changeover)}
              label={`CO ${fromFamily}→${toFamily} ${changeover.typeCode ? `(${changeover.typeCode})` : ''} ${changeover.minutes}m`}
              size="small"
              sx={{
                position: 'absolute',
                left: chipPosition,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: colors.bg,
                border: `1px solid ${colors.border}`,
                color: colors.textColor,
                fontSize: '9px',
                fontWeight: 600,
                cursor: 'pointer',
                zIndex: 10,
                '&:hover': {
                  opacity: 0.8,
                  transform: 'translateY(-50%) scale(1.05)'
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
      })}

      {/* Changeover Type Selection Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Set Changeover Type
          {selectedChangeover && (
            <>
              {' - '}
              {planBlocks.find(b => b.id === selectedChangeover.fromBlockId)?.family}
              {' → '}
              {planBlocks.find(b => b.id === selectedChangeover.toBlockId)?.family}
            </>
          )}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Changeover Type</InputLabel>
            <Select
              value={newTypeCode}
              onChange={(e) => setNewTypeCode(e.target.value)}
              label="Changeover Type"
            >
              {Object.entries(CO_TYPES).map(([code, info]) => (
                <MenuItem key={code} value={code}>
                  <Box>
                    <Box sx={{ fontWeight: 600 }}>
                      Type {code} - {info.minutes} minutes
                    </Box>
                    <Box sx={{ fontSize: '12px', color: 'text.secondary' }}>
                      {info.description} ({info.tier})
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {newTypeCode && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Box sx={{ fontWeight: 600, mb: 1 }}>
                Type {newTypeCode} Details:
              </Box>
              <Box sx={{ fontSize: '14px' }}>
                Duration: {CO_TYPES[newTypeCode]?.minutes} minutes
              </Box>
              <Box sx={{ fontSize: '14px' }}>
                Complexity: {CO_TYPES[newTypeCode]?.tier}
              </Box>
              <Box sx={{ fontSize: '14px' }}>
                {CO_TYPES[newTypeCode]?.description}
              </Box>
              {requiresSkillLevel(CO_TYPES[newTypeCode]?.minutes || 0, newTypeCode) && (
                <Box sx={{ fontSize: '14px', color: '#FF6B35', mt: 1 }}>
                  ⚠ Requires: {requiresSkillLevel(CO_TYPES[newTypeCode]?.minutes || 0, newTypeCode)?.role} Level {requiresSkillLevel(CO_TYPES[newTypeCode]?.minutes || 0, newTypeCode)?.level}+
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveTypeCode} variant="contained">
            Save Type {newTypeCode}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
