import { Box, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert, Chip } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

interface ChangeoverType {
  code: string
  minutes: number
  includeInOee: boolean
  notes?: string
}

interface EventType {
  code: string
  label: string
  planned: boolean
  includeInOee: boolean
}

export default function Changeovers(){
  const { data: changeoverData, isLoading: loadingChangeovers, error: changeoverError } = useQuery({
    queryKey: ['changeover-types'],
    queryFn: async () => {
      const response = await api.get('/changeover-types')
      return response.data as { types: ChangeoverType[] }
    }
  })

  const { data: eventData, isLoading: loadingEvents, error: eventError } = useQuery({
    queryKey: ['event-types'],
    queryFn: async () => {
      const response = await api.get('/event-types')
      return response.data as { eventTypes: EventType[] }
    }
  })

  const getComplexityColor = (minutes: number) => {
    if (minutes <= 30) return '#4CAF50' // Green for low complexity
    if (minutes <= 60) return '#FF9800' // Orange for medium complexity
    if (minutes <= 90) return '#FF5722' // Deep orange for high complexity
    return '#F44336' // Red for extreme complexity
  }

  if (loadingChangeovers || loadingEvents) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }

  if (changeoverError || eventError) {
    return (
      <Alert severity="error">
        Failed to load changeover data: {(changeoverError || eventError)?.toString()}
      </Alert>
    )
  }

  return (
    <Box>
      <Paper sx={{ p:2, mb:2 }}>
        <b>Changeover Types (A–J)</b>
        <Table size="small" sx={{ mt:1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Minutes</TableCell>
              <TableCell>Complexity</TableCell>
              <TableCell>Include in OEE?</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {changeoverData?.types.map(t => (
              <TableRow key={t.code}>
                <TableCell>
                  <Chip 
                    label={t.code} 
                    size="small" 
                    sx={{ 
                      bgcolor: getComplexityColor(t.minutes),
                      color: 'white',
                      fontWeight: 'bold',
                      minWidth: '32px'
                    }}
                  />
                </TableCell>
                <TableCell>{t.minutes}</TableCell>
                <TableCell>
                  <Chip 
                    label={
                      t.minutes <= 30 ? 'Low' :
                      t.minutes <= 60 ? 'Medium' :
                      t.minutes <= 90 ? 'High' : 'Extreme'
                    }
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: getComplexityColor(t.minutes),
                      color: getComplexityColor(t.minutes)
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={t.includeInOee ? 'Yes' : 'No'}
                    size="small"
                    color={t.includeInOee ? 'success' : 'default'}
                    variant={t.includeInOee ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>{t.notes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <Paper sx={{ p:2 }}>
        <b>Additional Event Types</b>
        <Table size="small" sx={{ mt:1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Event</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Planned?</TableCell>
              <TableCell>Include in OEE?</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {eventData?.eventTypes.map(e => (
              <TableRow key={e.code}>
                <TableCell>{e.label}</TableCell>
                <TableCell>
                  <Chip 
                    label={e.code}
                    size="small"
                    color={e.planned ? 'primary' : 'warning'}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={e.planned ? 'Yes' : 'No'}
                    size="small"
                    color={e.planned ? 'success' : 'warning'}
                    variant={e.planned ? 'filled' : 'outlined'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={e.includeInOee ? 'Yes' : 'No'}
                    size="small"
                    color={e.includeInOee ? 'success' : 'default'}
                    variant={e.includeInOee ? 'filled' : 'outlined'}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  )
}
