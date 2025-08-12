import { useState } from 'react'
import { 
  Box, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody,
  Typography,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  FormGroup,
  Checkbox,
  LinearProgress
} from '@mui/material'
import { Upload, Storage, Factory } from '@mui/icons-material'
import { useAuth } from '../auth/useAuth'
import { apiClient } from '../api/client'
import { 
  Add as AddIcon, 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

// Shift patterns configuration
const SHIFT_SCHEMES = {
  '4x12': {
    name: '4×12 Continental',
    description: 'M-W 07-19 & 19-07; Th-Su 07-19 & 19-07',
    shifts: [
      { name: 'Day A', start: '07:00', end: '19:00', days: [1, 2, 3] },
      { name: 'Night A', start: '19:00', end: '07:00', days: [1, 2, 3] },
      { name: 'Day B', start: '07:00', end: '19:00', days: [4, 5, 6, 0] },
      { name: 'Night B', start: '19:00', end: '07:00', days: [4, 5, 6, 0] }
    ]
  },
  '3x8': {
    name: '3×8 Standard',
    description: 'Standard 8-hour shifts around the clock',
    shifts: [
      { name: 'Day', start: '06:00', end: '14:00', days: [1, 2, 3, 4, 5] },
      { name: 'Afternoon', start: '14:00', end: '22:00', days: [1, 2, 3, 4, 5] },
      { name: 'Night', start: '22:00', end: '06:00', days: [1, 2, 3, 4, 5] }
    ]
  },
  '2x12': {
    name: '2×12 Weekend',
    description: 'Extended weekend shifts',
    shifts: [
      { name: 'Day Weekend', start: '07:00', end: '19:00', days: [6, 0] },
      { name: 'Night Weekend', start: '19:00', end: '07:00', days: [6, 0] }
    ]
  }
}

export default function Settings(){
  const [activeTab, setActiveTab] = useState(0)
  const [holidayDialog, setHolidayDialog] = useState(false)
  const [newHoliday, setNewHoliday] = useState({ date: '', label: '' })
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })
  
  const qc = useQueryClient()
  
  // Data queries
  const { data: wcs } = useQuery({ 
    queryKey: ['workcenters'], 
    queryFn: async () => (await api.get('/workcenters')).data 
  })
  
  const { data: holidays } = useQuery({ 
    queryKey: ['holidays'], 
    queryFn: async () => (await api.get('/holidays')).data 
  })

  // Mutations
  const addWorkcenterMut = useMutation({
    mutationFn: async (payload: any) => (await api.post('/workcenters', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['workcenters'] })
      setSnackbar({ open: true, message: 'Production line added successfully!', severity: 'success' })
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to add production line', severity: 'error' })
    }
  })

  const addHolidayMut = useMutation({
    mutationFn: async (payload: any) => (await api.post('/holidays', payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      setHolidayDialog(false)
      setNewHoliday({ date: '', label: '' })
      setSnackbar({ open: true, message: 'Holiday added successfully!', severity: 'success' })
    },
    onError: (error: any) => {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.message || 'Failed to add holiday', 
        severity: 'error' 
      })
    }
  })

  const deleteHolidayMut = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/holidays/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      setSnackbar({ open: true, message: 'Holiday deleted successfully!', severity: 'success' })
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to delete holiday', severity: 'error' })
    }
  })

  function addLine(e: any) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload = {
      plantId: 1,
      departmentId: 1,
      workcenterNo: String(form.get('wc')),
      name: String(form.get('name')),
      displayTitle: String(form.get('display') || form.get('name')),
      defaultSchemeId: 1,
      minStaff: Number(form.get('min') || 0)
    }
    addWorkcenterMut.mutate(payload)
    e.currentTarget.reset()
  }

  function handleAddHoliday() {
    if (newHoliday.date && newHoliday.label) {
      addHolidayMut.mutate({
        plantId: 1,
        date: new Date(newHoliday.date).toISOString(),
        label: newHoliday.label
      })
    }
  }

  const currentYearHolidays = holidays?.filter((h: any) => 
    new Date(h.date).getFullYear() === new Date().getFullYear()
  ) || []

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[dayIndex]
  }

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Typography variant="h4" sx={{ mb: 3, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}>
        Production Settings
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Production Lines" />
          <Tab label="Holidays" />
          <Tab label="Shift Patterns" />
          <Tab label="Overtime Settings" />
          <Tab label="Data Import" />
        </Tabs>
      </Box>

      {/* Production Lines Tab */}
      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Add New Production Line
                </Typography>
                <Box component="form" onSubmit={addLine} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField 
                    name="wc" 
                    label="Work Center #" 
                    required
                    size="small"
                    helperText="Unique identifier for the production line"
                  />
                  <TextField 
                    name="name" 
                    label="Line Name" 
                    required
                    size="small"
                    helperText="Internal name for the production line"
                  />
                  <TextField 
                    name="display" 
                    label="Display Title" 
                    size="small"
                    helperText="Name shown to operators (optional)"
                  />
                  <TextField 
                    name="min" 
                    label="Minimum Staff" 
                    type="number"
                    size="small"
                    defaultValue={0}
                    inputProps={{ min: 0, max: 20 }}
                    helperText="Minimum operators required"
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={addWorkcenterMut.isPending}
                    startIcon={<AddIcon />}
                  >
                    {addWorkcenterMut.isPending ? 'Adding...' : 'Add Production Line'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Current Production Lines ({(wcs || []).length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Line Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>WC #</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Min Staff</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(wcs || []).map((wc: any) => (
                      <TableRow key={wc.id}>
                        <TableCell sx={{ fontWeight: 500 }}>{wc.displayTitle || wc.name}</TableCell>
                        <TableCell>
                          <Chip label={wc.workcenterNo} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>{wc.minStaff}</TableCell>
                        <TableCell>Packaging</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Holidays Tab */}
      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Holidays ({currentYearHolidays.length}/20 for {new Date().getFullYear()})
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setHolidayDialog(true)}
                    disabled={currentYearHolidays.length >= 20}
                  >
                    Add Holiday
                  </Button>
                </Box>
                
                {currentYearHolidays.length >= 18 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {currentYearHolidays.length >= 20 
                      ? 'Maximum of 20 holidays per year reached' 
                      : `Only ${20 - currentYearHolidays.length} holidays remaining for this year`
                    }
                  </Alert>
                )}

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Holiday Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Day of Week</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentYearHolidays.map((holiday: any) => (
                      <TableRow key={holiday.id}>
                        <TableCell>
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{holiday.label}</TableCell>
                        <TableCell>
                          <Chip 
                            label={new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'long' })}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => deleteHolidayMut.mutate(holiday.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Holiday Guidelines
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Maximum 20 holidays per plant per year
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Holidays affect production scheduling
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  • Weekend holidays may not impact schedules
                </Typography>
                <Typography variant="body2">
                  • Delete holidays to stay within limits
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Shift Patterns Tab */}
      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {Object.entries(SHIFT_SCHEMES).map(([key, scheme]) => (
            <Grid item xs={12} md={4} key={key}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                    {scheme.name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  {scheme.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Shift Schedule:
                </Typography>
                
                {scheme.shifts.map((shift, index) => (
                  <Box key={index} sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {shift.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {shift.start} - {shift.end}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      {shift.days.map((day) => (
                        <Chip
                          key={day}
                          label={getDayName(day).slice(0, 3)}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '10px', height: 20 }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
                
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ mt: 2 }}
                  disabled={key === '4x12'} // Default scheme
                >
                  {key === '4x12' ? 'Current Default' : 'Set as Default'}
                </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Overtime Settings Tab */}
      <TabPanel value={activeTab} index={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Weekend Overtime
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label="Enable Saturday Production"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Enable Sunday Production"
                  />
                </FormGroup>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Extended Shift Hours
                </Typography>
                
                <FormGroup>
                  <FormControlLabel
                    control={<Switch />}
                    label="Allow 10-hour shifts"
                  />
                  <FormControlLabel
                    control={<Switch />}
                    label="Allow 12-hour shifts"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Date Range Overrides
                </Typography>
                
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  Configure temporary overtime periods for specific date ranges
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Override Name"
                    size="small"
                    placeholder="e.g., Holiday Rush"
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Start Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      label="End Date"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox />}
                      label="Saturday overtime"
                    />
                    <FormControlLabel
                      control={<Checkbox />}
                      label="Sunday overtime"
                    />
                    <FormControlLabel
                      control={<Checkbox />}
                      label="Extended shifts (10-12h)"
                    />
                  </FormGroup>
                  
                  <Button variant="outlined" startIcon={<AddIcon />}>
                    Add Override Period
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Data Import Tab */}
      <TabPanel value={activeTab} index={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Storage sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Production Data Import
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Import comprehensive manufacturing data to populate your AIPS system with realistic production scenarios.
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    What will be imported:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip icon={<Factory />} label="Manufacturing Plant" size="small" />
                    <Chip label="4 Departments" size="small" />
                    <Chip label="5 Workcenters" size="small" />
                    <Chip label="10 Operators" size="small" />
                    <Chip label="25 Production Orders" size="small" />
                    <Chip label="15 Schedule Blocks" size="small" />
                    <Chip label="Skills & Competencies" size="small" />
                    <Chip label="Shift Assignments" size="small" />
                  </Box>
                </Box>

                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Warning:</strong> This will replace all existing production data. Make sure you have a backup if needed.
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  startIcon={<Upload />}
                  onClick={() => {/* We'll add this function */}}
                  size="large"
                  sx={{ mr: 2 }}
                >
                  Import Production Data
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={() => {/* We'll add this function */}}
                >
                  Check Current Data
                </Button>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Import Status
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Ready to import comprehensive manufacturing data
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Current System Status:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Plants:</Typography>
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Orders:</Typography>
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Operators:</Typography>
                    <Typography variant="body2" color="text.secondary">Loading...</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Holiday Dialog */}
      <Dialog open={holidayDialog} onClose={() => setHolidayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Holiday</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Holiday Date"
              type="date"
              value={newHoliday.date}
              onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Holiday Name"
              value={newHoliday.label}
              onChange={(e) => setNewHoliday({ ...newHoliday, label: e.target.value })}
              placeholder="e.g., Christmas Day"
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHolidayDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddHoliday} 
            variant="contained"
            disabled={!newHoliday.date || !newHoliday.label || addHolidayMut.isPending}
          >
            {addHolidayMut.isPending ? 'Adding...' : 'Add Holiday'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
  )
}
