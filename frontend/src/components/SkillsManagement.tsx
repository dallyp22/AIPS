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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material'
import { Add as AddIcon, Star as StarIcon, Security as SecurityIcon } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface SkillDialogProps {
  open: boolean
  onClose: () => void
}

function SkillDialog({ open, onClose }: SkillDialogProps) {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'Technical' as 'Technical' | 'Safety' | 'Leadership' | 'Quality',
    isCore: false,
    isCertification: false,
    expiryMonths: ''
  })

  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        expiryMonths: data.expiryMonths ? parseInt(data.expiryMonths) : null
      }
      const response = await api.post('/skills', payload)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] })
      onClose()
      setFormData({
        code: '',
        name: '',
        description: '',
        category: 'Technical',
        isCore: false,
        isCertification: false,
        expiryMonths: ''
      })
    },
    onError: (error: any) => {
      console.error('Error creating skill:', error)
      // Handle error gracefully - you could add a toast notification here
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
      <DialogTitle>Add New Skill</DialogTitle>
      <DialogContent>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Skill Code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              helperText="Short code (e.g., MECH_L1, QC_VISUAL)"
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="Safety">Safety</MenuItem>
                <MenuItem value="Leadership">Leadership</MenuItem>
                <MenuItem value="Quality">Quality</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Skill Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isCore}
                  onChange={(e) => handleChange('isCore', e.target.checked)}
                />
              }
              label="Core Skill (Required for basic operations)"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isCertification}
                  onChange={(e) => handleChange('isCertification', e.target.checked)}
                />
              }
              label="Requires Certification"
            />
          </Grid>
          {formData.isCertification && (
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expiry Months"
                type="number"
                value={formData.expiryMonths}
                onChange={(e) => handleChange('expiryMonths', e.target.value)}
                helperText="How many months until recertification needed"
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained"
          disabled={saveMutation.isPending || !formData.code || !formData.name}
        >
          Add Skill
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default function SkillsManagement() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')

  try {

  const { data: skills, isLoading, error } = useQuery({
    queryKey: ['skills', categoryFilter],
    queryFn: async () => {
      try {
        const params = categoryFilter ? { category: categoryFilter } : {}
        const response = await api.get('/skills', { params })
        return response.data
      } catch (error) {
        console.error('Error fetching skills:', error)
        throw error
      }
    },
    retry: 2,
    retryDelay: 1000
  })

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading skills...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          Failed to load skills. Please try refreshing the page.
        </Alert>
      </Box>
    )
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Technical': return '#2196F3'
      case 'Safety': return '#F44336'
      case 'Leadership': return '#9C27B0'
      case 'Quality': return '#4CAF50'
      default: return '#757575'
    }
  }

  const categories = ['Technical', 'Safety', 'Leadership', 'Quality']

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Skills Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: '#01D1D1', '&:hover': { bgcolor: '#00B8B8' } }}
        >
          Add Skill
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as string)}
            label="Category"
          >
            <MenuItem value="">All Categories</MenuItem>
            {categories.map(cat => (
              <MenuItem key={cat} value={cat}>{cat}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Typography variant="body2" color="text.secondary">
          {skills?.length || 0} skills total
        </Typography>
      </Box>

      {/* Skills Table */}
      <Paper sx={{ overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'rgba(1,209,209,0.1)' }}>
              <TableCell sx={{ fontWeight: 600 }}>Skill</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Operators</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skills?.map((skill: any) => (
              <TableRow 
                key={skill.id}
                sx={{ '&:hover': { backgroundColor: 'rgba(1,209,209,0.02)' } }}
              >
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {skill.isCore && (
                      <StarIcon sx={{ fontSize: 16, color: '#FFC107' }} />
                    )}
                    {skill.isCertification && (
                      <SecurityIcon sx={{ fontSize: 16, color: '#FF9800' }} />
                    )}
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {skill.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skill.code}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Chip
                    label={skill.category}
                    size="small"
                    sx={{ 
                      backgroundColor: getCategoryColor(skill.category),
                      color: '#fff',
                      fontWeight: 600
                    }}
                  />
                </TableCell>
                
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                    {skill.isCore && (
                      <Chip
                        label="Core Skill"
                        size="small"
                        color="warning"
                        sx={{ fontSize: '10px', height: 20 }}
                      />
                    )}
                    {skill.isCertification && (
                      <Chip
                        label={`Certification${skill.expiryMonths ? ` (${skill.expiryMonths}mo)` : ''}`}
                        size="small"
                        color="error"
                        sx={{ fontSize: '10px', height: 20 }}
                      />
                    )}
                  </Box>
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {skill.competencies?.length || 0} operators
                  </Typography>
                  {skill.competencies?.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {skill.competencies.slice(0, 3).map((comp: any, index: number) => (
                        <Chip
                          key={index}
                          label={`${comp.operator.firstName} ${comp.operator.lastName} (L${comp.level})`}
                          size="small"
                          sx={{ 
                            mr: 0.5, 
                            mb: 0.5, 
                            fontSize: '10px', 
                            height: 20,
                            backgroundColor: 'rgba(1,209,209,0.1)',
                            color: '#01D1D1'
                          }}
                        />
                      ))}
                      {skill.competencies.length > 3 && (
                        <Chip
                          label={`+${skill.competencies.length - 3} more`}
                          size="small"
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      )}
                    </Box>
                  )}
                </TableCell>
                
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 300 }}>
                    {skill.description || 'No description provided'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Add Dialog */}
      <SkillDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </Box>
  )
  } catch (error) {
    console.error('Error in SkillsManagement component:', error)
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          An error occurred in the Skills Management component. Please check the console for details.
        </Alert>
      </Box>
    )
  }
}
