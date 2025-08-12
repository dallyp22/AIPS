import { Box, Tooltip, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'
import { useDraggable } from '@dnd-kit/core'
import { useState } from 'react'
import type { OrderBlock, BlockType } from '../types/board'

const getBlockColor = (blockType: BlockType, performancePct?: number) => {
  switch (blockType) {
    case 'plan':
      return '#2E86AB' // Blue for plan
    case 'performance':
      if (!performancePct) return '#6AA84F'
      if (performancePct >= 98) return '#4CAF50' // Green
      if (performancePct >= 95) return '#FF9800' // Orange  
      if (performancePct >= 90) return '#F44336' // Red
      return '#9E9E9E' // Gray
    case 'actual':
      return '#8E24AA' // Purple for actual
    default:
      return '#6AA84F'
  }
}

const formatNumber = (num?: number) => {
  if (!num) return ''
  if (num >= 1000) return `${(num/1000).toFixed(1)}k`
  return num.toString()
}

export default function ProductionBlock({ 
  block, 
  width, 
  showMetrics = true,
  isDraggable = false,
  onDurationChange
}: { 
  block: OrderBlock
  width: number
  showMetrics?: boolean
  isDraggable?: boolean
  onDurationChange?: (blockId: string, newDuration: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: block.id,
    data: { block },
    disabled: !isDraggable || block.blockType !== 'plan' // Only allow dragging plan blocks
  })

  const [isHovered, setIsHovered] = useState(false)
  const [durationDialogOpen, setDurationDialogOpen] = useState(false)
  const [newDuration, setNewDuration] = useState(block.durationMin)

  const color = getBlockColor(block.blockType, block.performancePct)
  const isSmall = width < 60

  const handleDurationSave = () => {
    if (onDurationChange && newDuration !== block.durationMin && newDuration > 0) {
      onDurationChange(block.id, newDuration)
    }
    setDurationDialogOpen(false)
  }
  
  const tooltipContent = `
    ${block.title} • ${block.family}
    ${block.blockType.toUpperCase()}
    Duration: ${block.durationMin} minutes
    ${block.plannedUnits ? `Planned: ${formatNumber(block.plannedUnits)}` : ''}
    ${block.actualUnits ? `Actual: ${formatNumber(block.actualUnits)}` : ''}
    ${block.oee ? `OEE: ${block.oee}%` : ''}
    ${block.performancePct ? `Performance: ${block.performancePct}%` : ''}
    ${isDraggable && block.blockType === 'plan' ? '\nDrag to reschedule • Double-click to adjust duration' : ''}
  `.trim()

  const dragStyle = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 1000 : 'auto'
  } : {}

  return (
    <>
      <Tooltip title={tooltipContent} arrow>
        <Box 
          ref={setNodeRef}
          {...(isDraggable && block.blockType === 'plan' ? attributes : {})}
          {...(isDraggable && block.blockType === 'plan' ? listeners : {})}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onDoubleClick={() => {
            if (isDraggable && block.blockType === 'plan' && onDurationChange) {
              setNewDuration(block.durationMin)
              setDurationDialogOpen(true)
            }
          }}
          sx={{
            width,
            height: 28,
            bgcolor: color,
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: 0.5,
            color: '#000',
            fontSize: isSmall ? '9px' : '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isDraggable && block.blockType === 'plan' ? 'grab' : 'pointer',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            px: 0.5,
            position: 'relative',
            '&:hover': {
              opacity: 0.8,
              transform: isDragging ? 'none' : 'scale(1.02)'
            },
            // Dragging indicator
            ...(isDraggable && block.blockType === 'plan' && {
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 2,
                right: 2,
                width: 4,
                height: 4,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.8)'
              }
            }),
            ...dragStyle
          }}
        >
          {showMetrics && !isSmall ? (
            <Box sx={{ textAlign: 'center', lineHeight: 1 }}>
              <Box>{formatNumber(block.plannedUnits || block.qty)}</Box>
              {block.performancePct && (
                <Box sx={{ fontSize: '8px' }}>{block.performancePct}%</Box>
              )}
            </Box>
          ) : (
            <Box sx={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {isSmall ? block.sku : block.title}
            </Box>
          )}

          {/* Duration resize handle */}
          {isDraggable && block.blockType === 'plan' && isHovered && onDurationChange && (
            <Box
              sx={{
                position: 'absolute',
                right: -2,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: 'ew-resize',
                bgcolor: '#01D1D1',
                opacity: 0.8,
                '&:hover': {
                  opacity: 1,
                  width: 6
                }
              }}
              onClick={(e) => {
                e.stopPropagation()
                setNewDuration(block.durationMin)
                setDurationDialogOpen(true)
              }}
            />
          )}
        </Box>
      </Tooltip>

      {/* Duration adjustment dialog */}
      <Dialog open={durationDialogOpen} onClose={() => setDurationDialogOpen(false)}>
        <DialogTitle>Adjust Duration - {block.title}</DialogTitle>
        <DialogContent>
          <TextField
            label="Duration (minutes)"
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)}
            fullWidth
            margin="normal"
            inputProps={{ min: 15, max: 720, step: 15 }}
            helperText="Duration in 15-minute increments (15-720 minutes)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDurationDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDurationSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </>
  )
} 