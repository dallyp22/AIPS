import { useState } from 'react'
import { 
  Box, 
  Paper, 
  Table, 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Alert
} from '@mui/material'
import { Add as AddIcon, Schedule as ScheduleIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface AssignmentDialogProps {
  open: boolean
  onClose: () => void
}

function AssignmentDialog({ open, onClose }: AssignmentDialogProps) {
  const [formData, setFormData] = useState({
    operatorId: '',
    workcenterId: '',
    shiftPatternId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    role: 'Operator',
    payRate: '',
    notes: ''
  })

  const queryClient = useQueryClient()

  const { data: operators } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await api.get('/operators')
      return response.data
    }
  })

  const { data: workcenters } = useQuery({
    queryKey: ['workcenters'],
    queryFn: async () => {
      const response = await api.get('/workcenters')
      return response.data
    }
  })

  const { data: shiftPatterns } = useQuery({
    queryKey: ['shift-patterns'],
    queryFn: async () => {
      const response = await api.get('/shift-patterns')
      return response.data
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        operatorId: parseInt(data.operatorId),
        workcenterId: parseInt(data.workcenterId),
        shiftPatternId: parseInt(data.shiftPatternId),
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        payRate: data.payRate ? parseFloat(data.payRate) : null
      }
      const response = await api.post('/shift-assignments', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shift-assignments'] })
      onClose()
      setFormData({
        operatorId: '',
        workcenterId: '',
        shiftPatternId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        role: 'Operator',
        payRate: '',
        notes: ''
      })
    }
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  const roles = ['Operator', 'Lead', 'Mechanic', 'Quality', 'Supervisor']

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Add Shift Assignment</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Operator</InputLabel>
              <Select
                value={formData.operatorId}
                onChange={(e) => handleChange('operatorId', e.target.value)}
                label="Operator"
              >
                {operators?.map((op: any) => (
                  <MenuItem key={op.id} value={op.id}>
                    {op.firstName} {op.lastName} ({op.employeeId})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Workcenter</InputLabel>
              <Select
                value={formData.workcenterId}
                onChange={(e) => handleChange('workcenterId', e.target.value)}
                label="Workcenter"
              >
                {workcenters?.map((wc: any) => (
                  <MenuItem key={wc.id} value={wc.id}>
                    {wc.displayTitle || wc.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Shift Pattern</InputLabel>
              <Select
                value={formData.shiftPatternId}
                onChange={(e) => handleChange('shiftPatternId', e.target.value)}
                label="Shift Pattern"
              >
                {shiftPatterns?.map((pattern: any) => (
                  <MenuItem key={pattern.id} value={pattern.id}>
                    {pattern.name} ({pattern.startTime} - {pattern.endTime})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                label="Role"
              >
                {roles.map(role => (
                  <MenuItem key={role} value={role}>{role}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for ongoing assignment"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pay Rate"
              type="number"
              value={formData.payRate}
              onChange={(e) => handleChange('payRate', e.target.value)}
              inputProps={{ step: 0.25, min: 0 }}
              helperText="Override default pay rate"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </Grid>
        </Grid>
        
        {saveMutation.error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(saveMutation.error as any)?.response?.data?.message || 'Failed to create assignment'}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={saveMutation.isPending || !formData.operatorId || !formData.workcenterId || !formData.shiftPatternId}
        >
          Add Assignment
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function ShiftAssignments() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [workcenterFilter, setWorkcenterFilter] = useState('')

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['shift-assignments', workcenterFilter],
    queryFn: async () => {
      const params = workcenterFilter ? { workcenterId: workcenterFilter } : {}
      const response = await api.get('/shift-assignments', { params })
      return response.data
    }
  })

  const { data: workcenters } = useQuery({
    queryKey: ['workcenters'],
    queryFn: async () => {
      const response = await api.get('/workcenters')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading shift assignments...</Typography>
      </Box>
    )
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Lead': return '#9C27B0'
      case 'Mechanic': return '#FF9800'
      case 'Quality': return '#4CAF50'
      case 'Supervisor': return '#F44336'
      default: return '#2196F3'
    }
  }

  const formatShiftTime = (pattern: any) => {
    return `${pattern.startTime} - ${pattern.endTime} (${pattern.hoursPerShift}h)`
  }

  const isActiveAssignment = (assignment: any) => {
    const now = new Date()
    const start = new Date(assignment.startDate)
    const end = assignment.endDate ? new Date(assignment.endDate) : null
    
    return start <= now && (!end || end >= now) && assignment.isActive
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Shift Assignments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: '#01D1D1', '&:hover': { bgcolor: '#00B8B8' } }}
        >
          Add Assignment
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Workcenter</InputLabel>
          <Select
            value={workcenterFilter}
            onChange={(e) => setWorkcenterFilter(e.target.value as string)}
            label="Workcenter"
          >
            <MenuItem value="">All Workcenters</MenuItem>
            {workcenters?.map((wc: any) => (
              <MenuItem key={wc.id} value={wc.id}>
                {wc.displayTitle || wc.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary">
          {assignments?.length || 0} assignments • {assignments?.filter(isActiveAssignment).length || 0} active
        </Typography>
      </Box>

      {/* Assignments Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(1,209,209,0.1)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Operator</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Workcenter</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Shift Pattern</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Period</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pay Rate</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments?.map((assignment: any) => {
              const active = isActiveAssignment(assignment)
              return (
                <TableRow 
                  key={assignment.id}
                  sx={{ 
                    '&:hover': { backgroundColor: 'rgba(1,209,209,0.02)' },
                    opacity: active ? 1 : 0.7
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {assignment.operator.firstName} {assignment.operator.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assignment.operator.employeeId}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScheduleIcon sx={{ fontSize: 16, color: '#01D1D1' }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {assignment.workcenter.displayTitle || assignment.workcenter.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {assignment.shiftPattern.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatShiftTime(assignment.shiftPattern)}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={assignment.role}
                      size="small"
                      sx={{ 
                        backgroundColor: getRoleColor(assignment.role),
                        color: '#fff',
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {new Date(assignment.startDate).toLocaleDateString()}
                      </Typography>
                      {assignment.endDate ? (
                        <Typography variant="body2" color="text.secondary">
                          to {new Date(assignment.endDate).toLocaleDateString()}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Ongoing
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {assignment.payRate ? (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${assignment.payRate.toFixed(2)}/hr
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Default rate
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={active ? 'Active' : 'Inactive'}
                      size="small"
                      color={active ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Add Dialog */}
      <AssignmentDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  )
}
