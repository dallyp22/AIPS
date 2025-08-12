import React, { useState } from 'react'
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
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Avatar,
  LinearProgress
} from '@mui/material'
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface OperatorDialogProps {
  open: boolean
  onClose: () => void
  operator?: any
}

function OperatorDialog({ open, onClose, operator }: OperatorDialogProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: '',
    departmentId: '',
    basePayRate: '',
    emergencyContact: ''
  })
  
  // Update form data when operator changes
  React.useEffect(() => {
    if (operator) {
      setFormData({
        employeeId: operator.employeeId || '',
        firstName: operator.firstName || '',
        lastName: operator.lastName || '',
        email: operator.email || '',
        phone: operator.phone || '',
        hireDate: operator.hireDate ? new Date(operator.hireDate).toISOString().split('T')[0] : '',
        departmentId: operator.departmentId || '',
        basePayRate: operator.basePayRate || '',
        emergencyContact: operator.emergencyContact || ''
      })
    } else {
      setFormData({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        hireDate: '',
        departmentId: '',
        basePayRate: '',
        emergencyContact: ''
      })
    }
  }, [operator, open])

  const queryClient = useQueryClient()

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await api.get('/workcenters') // Get workcenters to extract departments
      const workcenters = response.data
      const uniqueDepts = Array.from(new Set(workcenters.map((wc: any) => wc.department?.name)))
        .filter(Boolean)
        .map((name, index) => ({ id: index + 1, name }))
      return uniqueDepts
    }
  })

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        hireDate: new Date(data.hireDate).toISOString(),
        departmentId: data.departmentId || null,
        basePayRate: data.basePayRate ? parseFloat(data.basePayRate) : null
      }
      
      if (operator) {
        const response = await api.patch(`/operators/${operator.id}`, payload)
        return response.data
      } else {
        const response = await api.post('/operators', payload)
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operators'] })
      onClose()
    }
  })

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    saveMutation.mutate(formData)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {operator ? 'Edit Operator' : 'Add New Operator'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Employee ID"
              value={formData.employeeId}
              onChange={(e) => handleChange('employeeId', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId}
                onChange={(e) => handleChange('departmentId', e.target.value)}
                label="Department"
              >
                <MenuItem value="">None</MenuItem>
                {departments?.map((dept: any) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Hire Date"
              type="date"
              value={formData.hireDate}
              onChange={(e) => handleChange('hireDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Base Pay Rate"
              type="number"
              value={formData.basePayRate}
              onChange={(e) => handleChange('basePayRate', e.target.value)}
              inputProps={{ step: 0.25, min: 0 }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Emergency Contact"
              value={formData.emergencyContact}
              onChange={(e) => handleChange('emergencyContact', e.target.value)}
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={saveMutation.isPending || !formData.employeeId || !formData.firstName || !formData.lastName}
        >
          {operator ? 'Update' : 'Add'} Operator
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function OperatorManagement() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOperator, setSelectedOperator] = useState<any>(null)

  const { data: operators, isLoading } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await api.get('/operators')
      return response.data
    }
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading operators...</Typography>
      </Box>
    )
  }

  if (!operators) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography color="error">No operator data available. Please check the API connection.</Typography>
      </Box>
    )
  }

  const handleAddOperator = () => {
    setSelectedOperator(null)
    setDialogOpen(true)
  }

  const handleEditOperator = (operator: any) => {
    setSelectedOperator(operator)
    setDialogOpen(true)
  }

  const getCompetencyStats = (operator: any) => {
    const competencies = operator.competencies || []
    const total = competencies.length
    const certified = competencies.filter((c: any) => c.skill.isCertification && c.certifiedAt).length
    const highLevel = competencies.filter((c: any) => c.level >= 4).length
    
    return { total, certified, highLevel }
  }

  const getOperatorInitials = (operator: any) => {
    return `${operator.firstName[0]}${operator.lastName[0]}`
  }

  const getAvatarColor = (employeeId: string) => {
    const colors = ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#00796b']
    const index = employeeId.charCodeAt(0) % colors.length
    return colors[index]
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Operator Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddOperator}
          sx={{ bgcolor: '#01D1D1', '&:hover': { bgcolor: '#00B8B8' } }}
        >
          Add Operator
        </Button>
      </Box>

      {/* Operators Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(1,209,209,0.1)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Operator</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Competencies</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Current Shifts</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Pay Rate</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Hire Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {operators?.map((operator: any) => {
              const stats = getCompetencyStats(operator)
              return (
                <TableRow 
                  key={operator.id}
                  sx={{ '&:hover': { backgroundColor: 'rgba(1,209,209,0.02)' } }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: getAvatarColor(operator.employeeId),
                        width: 40,
                        height: 40
                      }}>
                        {getOperatorInitials(operator)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {operator.firstName} {operator.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {operator.employeeId}
                        </Typography>
                        {operator.email && (
                          <Typography variant="caption" color="text.secondary">
                            {operator.email}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {operator.department ? (
                      <Chip
                        label={operator.department.name}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#01D1D1', color: '#01D1D1' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Box sx={{ minWidth: 200 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <BadgeIcon sx={{ fontSize: 16, color: '#01D1D1' }} />
                        <Typography variant="body2">
                          {stats.total} skills
                        </Typography>
                        {stats.certified > 0 && (
                          <Chip 
                            label={`${stats.certified} certified`}
                            size="small"
                            color="success"
                            sx={{ height: 20, fontSize: '10px' }}
                          />
                        )}
                      </Box>
                      
                      {stats.total > 0 && (
                        <Box sx={{ mb: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Skill Level Distribution
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={(stats.highLevel / stats.total) * 100}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: stats.highLevel / stats.total > 0.5 ? '#4CAF50' : '#FF9800'
                              }
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {stats.highLevel} advanced/expert
                          </Typography>
                        </Box>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {operator.competencies?.slice(0, 3).map((comp: any, index: number) => (
                          <Chip
                            key={index}
                            label={`${comp.skill.name} (L${comp.level})`}
                            size="small"
                            sx={{ 
                              fontSize: '10px',
                              height: 20,
                              backgroundColor: 'rgba(1,209,209,0.1)',
                              color: '#01D1D1'
                            }}
                          />
                        ))}
                        {operator.competencies?.length > 3 && (
                          <Chip
                            label={`+${operator.competencies.length - 3}`}
                            size="small"
                            sx={{ fontSize: '10px', height: 20 }}
                          />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    {operator.shiftAssignments?.length > 0 ? (
                      <Box>
                        {operator.shiftAssignments.map((assignment: any, index: number) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ScheduleIcon sx={{ fontSize: 14, color: '#01D1D1' }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {assignment.workcenter.name}
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              {assignment.shiftPattern.name} • {assignment.role}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No assignments
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {operator.basePayRate ? (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${operator.basePayRate.toFixed(2)}/hr
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not set
                      </Typography>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(operator.hireDate).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {Math.floor((Date.now() - new Date(operator.hireDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip title="Edit Operator">
                      <IconButton
                        size="small"
                        onClick={() => handleEditOperator(operator)}
                        sx={{ color: '#01D1D1' }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Dialog */}
      <OperatorDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        operator={selectedOperator}
      />
    </Box>
  )
}
