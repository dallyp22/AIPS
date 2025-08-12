import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material'
import type { DayHeader, ViewMode } from '../types/board'

interface ScheduleHeaderProps {
  headers: DayHeader[]
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  weekStart: string
}

const formatNumber = (num: number) => {
  if (num >= 1000) return `${(num/1000).toFixed(1)}k`
  return num.toString()
}

const generateHourLabels = () => {
  const hours = []
  for (let i = 0; i < 24; i++) {
    const hour12 = i === 0 ? 12 : i > 12 ? i - 12 : i
    const ampm = i < 12 ? 'AM' : 'PM'
    hours.push(`${hour12}${ampm}`)
  }
  return hours
}

export default function ScheduleHeader({ 
  headers, 
  viewMode, 
  onViewModeChange, 
  weekStart 
}: ScheduleHeaderProps) {
  const dayWidth = viewMode === 'day' ? 60 : viewMode === 'week' ? 160 : 100 // Smaller width for hourly view
  const hourLabels = generateHourLabels()

  return (
    <Box>
      {/* View Mode Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: 'Montserrat, Inter, sans-serif' }}>
          {viewMode === 'day' ? 'Daily Schedule (Hourly View)' : 'Monthly Totals (Units/OEE)'}
        </Typography>
        <ToggleButtonGroup
          value={viewMode}
          exclusive
          onChange={(_, value) => value && onViewModeChange(value)}
          size="small"
        >
          <ToggleButton value="day">Day</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
          <ToggleButton value="month">Month</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Day View - Hour Grid Header */}
      {viewMode === 'day' && (
        <Box>
          {/* Date Header for Day View */}
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'rgba(255,255,255,0.05)', 
            borderBottom: '1px solid rgba(1,209,209,0.2)',
            py: 1
          }}>
            <Box sx={{ width: 200, pl: 2, fontWeight: 600 }}>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Box>
            <Box sx={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '12px' }}>
                24-Hour Production Schedule
              </Typography>
            </Box>
          </Box>

          {/* Hour Labels */}
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'rgba(255,255,255,0.08)', 
            borderBottom: '2px solid rgba(1,209,209,0.3)',
            py: 0.5
          }}>
            <Box sx={{ width: 200, pl: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '10px' }}>
                Time Periods
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flex: 1 }}>
              {hourLabels.map((hour, i) => (
                <Box key={i} sx={{ 
                  width: dayWidth, 
                  textAlign: 'center',
                  borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  px: 0.5
                }}>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 600, 
                    fontSize: '9px',
                    color: i >= 6 && i <= 18 ? '#4CAF50' : '#FF9800' // Green for day shift, orange for night
                  }}>
                    {hour}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Week Header */}
      {viewMode === 'week' && (
        <Box sx={{ 
          display: 'flex', 
          bgcolor: 'rgba(255,255,255,0.05)', 
          borderBottom: '1px solid rgba(1,209,209,0.2)',
          py: 1
        }}>
          <Box sx={{ width: 200, pl: 2, fontWeight: 600 }}>
            Week of {weekStart}
          </Box>
          <Box sx={{ display: 'flex', flex: 1 }}>
            {headers.map((header, i) => (
              <Box key={i} sx={{ 
                width: dayWidth, 
                textAlign: 'center',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}>
                <Box sx={{ fontWeight: 600, fontSize: '12px' }}>
                  OEE +{header.oee}%
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {/* Day Headers - Only for Week/Month views */}
      {viewMode !== 'day' && (
        <Box sx={{ 
          display: 'flex', 
          bgcolor: 'rgba(255,255,255,0.08)', 
          borderBottom: '2px solid rgba(1,209,209,0.3)',
          py: 1
        }}>
          <Box sx={{ width: 200, pl: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {viewMode === 'month' ? 'Month:' : 'Batch/Units'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.7 }}>
              {viewMode === 'month' ? new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'to Monitor'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flex: 1 }}>
            {headers.map((header, i) => (
              <Box key={i} sx={{ 
                width: dayWidth, 
                textAlign: 'center',
                borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                px: 1
              }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '11px' }}>
                  {viewMode === 'week' ? `W${i+1}` : new Date(header.date).getDate()}
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontSize: '10px', 
                  display: 'block',
                  color: header.actualUnits >= header.plannedUnits ? '#4CAF50' : '#FF9800'
                }}>
                  {formatNumber(header.actualUnits)}/{formatNumber(header.plannedUnits)}
                </Typography>
                <Typography variant="caption" sx={{ 
                  fontSize: '9px', 
                  display: 'block',
                  opacity: 0.8
                }}>
                  {header.oee}%
                </Typography>
              </Box>
            ))}
            <Box sx={{ 
              width: dayWidth, 
              textAlign: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              fontWeight: 600,
              fontSize: '11px'
            }}>
              Week
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
} 