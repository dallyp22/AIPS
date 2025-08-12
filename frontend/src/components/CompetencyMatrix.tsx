import { useState, useEffect } from 'react'
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid
} from '@mui/material'
import { 
  Edit as EditIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Star as StarIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface CompetencyEditDialogProps {
  open: boolean
  onClose: () => void
  operator: any
  skill: any
  currentCompetency?: any
}

function CompetencyEditDialog({ open, onClose, operator, skill, currentCompetency }: CompetencyEditDialogProps) {
  const [level, setLevel] = useState(currentCompetency?.level || 1)
  const [notes, setNotes] = useState(currentCompetency?.notes || '')
  const [certifiedBy, setCertifiedBy] = useState(currentCompetency?.certifiedBy || '')
  
  const queryClient = useQueryClient()
  
  // Don't render anything if dialog is closed or missing required props
  if (!open || !operator || !skill) {
    return null
  }
  
  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open && operator && skill) {
      setLevel(currentCompetency?.level || 1)
      setNotes(currentCompetency?.notes || '')
      setCertifiedBy(currentCompetency?.certifiedBy || '')
    }
  }, [open, currentCompetency, operator, skill])
  
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (currentCompetency) {
        const response = await api.patch(`/competencies/${currentCompetency.id}`, data)
        return response.data
      } else {
        const response = await api.post('/competencies', {
          operatorId: operator.id,
          skillId: skill.id,
          ...data
        })
        return response.data
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competency-matrix'] })
      onClose()
    }
  })

  const handleSave = () => {
    const data: any = { level, notes }
    
    if (skill.isCertification) {
      data.certifiedAt = new Date().toISOString()
      data.certifiedBy = certifiedBy || 'System'
      
      if (skill.expiryMonths) {
        const expiresAt = new Date()
        expiresAt.setMonth(expiresAt.getMonth() + skill.expiryMonths)
        data.expiresAt = expiresAt.toISOString()
      }
    }
    
    updateMutation.mutate(data)
  }

  const skillLevels = [
    { value: 1, label: 'Novice', description: 'Learning the basics' },
    { value: 2, label: 'Basic', description: 'Can perform with supervision' },
    { value: 3, label: 'Proficient', description: 'Can perform independently' },
    { value: 4, label: 'Advanced', description: 'Can train others' },
    { value: 5, label: 'Expert', description: 'Subject matter expert' }
  ]

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Edit Competency: {operator.firstName} {operator.lastName} - {skill.name}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Skill Level</InputLabel>
              <Select
                value={level}
                onChange={(e) => setLevel(e.target.value as number)}
                label="Skill Level"
              >
                {skillLevels.map((lvl) => (
                  <MenuItem key={lvl.value} value={lvl.value}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        Level {lvl.value} - {lvl.label}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {lvl.description}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {skill.isCertification && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Certified By"
                value={certifiedBy}
                onChange={(e) => setCertifiedBy(e.target.value)}
                helperText="Who provided the certification"
              />
            </Grid>
          )}
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              helperText="Additional comments or observations"
            />
          </Grid>
          
          {skill.isCertification && skill.expiryMonths && (
            <Grid item xs={12}>
              <Alert severity="info">
                This certification will expire in {skill.expiryMonths} months and will need renewal.
              </Alert>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={updateMutation.isPending}
        >
          {currentCompetency ? 'Update' : 'Add'} Competency
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function CompetencyMatrix() {
  const [selectedWorkcenter, setSelectedWorkcenter] = useState<number | ''>('')
  const [editDialog, setEditDialog] = useState<{
    open: boolean
    operator?: any
    skill?: any
    competency?: any
  }>({ open: false })

  // Fetch data
  const { data: matrixData, isLoading } = useQuery({
    queryKey: ['competency-matrix', selectedWorkcenter],
    queryFn: async () => {
      const params = selectedWorkcenter ? { workcenterId: selectedWorkcenter } : {}
      const response = await api.get('/competency-matrix', { params })
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
        <Typography>Loading competency matrix...</Typography>
      </Box>
    )
  }

  if (!matrixData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography color="error">No data available. Please check the API connection.</Typography>
      </Box>
    )
  }

  const operators = matrixData?.operators || []
  const skills = matrixData?.skills || []
  const skillRequirements = matrixData?.skillRequirements || []

  const getOperatorCompetency = (operatorId: number, skillId: number) => {
    const operator = operators.find((op: any) => op.id === operatorId)
    return operator?.competencies.find((comp: any) => comp.skillId === skillId)
  }

  const getSkillRequirement = (skillId: number) => {
    return skillRequirements.find((req: any) => req.skillId === skillId)
  }

  const getLevelColor = (level: number, isExpired: boolean = false) => {
    if (isExpired) return '#F44336'
    switch (level) {
      case 1: return '#FF5722'
      case 2: return '#FF9800'
      case 3: return '#2196F3'
      case 4: return '#4CAF50'
      case 5: return '#9C27B0'
      default: return '#757575'
    }
  }

  const getLevelLabel = (level: number) => {
    const labels = ['', 'Nov', 'Basic', 'Prof', 'Adv', 'Expert']
    return labels[level] || ''
  }

  const handleEditCompetency = (operator: any, skill: any, competency?: any) => {
    setEditDialog({ open: true, operator, skill, competency })
  }

  const isExpiringSoon = (expiresAt: string) => {
    if (!expiresAt) return false
    const expiry = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30
  }

  const isExpired = (expiresAt: string) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <Box>
      {/* Controls */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Workcenter</InputLabel>
          <Select
            value={selectedWorkcenter}
            onChange={(e) => setSelectedWorkcenter(e.target.value as number)}
            label="Filter by Workcenter"
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
          {operators.length} operators × {skills.length} skills
        </Typography>
      </Box>

      {/* Legend */}
      <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Skill Levels:
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4, 5].map(level => (
            <Chip 
              key={level}
              label={`${level} - ${getLevelLabel(level)}`}
              size="small"
              sx={{ 
                backgroundColor: getLevelColor(level),
                color: '#fff',
                fontWeight: 600
              }}
            />
          ))}
          <Chip 
            label="⚠ Expiring"
            size="small"
            sx={{ backgroundColor: '#FF9800', color: '#fff' }}
          />
          <Chip 
            label="✓ Certified"
            size="small"
            sx={{ backgroundColor: '#4CAF50', color: '#fff' }}
          />
        </Box>
      </Box>

      {/* Matrix Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Box sx={{ overflow: 'auto', maxHeight: '70vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  minWidth: 200, 
                  fontWeight: 600,
                  backgroundColor: 'rgba(1,209,209,0.1)'
                }}>
                  Operator
                </TableCell>
                {skills.map((skill: any) => {
                  const requirement = getSkillRequirement(skill.id)
                  return (
                    <TableCell 
                      key={skill.id}
                      sx={{ 
                        minWidth: 100,
                        textAlign: 'center',
                        fontWeight: 600,
                        backgroundColor: requirement 
                          ? 'rgba(255,193,7,0.1)' 
                          : 'rgba(1,209,209,0.05)',
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                      }}
                    >
                      <Tooltip title={`${skill.name} - ${skill.category}${requirement ? ` (Required: Level ${requirement.minLevel}+)` : ''}`}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {skill.isCore && <StarIcon sx={{ fontSize: 14, color: '#FFC107', mr: 0.5 }} />}
                          {requirement && <WarningIcon sx={{ fontSize: 14, color: '#FF9800', mr: 0.5 }} />}
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>
                            {skill.code}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                  )
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {operators.map((operator: any) => (
                <TableRow 
                  key={operator.id}
                  sx={{ '&:hover': { backgroundColor: 'rgba(1,209,209,0.02)' } }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {operator.firstName} {operator.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {operator.employeeId} • {operator.department?.name}
                      </Typography>
                      {operator.shiftAssignments?.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {operator.shiftAssignments.map((assignment: any, index: number) => (
                            <Chip
                              key={index}
                              label={`${assignment.workcenter?.name || 'Unknown'} - ${assignment.shiftPattern?.name || 'Unknown'}`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 0.5, mb: 0.5, fontSize: '10px' }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  {skills.map((skill: any) => {
                    const competency = getOperatorCompetency(operator.id, skill.id)
                    const requirement = getSkillRequirement(skill.id)
                    const expired = competency?.expiresAt && isExpired(competency.expiresAt)
                    const expiring = competency?.expiresAt && isExpiringSoon(competency.expiresAt)
                    
                    return (
                      <TableCell 
                        key={skill.id}
                        sx={{ 
                          textAlign: 'center',
                          backgroundColor: requirement?.isRequired && !competency 
                            ? 'rgba(244,67,54,0.1)' 
                            : 'transparent'
                        }}
                      >
                        {competency ? (
                          <Tooltip title={
                            `Level ${competency.level} - ${getLevelLabel(competency.level)}
                            ${competency.certifiedAt ? `\nCertified: ${new Date(competency.certifiedAt).toLocaleDateString()}` : ''}
                            ${competency.expiresAt ? `\nExpires: ${new Date(competency.expiresAt).toLocaleDateString()}` : ''}
                            ${competency.notes ? `\nNotes: ${competency.notes}` : ''}
                            Click to edit`
                          }>
                            <IconButton
                              size="small"
                              onClick={() => handleEditCompetency(operator, skill, competency)}
                              sx={{
                                backgroundColor: getLevelColor(competency.level, expired),
                                color: '#fff',
                                minWidth: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: getLevelColor(competency.level, expired),
                                  opacity: 0.8
                                }
                              }}
                            >
                              <Box sx={{ position: 'relative' }}>
                                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                  {competency.level}
                                </Typography>
                                {skill.isCertification && competency.certifiedAt && (
                                  <CheckCircleIcon sx={{ 
                                    position: 'absolute', 
                                    top: -8, 
                                    right: -8, 
                                    fontSize: 12,
                                    color: expired ? '#F44336' : expiring ? '#FF9800' : '#4CAF50'
                                  }} />
                                )}
                              </Box>
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title={`No competency recorded. ${requirement?.isRequired ? 'REQUIRED SKILL' : 'Click to add'}`}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditCompetency(operator, skill)}
                              sx={{
                                backgroundColor: requirement?.isRequired ? '#F44336' : 'rgba(255,255,255,0.1)',
                                color: requirement?.isRequired ? '#fff' : 'rgba(255,255,255,0.7)',
                                minWidth: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: requirement?.isRequired ? '#D32F2F' : 'rgba(1,209,209,0.2)'
                                }
                              }}
                            >
                              {requirement?.isRequired ? (
                                <CancelIcon sx={{ fontSize: 16 }} />
                              ) : (
                                <Typography variant="caption">+</Typography>
                              )}
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      {/* Edit Dialog */}
      <CompetencyEditDialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false })}
        operator={editDialog.operator}
        skill={editDialog.skill}
        currentCompetency={editDialog.competency}
      />
    </Box>
  )
}
