import { useState } from 'react'
import { 
  Box, 
  Grid, 
  Paper, 
  Tabs, 
  Tab, 
  Typography,
  Chip,
  Alert
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import CompetencyMatrix from '../components/CompetencyMatrix'
import OperatorManagement from '../components/OperatorManagement'
import ShiftAssignments from '../components/ShiftAssignments'
import SkillsManagement from '../components/SkillsManagement'


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
      id={`resources-tabpanel-${index}`}
      aria-labelledby={`resources-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

function a11yProps(index: number) {
  return {
    id: `resources-tab-${index}`,
    'aria-controls': `resources-tabpanel-${index}`,
  }
}

export default function Resources() {
  const [tabValue, setTabValue] = useState(0)

  // Fetch summary data for the overview
  const { data: operators } = useQuery({
    queryKey: ['operators'],
    queryFn: async () => {
      const response = await api.get('/operators')
      return response.data
    }
  })

  const { data: expiringCerts } = useQuery({
    queryKey: ['competencies-expiring'],
    queryFn: async () => {
      const response = await api.get('/competencies', { params: { expiringDays: 30 } })
      return response.data
    }
  })

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await api.get('/skills')
      return response.data
    }
  })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const activeOperators = operators?.filter((op: any) => op.isActive)?.length || 0
  const totalSkills = skills?.length || 0
  const coreSkills = skills?.filter((skill: any) => skill.isCore)?.length || 0
  const expiringCount = expiringCerts?.length || 0

  return (
    <Box sx={{ 
      bgcolor: 'rgba(0,0,0,0.05)',
      minHeight: '100vh',
      backgroundImage: `
        radial-gradient(circle at 20% 80%, rgba(1,209,209,0.15) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(1,209,209,0.15) 0%, transparent 50%)
      `
    }}>
      {/* Header */}
      <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h4" sx={{ 
          fontFamily: 'Montserrat, sans-serif', 
          fontWeight: 700,
          mb: 2
        }}>
          Resources Management
        </Typography>
        
        {/* Summary Cards */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#01D1D1', fontWeight: 700 }}>
                {activeOperators}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Operators
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ color: '#2A9D8F', fontWeight: 700 }}>
                {totalSkills}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Skills ({coreSkills} Core)
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ 
                color: expiringCount > 0 ? '#FF9800' : '#4CAF50', 
                fontWeight: 700 
              }}>
                {expiringCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Expiring Certifications
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Chip 
                label="Resources Active"
                color="success"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                System Status
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Expiring Certifications Alert */}
        {expiringCount > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {expiringCount} Certification(s) Expiring Soon
            </Typography>
            <Typography variant="body2">
              Review the Competency Matrix to renew certifications before they expire.
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="resources management tabs"
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': {
                color: '#01D1D1'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#01D1D1'
            }
          }}
        >
          <Tab label="Competency Matrix" {...a11yProps(0)} />
          <Tab label="Operators" {...a11yProps(1)} />
          <Tab label="Skills Management" {...a11yProps(2)} />
          <Tab label="Shift Assignments" {...a11yProps(3)} />

        </Tabs>
      </Box>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        <CompetencyMatrix />
      </TabPanel>
      
      <TabPanel value={tabValue} index={1}>
        <OperatorManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={2}>
        <SkillsManagement />
      </TabPanel>
      
      <TabPanel value={tabValue} index={3}>
        <ShiftAssignments />
      </TabPanel>

    </Box>
  )
}