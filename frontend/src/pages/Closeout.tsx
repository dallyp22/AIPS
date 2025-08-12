import { useState } from 'react'
import { 
  Box, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  TextField, 
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Chip,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import { CheckCircle, Warning, Schedule } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface CloseoutLine {
  workcenterId: number
  lineName: string
  plannedUnits: number
  actualUnits: number
  laborUnavailableMinutes: number
  aheadBehindHours: number
  top3Shortfalls: string[]
}

interface CloseoutData {
  date: string
  shiftType: string
  lines: CloseoutLine[]
}

export default function Closeout(){
  const [date] = useState(new Date().toISOString().split('T')[0])
  const [shiftType] = useState('Day')
  const [editedLines, setEditedLines] = useState<{[key: number]: Partial<CloseoutLine>}>({})
  const [showSuccess, setShowSuccess] = useState(false)
  const [showReplanResults, setShowReplanResults] = useState(false)
  const [replanResults, setReplanResults] = useState<any>(null)
  
  const queryClient = useQueryClient()
  
  const { data: closeoutData, isLoading, error } = useQuery({
    queryKey: ['closeout', date, shiftType],
    queryFn: async () => {
      const response = await api.get('/closeout', {
        params: { date, shiftType }
      })
      return response.data as CloseoutData
    }
  })
  
  const saveCloseoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/closeout', data)
      return response.data
    },
    onSuccess: (data) => {
      setReplanResults(data)
      setShowReplanResults(true)
      setShowSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['closeout'] })
    }
  })
  
  const handleInputChange = (workcenterId: number, field: keyof CloseoutLine, value: any) => {
    setEditedLines(prev => ({
      ...prev,
      [workcenterId]: {
        ...prev[workcenterId],
        [field]: field === 'actualUnits' || field === 'laborUnavailableMinutes' ? 
          parseInt(value) || 0 : value
      }
    }))
  }
  
  const handleSaveAndReplan = () => {
    if (!closeoutData) return
    
    const linesToSave = closeoutData.lines.map(line => {
      const edits = editedLines[line.workcenterId] || {}
      return {
        workcenterId: line.workcenterId,
        actualUnits: edits.actualUnits ?? line.actualUnits,
        laborUnavailableMinutes: edits.laborUnavailableMinutes ?? line.laborUnavailableMinutes,
        top3Shortfalls: edits.top3Shortfalls ?? line.top3Shortfalls
      }
    })
    
    saveCloseoutMutation.mutate({
      date,
      shiftType,
      lines: linesToSave
    })
  }
  
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    )
  }
  
  if (error) {
    return (
      <Alert severity="error">
        Failed to load closeout data: {error.toString()}
      </Alert>
    )
  }
  
  const getVarianceColor = (hours: number) => {
    if (Math.abs(hours) <= 0.1) return 'success'
    if (Math.abs(hours) <= 0.5) return 'warning'
    return 'error'
  }
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Shift Closeout - {closeoutData?.date} ({closeoutData?.shiftType} Shift)
      </Typography>
      
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Production Actuals</Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Line</TableCell>
              <TableCell>Planned</TableCell>
              <TableCell>Actual</TableCell>
              <TableCell>Labor Unavail (min)</TableCell>
              <TableCell>Ahead/Behind (h)</TableCell>
              <TableCell>Performance %</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {closeoutData?.lines.map(line => {
              const edits = editedLines[line.workcenterId] || {}
              const actualUnits = edits.actualUnits ?? line.actualUnits
              const laborUnavail = edits.laborUnavailableMinutes ?? line.laborUnavailableMinutes
              const performance = line.plannedUnits > 0 ? 
                Math.round((actualUnits / line.plannedUnits) * 100) : 0
              const aheadBehind = line.plannedUnits > 0 ? 
                ((actualUnits - line.plannedUnits) / (line.plannedUnits / 8)) : 0
              
              return (
                <TableRow key={line.workcenterId}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {line.lineName}
                    </Typography>
                  </TableCell>
                  <TableCell>{line.plannedUnits.toLocaleString()}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={actualUnits}
                      onChange={(e) => handleInputChange(line.workcenterId, 'actualUnits', e.target.value)}
                      sx={{ width: '100px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={laborUnavail}
                      onChange={(e) => handleInputChange(line.workcenterId, 'laborUnavailableMinutes', e.target.value)}
                      sx={{ width: '80px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${aheadBehind >= 0 ? '+' : ''}${aheadBehind.toFixed(1)}h`}
                      size="small"
                      color={getVarianceColor(aheadBehind)}
                      variant={Math.abs(aheadBehind) <= 0.1 ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${performance}%`}
                      size="small"
                      color={performance >= 95 ? 'success' : performance >= 85 ? 'warning' : 'error'}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        
        <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            onClick={handleSaveAndReplan}
            disabled={saveCloseoutMutation.isPending}
            startIcon={saveCloseoutMutation.isPending ? <CircularProgress size={16} /> : <Schedule />}
          >
            Save & Re‑plan
          </Button>
        </Box>
      </Paper>
      
      {showReplanResults && replanResults && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom color="success.main">
            <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
            Re-planning Complete
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Schedule Adjustments
                  </Typography>
                  <List dense>
                    {replanResults.adjustedLines?.map((line: any, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Warning color={line.replanAction !== 'No change' ? 'warning' : 'success'} />
                        </ListItemIcon>
                        <ListItemText
                          primary={`Line ${index + 1}`}
                          secondary={line.replanAction}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Next Actions
                  </Typography>
                  <List dense>
                    {replanResults.nextActions?.map((action: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <CheckCircle color="success" />
                        </ListItemIcon>
                        <ListItemText primary={action} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      <Snackbar
        open={showSuccess}
        autoHideDuration={4000}
        onClose={() => setShowSuccess(false)}
        message="Closeout saved successfully! Schedule has been adjusted."
      />
    </Box>
  )
}
