import { Box, Typography } from '@mui/material'
import { useDroppable } from '@dnd-kit/core'
import ProductionBlock from './ProductionBlock'
import ChangeoverChips from './ChangeoverChips'
import type { LineData, ViewMode, BlockType } from '../types/board'

interface ProductionLineProps {
  line: LineData
  viewMode: ViewMode
  dayWidth: number
  daysCount: number
  isDraggable?: boolean
  onDurationChange?: (blockId: string, newDuration: number) => void
  onChangeoverTypeChange?: (fromBlockId: string, toBlockId: string, typeCode: string) => void
}

const formatNumber = (num?: number) => {
  if (!num) return '0'
  if (num >= 1000) return `${(num/1000).toFixed(1)}k`
  return num.toString()
}

// Convert minutes from start of day to hour index (0-23)
const getHourFromMinutes = (minutes: number) => {
  return Math.floor(minutes / 60) % 24
}

// Get the column count based on view mode
const getColumnCount = (viewMode: ViewMode, daysCount: number) => {
  if (viewMode === 'day') return 24 // 24 hours
  return daysCount // days in week/month
}

// Drop zone component for each time slot
function TimeSlotDropZone({ 
  dropZoneId, 
  dayWidth, 
  children, 
  isDraggable,
  rowType 
}: { 
  dropZoneId: string
  dayWidth: number
  children: React.ReactNode
  isDraggable?: boolean
  rowType?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
    disabled: !isDraggable || rowType !== 'plan' // Only allow drops in plan rows
  })

  return (
    <Box 
      ref={setNodeRef}
      sx={{ 
        width: dayWidth,
        height: 32,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 0.5,
        backgroundColor: isOver ? 'rgba(1,209,209,0.1)' : 'transparent',
        border: isOver ? '1px dashed rgba(1,209,209,0.5)' : 'none',
        borderRadius: isOver ? 1 : 0,
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </Box>
  )
}

export default function ProductionLine({ 
  line, 
  viewMode, 
  dayWidth, 
  daysCount,
  isDraggable = false,
  onDurationChange,
  onChangeoverTypeChange
}: ProductionLineProps) {
  // Group blocks by type
  const planBlocks = line.blocks.filter(b => b.blockType === 'plan')
  const performanceBlocks = line.blocks.filter(b => b.blockType === 'performance')
  const actualBlocks = line.blocks.filter(b => b.blockType === 'actual')

  const columnCount = getColumnCount(viewMode, daysCount)

  const renderBlockRow = (blocks: any[], rowType: BlockType, label: string) => (
    <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: 32 }}>
      <Box sx={{ 
        width: 200, 
        display: 'flex', 
        alignItems: 'center',
        pl: 2,
        borderRight: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Typography variant="body2" sx={{ fontSize: '11px', fontWeight: 500 }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flex: 1, alignItems: 'center', position: 'relative' }}>
        {/* Render time period columns with drop zones */}
        {Array.from({ length: columnCount }).map((_, columnIndex) => {
          const dropZoneId = `${line.lineId}:${columnIndex}:${rowType}`
          
          return (
            <Box key={columnIndex} sx={{ 
              borderLeft: columnIndex > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              // Highlight shift changes in day view
              bgcolor: viewMode === 'day' ? (
                columnIndex === 6 || columnIndex === 14 || columnIndex === 22 ? 'rgba(1,209,209,0.03)' : 'transparent'
              ) : 'transparent'
            }}>
              {/* Show shift indicators in day view */}
              {viewMode === 'day' && (columnIndex === 6 || columnIndex === 14 || columnIndex === 22) && (
                <Box sx={{
                  position: 'absolute',
                  left: -1,
                  top: 0,
                  bottom: 0,
                  width: 2,
                  bgcolor: columnIndex === 6 ? '#4CAF50' : columnIndex === 14 ? '#FF9800' : '#2196F3',
                  opacity: 0.7,
                  zIndex: 1
                }} />
              )}
              
              <TimeSlotDropZone
                dropZoneId={dropZoneId}
                dayWidth={dayWidth}
                isDraggable={isDraggable}
                rowType={rowType}
              >
                {/* Render blocks for this time period */}
                {blocks
                  .filter(block => {
                    if (viewMode === 'day') {
                      // For day view, filter by hour
                      const blockHour = getHourFromMinutes(block.startMin)
                      const blockEndHour = getHourFromMinutes(block.startMin + block.durationMin)
                      return blockHour === columnIndex || 
                             (blockHour <= columnIndex && blockEndHour > columnIndex)
                    } else {
                      // For week/month view, filter by day
                      const blockDay = Math.floor(block.startMin / (24 * 60))
                      return blockDay === columnIndex
                    }
                  })
                  .map((block, blockIndex) => {
                    // Calculate block width based on duration
                    let blockWidth = dayWidth - 8
                    if (viewMode === 'day') {
                      // In day view, scale width based on duration within the hour
                      const durationHours = block.durationMin / 60
                      blockWidth = Math.min(dayWidth * durationHours, dayWidth - 4)
                    }
                    
                    return (
                      <ProductionBlock
                        key={block.id}
                        block={block}
                        width={Math.max(20, blockWidth)}
                        isDraggable={isDraggable}
                        onDurationChange={onDurationChange}
                      />
                    )
                  })
                }
              </TimeSlotDropZone>
            </Box>
          )
        })}
        
        {/* Week summary column - only for week/month views */}
        {viewMode !== 'day' && (
          <Box sx={{ 
            width: dayWidth,
            height: 32,
            borderLeft: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 600
          }}>
            {line.weekSummary && rowType === 'performance' && 
              `${formatNumber(line.weekSummary.actualUnits)}`
            }
          </Box>
        )}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ mb: 0 }}>
      {/* Line Header */}
      <Box sx={{ 
        display: 'flex', 
        bgcolor: 'rgba(1,209,209,0.1)', 
        borderTop: '2px solid rgba(1,209,209,0.3)',
        borderBottom: '1px solid rgba(1,209,209,0.2)'
      }}>
        <Box sx={{ 
          width: 200, 
          display: 'flex', 
          alignItems: 'center',
          py: 1,
          pl: 2,
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '13px' }}>
              {line.lineName}
            </Typography>
            {line.weekSummary && viewMode !== 'day' && (
              <Typography variant="caption" sx={{ 
                fontSize: '10px', 
                opacity: 0.8,
                display: 'block'
              }}>
                Week of {line.weekSummary.weekOf}
              </Typography>
            )}
            {viewMode === 'day' && (
              <Typography variant="caption" sx={{ 
                fontSize: '10px', 
                opacity: 0.8,
                display: 'block',
                color: '#4CAF50'
              }}>
                24-Hour Schedule
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          flex: 1, 
          alignItems: 'center',
          justifyContent: 'flex-end',
          pr: 2
        }}>
          {line.weekSummary && viewMode !== 'day' && (
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              fontSize: '11px',
              color: line.weekSummary.performancePct >= 95 ? '#4CAF50' : '#FF9800'
            }}>
              OEE +{line.weekSummary.oee}%
            </Typography>
          )}
          {viewMode === 'day' && (
            <Typography variant="body2" sx={{ 
              fontWeight: 600, 
              fontSize: '11px',
              color: '#01D1D1'
            }}>
              Real-time View
            </Typography>
          )}
        </Box>
      </Box>

      {/* Batch/Units Row Header */}
      <Box sx={{ 
        display: 'flex', 
        bgcolor: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Box sx={{ 
          width: 200, 
          py: 0.5,
          pl: 2,
          borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.7 }}>
            {viewMode === 'day' ? 'Hourly Production' : 'Batch/Units'}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}></Box>
      </Box>

      {/* Plan Row */}
      <Box sx={{ position: 'relative' }}>
        {renderBlockRow(planBlocks, 'plan', 'Plan')}
        
        {/* Changeover chips overlay */}
        {onChangeoverTypeChange && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 200, // Start after the label column
            right: 0, 
            bottom: 0, 
            pointerEvents: 'none',
            zIndex: 5
          }}>
            <Box sx={{ position: 'relative', width: '100%', height: '100%', pointerEvents: 'all' }}>
              <ChangeoverChips
                line={line}
                viewMode={viewMode}
                dayWidth={dayWidth}
                onChangeoverTypeChange={onChangeoverTypeChange}
              />
            </Box>
          </Box>
        )}
      </Box>
      
      {/* Performance Row */}
      {renderBlockRow(performanceBlocks, 'performance', 'Performance')}
      
      {/* Actual Row */}
      {renderBlockRow(actualBlocks, 'actual', 'Actual')}

      {/* Value Stream Summary - only for week/month views */}
      {line.valueStream && viewMode !== 'day' && (
        <Box sx={{ 
          display: 'flex', 
          bgcolor: 'rgba(255,255,255,0.05)',
          borderBottom: '2px solid rgba(1,209,209,0.2)'
        }}>
          <Box sx={{ 
            width: 200, 
            py: 0.5,
            pl: 2,
            borderRight: '1px solid rgba(255,255,255,0.1)'
          }}>
            <Typography variant="caption" sx={{ 
              fontSize: '10px', 
              fontWeight: 600,
              color: '#01D1D1'
            }}>
              Value Stream
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', px: 2 }}>
            <Typography variant="caption" sx={{ fontSize: '10px' }}>
              {line.valueStream}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )
} 