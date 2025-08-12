import { useState, useMemo } from 'react'
import { Box, CircularProgress, Alert, Snackbar } from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragEndEvent } from '@dnd-kit/core'
import { api } from '../api/client'
import ScheduleHeader from '../board/ScheduleHeader'
import ProductionLine from '../board/ProductionLine'
import { packLineAbutting } from '../board/packAbut'
import type { BoardState, ViewMode, OrderBlock, Changeover } from '../types/board'



export default function ScheduleBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  const [changeoverTypes, setChangeoverTypes] = useState<Map<string, string>>(new Map())
  
  const queryClient = useQueryClient()
  
  // Fetch real data from backend
  const { data: rawBoardData, isLoading, error } = useQuery({
    queryKey: ['schedule-board', viewMode, date],
    queryFn: async () => {
      const response = await api.get('/schedule/board', {
        params: { viewMode, date }
      })
      return response.data as BoardState
    },
    refetchInterval: 30000, // Refresh every 30 seconds for real-time feel
  })

  // Apply abutment logic to ensure proper scheduling
  const boardData = useMemo(() => {
    if (!rawBoardData) return null
    
    const packedData = {
      ...rawBoardData,
      lines: rawBoardData.lines.map(line => {
        // Only pack 'plan' blocks, keep performance and actual as-is
        const planBlocks = line.blocks.filter(b => b.blockType === 'plan')
        const otherBlocks = line.blocks.filter(b => b.blockType !== 'plan')
        
        // Create changeover type map for this line
        const coByKey = new Map<string, Changeover>()
        line.changeovers?.forEach(co => {
          if (co.typeCode) {
            coByKey.set(`${co.fromBlockId}->${co.toBlockId}`, co)
          }
        })
        
        // Pack the plan blocks with abutment logic
        const { blocks: packedBlocks, changeovers } = packLineAbutting(planBlocks, coByKey)
        
        // Update performance and actual blocks to match plan block positions
        const updatedOtherBlocks = otherBlocks.map(block => {
          const correspondingPlan = packedBlocks.find(p => 
            p.id.replace(/^P-/, '') === block.id.replace(/^(PF|A)-/, '')
          )
          if (correspondingPlan) {
            return {
              ...block,
              startMin: correspondingPlan.startMin,
              durationMin: correspondingPlan.durationMin
            }
          }
          return block
        })
        
        return {
          ...line,
          blocks: [...packedBlocks, ...updatedOtherBlocks],
          changeovers: changeovers
        }
      })
    }
    
    return packedData
  }, [rawBoardData, changeoverTypes])

  // Mutation for saving board changes
  const saveBoardMutation = useMutation({
    mutationFn: async (updatedBoardData: BoardState) => {
      // Validate abutment before saving
      let hasGaps = false
      let hasOverlaps = false
      
      updatedBoardData.lines.forEach(line => {
        const planBlocks = line.blocks
          .filter(b => b.blockType === 'plan')
          .sort((a, b) => a.startMin - b.startMin)
        
        for (let i = 0; i < planBlocks.length - 1; i++) {
          const current = planBlocks[i]
          const next = planBlocks[i + 1]
          const currentEnd = current.startMin + current.durationMin
          
          // Find changeover between these blocks
          const changeover = line.changeovers?.find(co => 
            co.fromBlockId === current.id && co.toBlockId === next.id
          )
          const coMinutes = changeover?.minutes || 20 // Default 20 minutes
          
          const expectedNextStart = currentEnd + coMinutes
          
          if (next.startMin > expectedNextStart + 5) {
            hasGaps = true
          } else if (next.startMin < expectedNextStart - 5) {
            hasOverlaps = true
          }
        }
      })
      
      // Show warnings for abutment issues
      if (hasGaps || hasOverlaps) {
        const message = hasGaps && hasOverlaps 
          ? 'Schedule has gaps and overlaps. Auto-correcting...'
          : hasGaps 
          ? 'Schedule has gaps between orders. Auto-correcting...'
          : 'Schedule has overlaps. Auto-correcting...'
        
        setSnackbar({ open: true, message, severity: 'warning' })
      }
      
      // Convert to backend format for saving
      const savePayload = {
        lanes: updatedBoardData.lines.map(line => ({
          workcenterId: parseInt(line.lineId.replace(/\D/g, '')) || 1,
          blocks: line.blocks.filter(b => b.blockType === 'plan').map(block => ({
            id: parseInt(block.id.replace(/\D/g, '')) || undefined,
            orderId: 1, // Simplified for now
            startAt: new Date(date + 'T' + Math.floor(block.startMin / 60).toString().padStart(2, '0') + ':' + (block.startMin % 60).toString().padStart(2, '0') + ':00Z'),
            endAt: new Date(date + 'T' + Math.floor((block.startMin + block.durationMin) / 60).toString().padStart(2, '0') + ':' + ((block.startMin + block.durationMin) % 60).toString().padStart(2, '0') + ':00Z')
          })),
          changeovers: line.changeovers?.map(co => ({
            fromBlockId: parseInt(co.fromBlockId.replace(/\D/g, '')) || 0,
            toBlockId: parseInt(co.toBlockId.replace(/\D/g, '')) || 0,
            typeCode: co.typeCode || 'B',
            plannedMinutes: co.minutes
          })) || []
        }))
      }
      
      const response = await api.post('/schedule/board', savePayload)
      return response.data
    },
    onSuccess: () => {
      setSnackbar({ open: true, message: 'Schedule saved with abutment enforcement!', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['schedule-board'] })
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to save schedule changes', severity: 'error' })
    }
  })
  
  const dayWidth = viewMode === 'day' ? 60 : viewMode === 'week' ? 160 : 100
  const daysCount = boardData?.headers.length || 0

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleChangeoverTypeChange = (fromBlockId: string, toBlockId: string, typeCode: string) => {
    const key = `${fromBlockId}->${toBlockId}`
    setChangeoverTypes(prev => new Map(prev.set(key, typeCode)))
    
    // Re-trigger abutment calculation with new changeover type
    if (boardData) {
      const updatedBoardData = {
        ...boardData,
        lines: boardData.lines.map(line => ({
          ...line,
          changeovers: line.changeovers?.map(co => 
            co.fromBlockId === fromBlockId && co.toBlockId === toBlockId
              ? { ...co, typeCode }
              : co
          ) || []
        }))
      }
      // Note: This will trigger useMemo to recalculate abutment
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over || !boardData) return
    
    const draggedBlock = active.data.current?.block as OrderBlock
    if (!draggedBlock || draggedBlock.blockType !== 'plan') return

    // Parse drop zone ID to get line, time slot, and row type
    const dropZoneId = over.id as string
    const [dropLineId, dropTimeSlot, dropRowType] = dropZoneId.split(':')
    
    if (!dropLineId || !dropTimeSlot || dropRowType !== 'plan') return

    const newStartMin = viewMode === 'day' ? 
      parseInt(dropTimeSlot) * 60 : // Hour slot for day view
      parseInt(dropTimeSlot) * 24 * 60 // Day slot for week/month view

    // Create temporary board data with the moved block
    const tempBoardData = {
      ...boardData,
      lines: boardData.lines.map(line => ({
        ...line,
        blocks: line.blocks.map(block => {
          // Update all block types (plan, performance, actual) for this order
          const baseBlockId = block.id.replace(/^[A-Z]+-/, '')
          const draggedBaseId = draggedBlock.id.replace(/^[A-Z]+-/, '')
          
          if (baseBlockId === draggedBaseId) {
            return { ...block, lineId: dropLineId, startMin: newStartMin }
          }
          return block
        })
      }))
    }

    // Apply abutment logic to the affected lines
    const updatedBoardData = {
      ...tempBoardData,
      lines: tempBoardData.lines.map(line => {
        // Only repack lines that might be affected
        const draggedFromThisLine = draggedBlock.lineId === line.lineId
        const draggedToThisLine = dropLineId === line.lineId
        
        if (draggedFromThisLine || draggedToThisLine) {
          const planBlocks = line.blocks.filter(b => b.blockType === 'plan')
          const otherBlocks = line.blocks.filter(b => b.blockType !== 'plan')
          
          // Create changeover type map for this line
          const coByKey = new Map<string, Changeover>()
          line.changeovers?.forEach(co => {
            if (co.typeCode) {
              coByKey.set(`${co.fromBlockId}->${co.toBlockId}`, co)
            }
          })
          
          // Apply changeover types from state
          changeoverTypes.forEach((typeCode, key) => {
            const [fromId, toId] = key.split('->')
            const existingCo = coByKey.get(key)
            if (existingCo) {
              coByKey.set(key, { ...existingCo, typeCode: typeCode as 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J' })
            }
          })
          
          // Pack the blocks with abutment logic
          const { blocks: packedBlocks, changeovers } = packLineAbutting(planBlocks, coByKey)
          
          // Update performance and actual blocks to match plan positions
          const updatedOtherBlocks = otherBlocks.map(block => {
            const correspondingPlan = packedBlocks.find(p => 
              p.id.replace(/^P-/, '') === block.id.replace(/^(PF|A)-/, '')
            )
            if (correspondingPlan) {
              return {
                ...block,
                startMin: correspondingPlan.startMin,
                durationMin: correspondingPlan.durationMin
              }
            }
            return block
          })
          
          return {
            ...line,
            blocks: [...packedBlocks, ...updatedOtherBlocks],
            changeovers: changeovers
          }
        }
        
        return line
      })
    }

    // Save changes with abutment enforcement
    saveBoardMutation.mutate(updatedBoardData)
  }

  const handleDurationChange = (blockId: string, newDuration: number) => {
    if (!boardData) return

    // Update the board data with the new duration
    const updatedBoardData = {
      ...boardData,
      lines: boardData.lines.map(line => ({
        ...line,
        blocks: line.blocks.map(block => {
          // Update all block types (plan, performance, actual) for this order
          const baseBlockId = block.id.replace(/^[A-Z]+-/, '').replace(/^[A-Z]+-/, '')
          const targetBaseId = blockId.replace(/^[A-Z]+-/, '').replace(/^[A-Z]+-/, '')
          
          if (baseBlockId === targetBaseId) {
            return { ...block, durationMin: newDuration }
          }
          return block
        })
      }))
    }

    // Save changes
    saveBoardMutation.mutate(updatedBoardData)
  }

  if (isLoading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress sx={{ color: '#01D1D1' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load schedule data. Please check your connection and try again.
        </Alert>
      </Box>
    )
  }

  if (!boardData) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          No schedule data available.
        </Alert>
      </Box>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <Box sx={{ 
        bgcolor: 'rgba(0,0,0,0.2)', 
        minHeight: '100vh',
        p: 2,
        fontFamily: 'Inter, sans-serif',
        overflowX: viewMode === 'day' ? 'auto' : 'visible'
      }}>
        <ScheduleHeader
          headers={boardData.headers}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          weekStart={boardData.weekStart}
        />
        
        <Box sx={{ 
          border: '1px solid rgba(1,209,209,0.3)',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'rgba(0,0,0,0.1)',
          minWidth: viewMode === 'day' ? '1600px' : 'auto'
        }}>
          {boardData.lines.map((line) => (
                                    <ProductionLine
                          key={line.lineId}
                          line={line}
                          viewMode={viewMode}
                          dayWidth={dayWidth}
                          daysCount={daysCount}
                          isDraggable={true}
                          onDurationChange={handleDurationChange}
                          onChangeoverTypeChange={handleChangeoverTypeChange}
                        />
          ))}
        </Box>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          message={snackbar.message}
          sx={{
            '& .MuiSnackbarContent-root': {
              backgroundColor: snackbar.severity === 'success' ? '#4CAF50' : '#F44336',
              color: '#FFFFFF'
            }
          }}
        />
      </Box>
    </DndContext>
  )
}
